import { EventEmitter } from "events";
import { EmailQueueSystem } from "../queue/index.js";
import { EmailWorker } from "../worker/index.js";
import { EmailOptions, QueueConfig } from "../types/index.js";
import { emailOptionsSchema, init as validate } from "../config/schema.js";
import { logger, setLogger } from "../logger/index.js";

/**
 * The public API for the Email Queue System.
 */
export class EmailQueue extends EventEmitter {
    private queueSystem?: EmailQueueSystem;
    private worker?: EmailWorker;
    private isInitialized = false;

    /**
     * Initializes the system with the provided configuration.
     * @param config - Full or partial configuration.
     */
    public async init(config: Partial<QueueConfig> = {}) {
        if (this.isInitialized) {
            logger.warn("System is already initialized.");
            return;
        }

        // Set custom logger if provided
        if (config.logger) {
            setLogger(config.logger);
        }

        this.queueSystem = new EmailQueueSystem(config);

        // The worker is automatically started when initialized
        this.worker = new EmailWorker(config);

        this.setupEventForwarding();

        this.isInitialized = true;
        logger.info("Email Queue System initialized successfully.");
    }

    /**
     * Enqueues a single email job.
     * @param options - Email options (to, subject, body, etc.)
     * @returns The jobId of the created job.
     */
    public async send(options: EmailOptions): Promise<string> {
        this.ensureInitialized();

        // Validate options
        emailOptionsSchema.parse(options);

        const job = await this.queueSystem!.addEmailJob(options);

        logger.info(
            {
                jobId: job.id,
                correlationId: options.correlationId,
                enqueuedAt: new Date().toISOString(),
                to: options.to,
                subject: options.subject,
            },
            "Email job enqueued",
        );

        this.emit("queued", { jobId: job.id, options });

        return job.id!;
    }

    /**
     * Enqueues multiple email jobs in batch.
     * @param list - Array of email options.
     * @returns Array of jobIds.
     */
    public async sendBulk(list: EmailOptions[]): Promise<string[]> {
        this.ensureInitialized();

        const jobIds: string[] = [];

        // We could use bulk add if BullMQ supported it easily with our wrapper,
        // but for now, we'll iterate and validate each.
        for (const options of list) {
            const jobId = await this.send(options);
            jobIds.push(jobId);
        }

        return jobIds;
    }

    /**
     * Gracefully shuts down the queue and worker systems.
     */
    public async close() {
        if (!this.isInitialized) return;

        logger.info("Closing Email Queue System...");

        await Promise.all([this.queueSystem?.close(), this.worker?.close()]);

        this.isInitialized = false;
        logger.info("Email Queue System closed.");
    }

    private setupEventForwarding() {
        if (!this.queueSystem) return;

        // Foward internal events to the public API
        // QueueEvents are monitored in EmailQueueSystem
        const internalEvents = (this.queueSystem as any).events;

        if (internalEvents) {
            internalEvents.on("completed", ({ jobId, returnvalue }: any) => {
                this.emit("completed", { jobId, result: returnvalue });
            });

            internalEvents.on("failed", ({ jobId, failedReason }: any) => {
                this.emit("failed", { jobId, error: failedReason });
            });
        }
    }

    private ensureInitialized() {
        if (!this.isInitialized || !this.queueSystem) {
            throw new Error("EmailQueue is not initialized. Call .init() first.");
        }
    }
}

// Export a default instance for convenience
export const emailQueue = new EmailQueue();
