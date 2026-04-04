export interface Attachment {
    filename: string;
    content: string | Buffer;
    contentType?: string;
}

export interface EmailOptions {
    to: string | string[];
    from?: string;
    subject: string;
    html?: string;
    text?: string;
    templateId?: string;
    attachments?: Attachment[];
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    tls?: boolean;
}

export interface SESConfig {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
}

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface QueueConfig {
    redis: RedisConfig;
    ses: SESConfig;
    rateLimitPerSecond: number;
    maxRetries: number;
    logLevel: LogLevel;
}

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface JobResult {
    jobId: string;
    status: JobStatus;
    messageId?: string;
    error?: string;
}
