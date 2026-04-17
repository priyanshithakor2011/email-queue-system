import { describe, it, expect } from "vitest";
import { calculateBackoff, isRetryable } from "./retry.js";

describe("Retry Logic", () => {
    describe("calculateBackoff", () => {
        it("should calculate exponential backoff correctly", () => {
            const delay1 = calculateBackoff(1, 1000);
            // 2^(1-1) * 1000 = 1000. Jitter +/- 200.
            expect(delay1).toBeGreaterThanOrEqual(800);
            expect(delay1).toBeLessThanOrEqual(1200);

            const delay2 = calculateBackoff(2, 1000);
            // 2^(2-1) * 1000 = 2000. Jitter +/- 400.
            expect(delay2).toBeGreaterThanOrEqual(1600);
            expect(delay2).toBeLessThanOrEqual(2400);

            const delay3 = calculateBackoff(3, 1000);
            // 2^(3-1) * 1000 = 4000. Jitter +/- 800.
            expect(delay3).toBeGreaterThanOrEqual(3200);
            expect(delay3).toBeLessThanOrEqual(4800);
        });
    });

    describe("isRetryable", () => {
        it("should return false for permanent errors", () => {
            expect(isRetryable({ name: "MessageRejected" })).toBe(false);
            expect(isRetryable({ code: "InvalidParameterValue" })).toBe(false);
            expect(isRetryable("ValidationError")).toBe(false);
        });

        it("should return true for transient errors", () => {
            expect(isRetryable({ name: "InternalError" })).toBe(true);
            expect(isRetryable({ code: "Throttling" })).toBe(true);
            expect(isRetryable("NetworkError")).toBe(true);
            expect(isRetryable(null)).toBe(true);
        });
    });
});
