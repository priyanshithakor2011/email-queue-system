import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    REDIS_URL: z.string().url().default("redis://localhost:6379"),
    AWS_REGION: z.string().default("us-east-1"),
    LOG_LEVEL: z.string().default("info"),
});

export const config = envSchema.parse(process.env);
