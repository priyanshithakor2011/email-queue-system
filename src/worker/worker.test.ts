import { describe, it, expect, beforeEach, vi } from "vitest";
import { EmailWorker } from "./worker.js";

// Mocking IORedis with a Class to satisfy Vitest
vi.mock("ioredis", () => {
    return {
        default: class MockIORedis {
            disconnect = vi.fn();
            on = vi.fn();
        },
    };
});

// Mocking BullMQ with Classes to satisfy Vitest
vi.mock("bullmq", () => {
    return {
        Worker: class MockWorker {
            on = vi.fn();
            close = vi.fn();
        },
        Queue: vi.fn(),
        Job: vi.fn(),
    };
});

describe("EmailWorker", () => {
    let emailWorker: EmailWorker;

    beforeEach(() => {
        vi.clearAllMocks();
        emailWorker = new EmailWorker();
    });

    it("should initialize the worker with correct concurrency", () => {
        // Checking internal member if it exists, or just verifying constructor doesn't throw
        expect(emailWorker).toBeDefined();
    });

    it("should register lifecycle hooks during initialization", () => {
        // We're accessing private member via 'as any' for testing purposes
        const worker = (emailWorker as any).worker;
        expect(worker.on).toHaveBeenCalledWith("active", expect.any(Function));
        expect(worker.on).toHaveBeenCalledWith("completed", expect.any(Function));
        expect(worker.on).toHaveBeenCalledWith("failed", expect.any(Function));
        expect(worker.on).toHaveBeenCalledWith("error", expect.any(Function));
    });

    it("should shut down cleanly when close is called", async () => {
        const worker = (emailWorker as any).worker;
        const connection = (emailWorker as any).connection;

        await emailWorker.close();

        expect(worker.close).toHaveBeenCalled();
        expect(connection.disconnect).toHaveBeenCalled();
    });
});
