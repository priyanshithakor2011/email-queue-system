import { describe, it, expect, beforeEach, vi } from "vitest";
import { TokenBucket } from "./token-bucket.js";

// Mocking IORedis
vi.mock("ioredis", () => {
    return {
        default: class MockIORedis {
            private storage: Record<string, number> = {};

            incr = vi.fn().mockImplementation(async (key: string) => {
                this.storage[key] = (this.storage[key] || 0) + 1;
                return this.storage[key];
            });

            expire = vi.fn().mockResolvedValue(1);

            del = vi.fn().mockImplementation(async (...keys: string[]) => {
                keys.forEach((k) => delete this.storage[k]);
                return keys.length;
            });

            keys = vi.fn().mockImplementation(async (pattern: string) => {
                return Object.keys(this.storage).filter((k) =>
                    k.startsWith(pattern.replace("*", "")),
                );
            });
        },
    };
});

describe("TokenBucket Rate Limiter", () => {
    let mockRedis: any;
    let bucket: TokenBucket;

    beforeEach(async () => {
        vi.clearAllMocks();
        const IORedis = (await import("ioredis")).default;
        mockRedis = new IORedis();
        bucket = new TokenBucket({
            redis: mockRedis,
            keyPrefix: "test-bucket",
            ratePerSecond: 2,
            ratePerDay: 5,
        });
    });

    it("should allow consumption within limits", async () => {
        expect(await bucket.consume()).toBe(true);
        expect(await bucket.consume()).toBe(true);
    });

    it("should block when per-second limit is exceeded", async () => {
        await bucket.consume();
        await bucket.consume();
        expect(await bucket.consume()).toBe(false);
    });

    it("should block when per-day limit is exceeded", async () => {
        // Mocking the redis state to simulate many calls across different seconds but same day
        mockRedis.incr.mockResolvedValueOnce(1); // day count 1
        mockRedis.incr.mockResolvedValueOnce(1); // sec count 1
        await bucket.consume();

        mockRedis.incr.mockResolvedValueOnce(6); // day count 6 (Limit is 5)
        expect(await bucket.consume()).toBe(false);
    });
});
