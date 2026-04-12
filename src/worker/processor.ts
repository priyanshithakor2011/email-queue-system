import { Job, UnrecoverableError } from "bullmq";
import { EmailOptions } from "../types/index.js";
import { logger } from "../logger/index.js";
import { SESService } from "../services/ses.service.js";

const sesService = new SESService();

/**
 * The job processor function for BullMQ.
 * This handles the actual execution of the "send-email" job.
 */
export async function emailProcessor(job: Job<EmailOptions>) {
    const { to, subject, html, text, from } = job.data;

    logger.info({ jobId: job.id, to, subject }, "Processing email job via SES");

    try {
        const result = await sesService.sendEmail({
            Source: from || "noreply@example.com",
            Destination: {
                ToAddresses: Array.isArray(to) ? to : [to],
            },
            Message: {
                Subject: { Data: subject },
                Body: {
                    Html: html ? { Data: html } : undefined,
                    Text: text ? { Data: text } : undefined,
                },
            },
        });

        logger.info(
            { jobId: job.id, messageId: result.messageId },
            "Email sent successfully via SES",
        );

        return {
            success: true,
            messageId: result.messageId,
        };
    } catch (error: any) {
        const isPermanent = error.category === "permanent";

        logger.error(
            {
                jobId: job.id,
                error: error.message,
                category: error.category,
                isPermanent,
            },
            "Failed to send email via SES",
        );

        if (isPermanent) {
            // Throwing UnrecoverableError tells BullMQ to stop retrying immediately
            throw new UnrecoverableError(error.message);
        }

        // For throttled or other retryable errors, we throw the original error
        // BullMQ will use the configured exponential backoff.
        throw error;
    }
}
