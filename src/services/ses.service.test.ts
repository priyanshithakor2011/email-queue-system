import { describe, it, expect, beforeEach, vi } from "vitest";
import { SESService } from "./ses.service";
import { MockSESClient } from "./ses.mock";

describe("SESService", () => {
    let sesService: SESService;
    let mockClient: MockSESClient;

    beforeEach(() => {
        mockClient = new MockSESClient();
        sesService = new SESService({ region: "us-east-1" });
        // Inject mock client
        (sesService as any).client = mockClient;
    });

    describe("sendEmail", () => {
        it("should return messageId on success", async () => {
            mockClient.mockSuccess("msg-123");
            const params = {
                Source: "sender@example.com",
                Destination: { ToAddresses: ["recipient@example.com"] },
                Message: {
                    Subject: { Data: "Test" },
                    Body: { Text: { Data: "Hello" } },
                },
            };

            const result = await sesService.sendEmail(params);
            expect(result.messageId).toBe("msg-123");
            expect(mockClient.send).toHaveBeenCalledTimes(1);
        });

        it("should classify Throttling error as throttled", async () => {
            mockClient.mockError("Throttling", "Rate exceeded");

            try {
                await sesService.sendEmail({} as any);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.category).toBe("throttled");
                expect(error.isRetryable).toBe(true);
            }
        });

        it("should classify MessageRejected error as permanent", async () => {
            mockClient.mockError("MessageRejected", "Bad content");

            try {
                await sesService.sendEmail({} as any);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.category).toBe("permanent");
                expect(error.isRetryable).toBe(false);
            }
        });

        it("should classify InternalFailure error as retryable", async () => {
            mockClient.mockError("InternalFailure", "Server error");

            try {
                await sesService.sendEmail({} as any);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.category).toBe("retryable");
                expect(error.isRetryable).toBe(true);
            }
        });
    });

    describe("sendBulkTemplatedEmail", () => {
        it("should return bulk status on success", async () => {
            mockClient.mockBulkSuccess();
            const params = {
                Source: "sender@example.com",
                Template: "MyTemplate",
                DefaultTemplateData: "{}",
                Destinations: [{ Destination: { ToAddresses: ["a@b.com"] } }],
            };

            const result = await sesService.sendBulkTemplatedEmail(params);
            expect(result.status).toBeDefined();
            expect(mockClient.send).toHaveBeenCalledTimes(1);
        });
    });
});
