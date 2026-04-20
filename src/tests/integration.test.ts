import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EmailQueueSystem } from "../queue/index.js";
import { EmailWorker } from "../worker/index.js";
import { SESService } from "../services/ses.service.js";
import { MockSESClient } from "../services/ses.mock.js";
import { JobStatus } from "../types/index.js";

/**
 * Integration Test: Real Redis + Mocked SES
 * This test expects Redis to be running locally at 6379.
 */
describe("End-to-End Integration Flow", () => {
    let queueSystem: EmailQueueSystem;
    let worker: EmailWorker;
    let mockSESClient: MockSESClient;

    beforeEach(async () => {
        // Initialize real queue with real connection
        queueSystem = new EmailQueueSystem();

        // Clear queue for fresh test
        await queueSystem.queue.obliterate({ force: true });

        // Setup mocked SES service
        mockSESClient = new MockSESClient();
        const sesService = new SESService();
        // Inject mock client into the service
        (sesService as any).client = mockSESClient;

        // Initialize worker with mocked SES service
        // Since EmailWorker and processor are tightly coupled, we need to mock processor or SESService globally
        // For integration, we'll try to mock SESClient at the factory level if possible
        vi.spyOn(SESService.prototype, "sendEmail").mockImplementation(async (params) => {
            return sesService.sendEmail(params);
        });

        worker = new EmailWorker();
    });

    afterEach(async () => {
        await queueSystem.close();
        await worker.close();
        vi.restoreAllMocks();
    });

    it("should process a job successfully from queue to SES", async () => {
        mockSESClient.mockSuccess("ses-message-id-123");

        const testEmail = {
            to: "integration@example.com",
            subject: "Integration Test",
            text: "Full flow testing",
            priority: "high" as const,
        };

        const job = await queueSystem.addEmailJob(testEmail);
        expect(job.id).toBeDefined();

        // Wait for worker to pick up and finish
        let status: JobStatus | "failed" | "completed" = await job.getState();
        const timeout = 5000;
        const start = Date.now();

        while (status !== "completed" && status !== "failed" && Date.now() - start < timeout) {
            await new Promise((r) => setTimeout(r, 100));
            status = await job.getState();
        }

        expect(status).toBe("completed");
        const result = await job.returnvalue;
        expect(result.success).toBe(true);
        expect(result.messageId).toBe("ses-message-id-123");
        expect(mockSESClient.send).toHaveBeenCalled();
    });

    it("should move MessageRejected errors to DLQ immediately", async () => {
        mockSESClient.mockError("MessageRejected", "Email rejected definitely");

        const testEmail = {
            to: "bad@example.com",
            subject: "Permanent Error Test",
            text: "This will fail",
        };

        const job = await queueSystem.addEmailJob(testEmail);

        // Wait for job to fail
        let status = await job.getState();
        const timeout = 5000;
        const start = Date.now();

        while (status !== "failed" && Date.now() - start < timeout) {
            await new Promise((r) => setTimeout(r, 100));
            status = await job.getState();
        }

        expect(status).toBe("failed");

        // Check if moved to DLQ
        // DLQ jobId = `dlq-${job.id}`
        const dlqJobId = `dlq-${job.id}`;
        let dlqJob = await queueSystem.dlq.getJob(dlqJobId);

        // Since moving might take a bit of extra time in the event listener
        const dlqTimeout = 1000;
        const dlqStart = Date.now();
        while (!dlqJob && Date.now() - dlqStart < dlqTimeout) {
            await new Promise((r) => setTimeout(r, 50));
            dlqJob = await queueSystem.dlq.getJob(dlqJobId);
        }

        expect(dlqJob).toBeDefined();
        expect(dlqJob?.id).toBe(dlqJobId);
    });

    it("should retry transient errors and succeed eventually", async () => {
        // First 2 calls fail with Throttling, 3rd call succeeds
        mockSESClient.send
            .mockRejectedValueOnce({ name: "Throttling", message: "Slow down" })
            .mockRejectedValueOnce({ name: "Throttling", message: "Slow down" })
            .mockResolvedValueOnce({ MessageId: "success-after-retry" });

        const testEmail = {
            to: "retry@example.com",
            subject: "Retry Test",
            text: "Testing backoff",
        };

        const job = await queueSystem.addEmailJob(testEmail);

        // Wait for completion (might take a few seconds due to backoff)
        let status = await job.getState();
        const timeout = 10000; // Longer timeout for retries
        const start = Date.now();

        while (status !== "completed" && Date.now() - start < timeout) {
            await new Promise((r) => setTimeout(r, 500));
            status = await job.getState();
        }

        expect(status).toBe("completed");
        expect(mockSESClient.send).toHaveBeenCalledTimes(3);

        const res = await job.returnvalue;
        expect(res.messageId).toBe("success-after-retry");
    });

    it("should enforce rate limiting throughput", async () => {
        // Mock all sends to be fast
        mockSESClient.mockSuccess("bulk-id");

        const count = 20;
        const rateLimit = 14; // Default is 14/sec

        const jobs = [];
        for (let i = 0; i < count; i++) {
            jobs.push(
                queueSystem.addEmailJob({
                    to: `user${i}@example.com`,
                    subject: `Rate Test ${i}`,
                    text: "Testing throughput",
                }),
            );
        }

        const createdJobs = await Promise.all(jobs);
        const startTime = Date.now();

        // Wait for all to complete
        let completedCount = 0;
        while (completedCount < count && Date.now() - startTime < 10000) {
            completedCount = 0;
            for (const job of createdJobs) {
                if (await job.isCompleted()) completedCount++;
            }
            if (completedCount < count) await new Promise((r) => setTimeout(r, 200));
        }

        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;

        expect(completedCount).toBe(count);
        // If we processed 20 jobs at 14/sec, it should take at least 20/14 ≈ 1.42s
        // We add some buffer for overhead, but it definitely shouldn't be under 1s
        logger.info({ durationSeconds, count }, "Rate limit test completed");
        expect(durationSeconds).toBeGreaterThan(1);
    });
});
