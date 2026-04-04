import { describe, it, expect } from "vitest";
import { init, emailOptionsSchema } from "./schema.js";

describe("QueueConfig Validation", () => {
    it("should initialize with default values when no config is provided", () => {
        const config = init();
        expect(config.maxRetries).toBe(3);
        expect(config.rateLimitPerSecond).toBe(14);
        expect(config.logLevel).toBe("info");
        expect(config.redis.host).toBe("localhost");
        expect(config.ses.region).toBe("us-east-1");
    });

    it("should override default values when provided", () => {
        const customConfig = {
            maxRetries: 5,
            rateLimitPerSecond: 20,
            logLevel: "error" as const,
            redis: {
                host: "redis.example.com",
                port: 1234,
            },
        };
        const config = init(customConfig);
        expect(config.maxRetries).toBe(5);
        expect(config.rateLimitPerSecond).toBe(20);
        expect(config.logLevel).toBe("error");
        expect(config.redis.host).toBe("redis.example.com");
        expect(config.redis.port).toBe(1234);
    });

    it("should throw an error for invalid logLevel", () => {
        expect(() => init({ logLevel: "invalid" as any })).toThrow();
    });

    it("should throw an error for negative maxRetries", () => {
        expect(() => init({ maxRetries: -1 })).toThrow();
    });

    it("should throw an error for zero or negative rateLimitPerSecond", () => {
        expect(() => init({ rateLimitPerSecond: 0 })).toThrow();
        expect(() => init({ rateLimitPerSecond: -1 })).toThrow();
    });
});

describe("EmailOptions Validation", () => {
    it("should validate a valid email option with HTML", () => {
        const validEmail = {
            to: "test@example.com",
            subject: "Hello",
            html: "<h1>Hi</h1>",
        };
        expect(() => emailOptionsSchema.parse(validEmail)).not.toThrow();
    });

    it("should validate a valid email option with multiple recipients", () => {
        const validEmail = {
            to: ["a@example.com", "b@example.com"],
            subject: "Hello",
            text: "Hi",
        };
        expect(() => emailOptionsSchema.parse(validEmail)).not.toThrow();
    });

    it("should throw an error if html, text, and templateId are all missing", () => {
        const invalidEmail = {
            to: "test@example.com",
            subject: "Hello",
        };
        expect(() => emailOptionsSchema.parse(invalidEmail)).toThrow(
            "At least one of html, text, or templateId must be provided.",
        );
    });

    it("should throw an error for invalid email addresses", () => {
        const invalidEmail = {
            to: "invalid-email",
            subject: "Hello",
            text: "Hi",
        };
        expect(() => emailOptionsSchema.parse(invalidEmail)).toThrow();
    });

    it("should throw an error for empty subject", () => {
        const invalidEmail = {
            to: "test@example.com",
            subject: "",
            text: "Hi",
        };
        expect(() => emailOptionsSchema.parse(invalidEmail)).toThrow();
    });
});
