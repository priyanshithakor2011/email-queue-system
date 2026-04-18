import { z } from "zod";
import { DEFAULT_CONFIG } from "./defaults.js";
import { QueueConfig } from "../types/index.js";

export const redisConfigSchema = z.object({
    host: z.string().default(DEFAULT_CONFIG.redis!.host),
    port: z.number().int().positive().default(DEFAULT_CONFIG.redis!.port),
    password: z.string().optional(),
    tls: z.boolean().optional(),
});

export const sesConfigSchema = z.object({
    region: z.string().default(DEFAULT_CONFIG.ses!.region),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
});

export const logLevelSchema = z
    .enum(["info", "warn", "error", "debug"])
    .default(DEFAULT_CONFIG.logLevel!);

export const queueConfigSchema = z.object({
    redis: redisConfigSchema.default(DEFAULT_CONFIG.redis as any),
    ses: sesConfigSchema.default(DEFAULT_CONFIG.ses as any),
    rateLimitPerSecond: z
        .number()
        .int()
        .positive()
        .min(1)
        .default(DEFAULT_CONFIG.rateLimitPerSecond!),
    ratePerDay: z.number().int().positive().min(1).default(DEFAULT_CONFIG.ratePerDay!),
    maxRetries: z.number().int().nonnegative().default(DEFAULT_CONFIG.maxRetries!),
    logLevel: logLevelSchema,
});

export const attachmentSchema = z.object({
    filename: z.string(),
    content: z.union([z.string(), z.any()]), // content can be string or Buffer
    contentType: z.string().optional(),
});

export const emailOptionsSchema = z
    .object({
        to: z.union([z.string().email(), z.array(z.string().email())]),
        from: z.string().email().optional(),
        subject: z.string().min(1),
        html: z.string().optional(),
        text: z.string().optional(),
        templateId: z.string().optional(),
        attachments: z.array(attachmentSchema).optional(),
        correlationId: z.string().optional(),
    })
    .refine((data) => data.html || data.text || data.templateId, {
        message: "At least one of html, text, or templateId must be provided.",
        path: ["html", "text", "templateId"],
    });

export function init(config: Partial<QueueConfig> = {}): QueueConfig {
    return queueConfigSchema.parse(config);
}
