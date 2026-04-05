import { Queue, QueueEvents, Job } from "bullmq";
import IORedis from "ioredis";
import { createHash } from "node:crypto";
import { EmailOptions, QueueConfig, JobPriority } from "../types/index.js";
import { init } from "../config/schema.js";
import { logger } from "../logger/index.js";

// Priority Mapping for BullMQ (Lower numbers = Higher priority)
export const PRIORITY_MAP: Record<JobPriority, number> = {
    critical: 1,
    high: 10,
    normal: 50,
    low: 100,
};

export class EmailQueueSystem {
    public queue: Queue;
    public dlq: Queue;
    private connection: IORedis;
    private config: QueueConfig;
    private queueName = "email-queue";
    private dlqName = "email-dlq";

    private events: QueueEvents;

    constructor(initialConfig: Partial<QueueConfig> = {}) {
        this.config = init(initialConfig);

        // Preference: REDIS_URL from env or config URL, then host/port structure
        const redisUrl = process.env["REDIS_URL"];

        if (redisUrl) {
            this.connection = new IORedis(redisUrl, {
                maxRetriesPerRequest: null,
                tls: redisUrl.startsWith("rediss://") ? {} : undefined,
            });
        } else {
            this.connection = new IORedis({
                host: this.config.redis.host,
                port: this.config.redis.port,
                password: this.config.redis.password,
                tls: this.config.redis.tls ? {} : undefined,
                maxRetriesPerRequest: null,
            });
        }

        // Main Queue
        this.queue = new Queue(this.queueName, {
            connection: this.connection,
            defaultJobOptions: {
                attempts: this.config.maxRetries + 1,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        });

        // Dead Letter Queue
        this.dlq = new Queue(this.dlqName, {
            connection: this.connection,
        });

        // Global Event Monitoring
        this.events = new QueueEvents(this.queueName, {
            connection: this.connection,
        });

        this.setupEventListeners();
    }

    private setupEventListeners() {
        // Queue instance events
        this.queue.on("waiting", (job: Job) => logger.info({ jobId: job.id }, "Job is waiting"));

        // QueueEvents instance events (global tracking)
        // Note: QueueEvents events provide jobId and more metadata
        this.events.on("active", ({ jobId }) => logger.info({ jobId }, "Job is active"));
        this.events.on("completed", ({ jobId }) =>
            logger.info({ jobId }, "Job completed successfully"),
        );
        this.events.on("failed", async ({ jobId, failedReason }) => {
            logger.error({ jobId, failedReason }, "Job failed");

            // For DLQ routing, we might need the full job object.
            // When using QueueEvents, we get jobId. We can fetch the job if needed.
            const job = await Job.fromId(this.queue, jobId);
            if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
                logger.warn({ jobId: job.id }, "Job exhausted retries. Moving to DLQ.");
                await this.dlq.add(job.name, job.data, {
                    jobId: `dlq-${job.id}`,
                });
                await job.remove();
            }
        });
        this.events.on("stalled", ({ jobId }) => logger.warn({ jobId }, "Job stalled"));
    }

    private generateJobId(options: EmailOptions): string {
        const timestamp = options.timestamp || Date.now();
        const data = `${options.to}:${options.subject}:${timestamp}`;
        return createHash("sha256").update(data).digest("hex");
    }

    public async addEmailJob(options: EmailOptions) {
        const jobId = this.generateJobId(options);
        const priority = PRIORITY_MAP[options.priority || "normal"];

        return this.queue.add("send-email", options, {
            jobId,
            priority,
        });
    }

    public async close() {
        await this.queue.close();
        await this.dlq.close();
        await this.events.close();
        this.connection.disconnect();
    }
}
