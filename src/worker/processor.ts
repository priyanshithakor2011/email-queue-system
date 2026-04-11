import { Job } from "bullmq";
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
            Source: from || "noreply@example.com", // Fallback if not provided
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
        logger.error(
            { jobId: job.id, error: error.message, category: error.category },
            "Failed to send email via SES",
        );
        throw error; // Re-throw so BullMQ can handle retries based on classification
    }
}
