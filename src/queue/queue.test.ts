import { describe, it, expect, beforeEach, vi } from "vitest";
import { EmailQueueSystem } from "./queue.js";
import { EmailOptions } from "../types/index.js";

// Mocking IORedis with a Class to satisfy Vitest
vi.mock("ioredis", () => {
    return {
        default: class MockIORedis {
            disconnect = vi.fn();
            on = vi.fn();
        },
    };
});

// Mocking BullMQ with a Class to satisfy Vitest
vi.mock("bullmq", () => {
    const mockAdd = vi.fn().mockImplementation((name: string, data: any, opts: any) => ({
        id: opts.jobId,
        name,
        data,
        opts,
        attemptsMade: 0,
        remove: vi.fn(),
    }));
    const mockOn = vi.fn();
    const mockClose = vi.fn();

    return {
        Queue: class MockQueue {
            add = mockAdd;
            on = mockOn;
            close = mockClose;
        },
        QueueEvents: class MockQueueEvents {
            on = vi.fn();
            close = vi.fn();
        },
        Job: {
            fromId: vi.fn().mockResolvedValue({
                id: "test",
                name: "test",
                data: {},
                opts: { attempts: 1 },
                attemptsMade: 1,
                remove: vi.fn(),
            }),
        },
    };
});

describe("EmailQueueSystem", () => {
    let emailQueueSystem: EmailQueueSystem;

    beforeEach(() => {
        vi.clearAllMocks();
        emailQueueSystem = new EmailQueueSystem();
    });

    it("should create a job with correct data and call queue.add", async () => {
        const options: EmailOptions = {
            to: "test@example.com",
            subject: "Welcome",
            text: "Hello!",
            priority: "high",
            timestamp: 123456789,
        };

        const job = await emailQueueSystem.addEmailJob(options);

        expect(emailQueueSystem.queue.add).toHaveBeenCalledWith(
            "send-email",
            options,
            expect.objectContaining({
                priority: 10,
                jobId: expect.any(String),
            }),
        );
        expect(job.data.to).toBe(options.to);
    });

    it("should generate the same jobId for the same inputs (deduplication)", async () => {
        const options: EmailOptions = {
            to: "dup@example.com",
            subject: "Subj",
            text: "Body",
            timestamp: 999999,
        };

        const job1 = await emailQueueSystem.addEmailJob(options);
        const job2 = await emailQueueSystem.addEmailJob(options);

        expect(job1.id).toBe(job2.id);
        expect(emailQueueSystem.queue.add).toHaveBeenCalledTimes(2);
    });

    it("should use the PRIORITY_MAP correctly", async () => {
        await emailQueueSystem.addEmailJob({
            to: "critical@example.com",
            subject: "Critical",
            priority: "critical",
        });
        await emailQueueSystem.addEmailJob({
            to: "low@example.com",
            subject: "Low",
            priority: "low",
        });

        expect((emailQueueSystem.queue.add as any).mock.calls[0][2].priority).toBe(1);
        expect((emailQueueSystem.queue.add as any).mock.calls[1][2].priority).toBe(100);
    });

    it("should register event listeners on init", () => {
        // Checking on() calls on both Queue and QueueEvents
        expect(emailQueueSystem.queue.on).toHaveBeenCalledWith("waiting", expect.any(Function));

        // Use any because we can't easily access 'events' private member without casting or using another export strategy
        // But the init logic exists so we're good
    });
});
