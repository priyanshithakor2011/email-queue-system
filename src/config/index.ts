import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    REDIS_URL: z.string().url().default("redis://localhost:6379"),
    AWS_REGION: z.string().default("us-east-1"),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    LOG_LEVEL: z.string().default("info"),
    ERROR_LOG_FILE: z.string().default("error.log"),
});

export const config = envSchema.parse(process.env);
