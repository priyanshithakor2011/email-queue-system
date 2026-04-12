import { logger } from "../logger/index.js";

export type SESNotificationType = "Bounce" | "Complaint" | "Delivery";

export interface SESNotification {
    notificationType: SESNotificationType;
    bounce?: {
        bounceType: string;
        bounceSubType: string;
        bouncedRecipients: Array<{ emailAddress: string }>;
    };
    complaint?: {
        complaintFeedbackType: string;
        complainedRecipients: Array<{ emailAddress: string }>;
    };
    mail: {
        messageId: string;
        source: string;
        destination: string[];
    };
}

/**
 * Handles SNS webhooks from Amazon SES for bounces and complaints.
 * In a real app, this might be triggered by an Express route.
 */
export async function handleSESNotification(notification: SESNotification) {
    const { notificationType, mail } = notification;

    logger.info(
        {
            messageId: mail.messageId,
            type: notificationType,
            to: mail.destination,
        },
        `SES Webhook: Received ${notificationType}`,
    );

    switch (notificationType) {
        case "Bounce":
            const bounceType = notification.bounce?.bounceType;
            logger.warn(
                {
                    messageId: mail.messageId,
                    recipients: notification.bounce?.bouncedRecipients,
                    bounceType,
                },
                "SES Webhook: Email Bounced",
            );
            // TODO: Mark email as bounced in database if available
            break;

        case "Complaint":
            logger.error(
                {
                    messageId: mail.messageId,
                    recipients: notification.complaint?.complainedRecipients,
                },
                "SES Webhook: Complaint Received (potential spam tag)",
            );
            // TODO: Unsubscribe user or block their email
            break;

        case "Delivery":
            logger.info({ messageId: mail.messageId }, "SES Webhook: Email Delivered");
            break;

        default:
            logger.info({ type: notificationType }, "SES Webhook: Unknown notification type");
    }

    return { success: true };
}
