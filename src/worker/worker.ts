import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { EmailOptions, QueueConfig } from "../types/index.js";
import { init } from "../config/schema.js";
import { logger } from "../logger/index.js";
import { emailProcessor } from "./processor.js";

export class EmailWorker {
    private worker: Worker;
    private connection: IORedis;
    private config: QueueConfig;
    private queueName = "email-queue";

    constructor(initialConfig: Partial<QueueConfig> = {}, concurrency: number = 5) {
        this.config = init(initialConfig);

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

        this.worker = new Worker<EmailOptions>(this.queueName, emailProcessor, {
            connection: this.connection,
            concurrency,
            limiter: {
                max: this.config.rateLimitPerSecond,
                duration: 1000,
            },
        });

        this.setupLifecycleHooks();
        this.setupGracefulShutdown();
    }

    private setupLifecycleHooks() {
        this.worker.on("active", (job: Job) => {
            logger.info({ jobId: job.id, name: job.name }, "Worker: Job became active");
        });

        this.worker.on("completed", (job: Job, result: any) => {
            logger.info({ jobId: job.id, result }, "Worker: Job completed");
        });

        this.worker.on("failed", (job: Job | undefined, err: Error) => {
            logger.error({ jobId: job?.id, error: err.message }, "Worker: Job failed");
        });

        this.worker.on("error", (err: Error) => {
            logger.error({ error: err.message }, "Worker: General error encountered");
        });
    }

    private setupGracefulShutdown() {
        const shutdown = async (signal: string) => {
            logger.info({ signal }, "Worker: Shutdown signal received. Draining queue...");
            await this.close();
            process.exit(0);
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    }

    public async close() {
        await this.worker.close();
        this.connection.disconnect();
        logger.info("Worker: Connection closed successfully");
    }
}
