import { Job } from "bullmq";
import { EmailOptions } from "../types/index.js";
import { logger } from "../logger/index.js";

/**
 * The job processor function for BullMQ.
 * This handles the actual execution of the "send-email" job.
 */
export async function emailProcessor(job: Job<EmailOptions>) {
    const { to, subject } = job.data;

    logger.info({ jobId: job.id, to, subject }, "Processing email job");

    // Simulation of email sending logic
    // In next steps, this will call AWS SES
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info({ jobId: job.id }, "Email sent successfully (simulated)");

    return {
        success: true,
        messageId: `simulated-${Date.now()}`,
    };
}
