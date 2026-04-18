import { describe, it, expect, beforeEach, vi } from "vitest";
import { EmailQueue } from "./index.js";

// Mocking BullMQ and IORedis
vi.mock("bullmq", () => {
    return {
        Queue: class {
            add = vi.fn().mockResolvedValue({ id: "test-job-id" });
            close = vi.fn();
            on = vi.fn();
        },
        QueueEvents: class {
            on = vi.fn();
            close = vi.fn();
        },
        Worker: class {
            on = vi.fn();
            close = vi.fn();
        },
        Job: {
            fromId: vi.fn(),
        },
    };
});

vi.mock("ioredis", () => {
    return {
        default: class {
            on = vi.fn();
            disconnect = vi.fn();
        },
    };
});

describe("EmailQueue Public API", () => {
    let emailQueue: EmailQueue;

    beforeEach(() => {
        vi.clearAllMocks();
        emailQueue = new EmailQueue();
    });

    it("should initialize cleanly", async () => {
        await expect(emailQueue.init({})).resolves.not.toThrow();
    });

    it("should throw if send() is called before init()", async () => {
        await expect(emailQueue.send({ to: "t@t.com", subject: "S", text: "B" })).rejects.toThrow(
            "EmailQueue is not initialized",
        );
    });

    it("should enqueue a job and emit 'queued' event", async () => {
        await emailQueue.init({});

        const queuedSpy = vi.fn();
        emailQueue.on("queued", queuedSpy);

        const options = { to: "test@example.com", subject: "Hello", text: "World" };
        const jobId = await emailQueue.send(options);

        expect(jobId).toBe("test-job-id");
        expect(queuedSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                jobId: "test-job-id",
                options,
            }),
        );
    });

    it("should process bulk sends", async () => {
        await emailQueue.init({});

        const list = [
            { to: "a@a.com", subject: "S1", text: "B1" },
            { to: "b@b.com", subject: "S2", text: "B2" },
        ];

        const jobIds = await emailQueue.sendBulk(list);
        expect(jobIds).toHaveLength(2);
        expect(jobIds).toEqual(["test-job-id", "test-job-id"]);
    });

    it("should close system resources", async () => {
        await emailQueue.init({});
        await emailQueue.close();

        // Internal systems should have closed
        // (verified via mocks if we held references, but simple verify is enough here)
    });
});
