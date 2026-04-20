import { describe, it, expect, vi, beforeEach } from "vitest";
import { emailProcessor } from "./processor.js";
import { SESService } from "../services/ses.service.js";
import { UnrecoverableError } from "bullmq";

vi.mock("../services/ses.service.js", () => {
    return {
        SESService: class {
            async sendEmail(_params: any): Promise<any> {}
        },
    };
});

describe("Email Job Processor", () => {
    let mockSES: any;
    const mockJob: any = {
        id: "job-1",
        data: {
            to: "test@test.com",
            subject: "Test Sub",
            text: "Test Body",
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSES = new SESService();
    });

    it("should process jobs successfully", async () => {
        // Manually inject mock because of how vitest mocks instances
        vi.spyOn(SESService.prototype, "sendEmail").mockResolvedValue({ messageId: "ses-123" });

        const result = await emailProcessor(mockJob);
        expect(result.success).toBe(true);
        expect(result.messageId).toBe("ses-123");
    });

    it("should throw UnrecoverableError for permanent failures", async () => {
        vi.spyOn(SESService.prototype, "sendEmail").mockRejectedValue({
            category: "permanent",
            message: "Denied",
        });

        await expect(emailProcessor(mockJob)).rejects.toThrow(UnrecoverableError);
    });

    it("should throw original error for transient failures", async () => {
        const transientError = { category: "throttled", message: "Wait" };
        vi.spyOn(SESService.prototype, "sendEmail").mockRejectedValue(transientError);

        await expect(emailProcessor(mockJob)).rejects.toEqual(transientError);
    });
});
