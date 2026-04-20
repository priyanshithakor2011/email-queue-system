import { describe, it, expect } from "vitest";
import { classifySESError } from "./error-classifier.js";

describe("SES Error Classifier", () => {
    it("should classify Throttling as retryable", () => {
        const error = { name: "Throttling", message: "Back off" };
        const result = classifySESError(error);
        expect(result.category).toBe("throttled");
        expect(result.isRetryable).toBe(true);
    });

    it("should classify MessageRejected as permanent", () => {
        const error = { name: "MessageRejected", message: "Blacklisted" };
        const result = classifySESError(error);
        expect(result.category).toBe("permanent");
        expect(result.isRetryable).toBe(false);
    });

    it("should classify InvalidParameterValue as permanent", () => {
        const error = { name: "InvalidParameterValue", message: "Malformed email" };
        const result = classifySESError(error);
        expect(result.category).toBe("permanent");
        expect(result.isRetryable).toBe(false);
    });

    it("should default to retryable for unknown errors", () => {
        const error = { name: "RandomNetworkError", message: "Cable unplugged" };
        const result = classifySESError(error);
        expect(result.category).toBe("retryable");
        expect(result.isRetryable).toBe(true);
    });
});
