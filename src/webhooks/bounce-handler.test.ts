import { describe, it, expect, vi } from "vitest";
import { handleSESNotification, SESNotification } from "./bounce-handler.js";
import { logger } from "../logger/index.js";

vi.mock("../logger/index.js", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe("Bounce Handler Webhook", () => {
    const baseMail = {
        messageId: "msg-123",
        source: "sender@example.com",
        destination: ["rcpt@example.com"],
    };

    it("should handle a Bounce notification", async () => {
        const notification: SESNotification = {
            notificationType: "Bounce",
            bounce: {
                bounceType: "Permanent",
                bounceSubType: "General",
                bouncedRecipients: [{ emailAddress: "rcpt@example.com" }],
            },
            mail: baseMail,
        };

        const result = await handleSESNotification(notification);
        expect(result.success).toBe(true);
        expect(logger.warn).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining("Bounced"),
        );
    });

    it("should handle a Complaint notification", async () => {
        const notification: SESNotification = {
            notificationType: "Complaint",
            complaint: {
                complaintFeedbackType: "abuse",
                complainedRecipients: [{ emailAddress: "rcpt@example.com" }],
            },
            mail: baseMail,
        };

        const result = await handleSESNotification(notification);
        expect(result.success).toBe(true);
        expect(logger.error).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining("Complaint"),
        );
    });

    it("should handle a Delivery notification", async () => {
        const notification: SESNotification = {
            notificationType: "Delivery",
            mail: baseMail,
        };

        const result = await handleSESNotification(notification);
        expect(result.success).toBe(true);
        expect(logger.info).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringContaining("Delivered"),
        );
    });
});
