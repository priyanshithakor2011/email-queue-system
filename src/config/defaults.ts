import { QueueConfig } from "../types/index.js";

export const DEFAULT_CONFIG: Partial<QueueConfig> = {
    maxRetries: 3,
    rateLimitPerSecond: 14,
    logLevel: "info",
    redis: {
        host: "localhost",
        port: 6379,
    },
    ses: {
        region: "us-east-1",
    },
};
