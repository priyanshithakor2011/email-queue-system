import { describe, it, expect, vi, beforeEach } from "vitest";
import { emailProcessor } from "./processor";
import { Job } from "bullmq";
import { SESService } from "../services/ses.service";

const { mockSendEmail } = vi.hoisted(() => {
    return { mockSendEmail: vi.fn() };
});

vi.mock("../services/ses.service.js", () => {
    return {
        SESService: class {
            sendEmail = mockSendEmail;
        },
    };
});

describe("emailProcessor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should call sesService.sendEmail with correct parameters", async () => {
        mockSendEmail.mockResolvedValue({ messageId: "msg-123" });

        const mockJob = {
            id: "job-1",
            data: {
                to: "recipient@example.com",
                subject: "Test Subject",
                text: "Hello world",
                from: "sender@example.com",
            },
        } as unknown as Job;

        const result = await emailProcessor(mockJob);

        expect(mockSendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                Source: "sender@example.com",
                Destination: { ToAddresses: ["recipient@example.com"] },
                Message: {
                    Subject: { Data: "Test Subject" },
                    Body: {
                        Text: { Data: "Hello world" },
                    },
                },
            }),
        );
        expect(result.success).toBe(true);
        expect(result.messageId).toBe("msg-123");
    });

    it("should handle array of recipients", async () => {
        mockSendEmail.mockResolvedValue({ messageId: "msg-456" });

        const mockJob = {
            id: "job-2",
            data: {
                to: ["a@b.com", "c@d.com"],
                subject: "Bulk",
                text: "Hi all",
            },
        } as unknown as Job;

        await emailProcessor(mockJob);

        expect(mockSendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                Destination: { ToAddresses: ["a@b.com", "c@d.com"] },
            }),
        );
    });

    it("should throw error and log it if SES fails", async () => {
        const error = new Error("SES Failed");
        (error as any).category = "retryable";
        mockSendEmail.mockRejectedValue(error);

        const mockJob = {
            id: "job-3",
            data: {
                to: "x@y.com",
                subject: "Fail",
            },
        } as unknown as Job;

        await expect(emailProcessor(mockJob)).rejects.toThrow("SES Failed");
    });

    it("should throw UnrecoverableError if SES failure is permanent", async () => {
        const { UnrecoverableError } = await import("bullmq");
        const error = new Error("Template does not exist");
        (error as any).category = "permanent";
        mockSendEmail.mockRejectedValue(error);

        const mockJob = {
            id: "job-4",
            data: {
                to: "x@y.com",
                subject: "Permanent Fail",
            },
        } as unknown as Job;

        await expect(emailProcessor(mockJob)).rejects.toThrow(UnrecoverableError);
    });
});
