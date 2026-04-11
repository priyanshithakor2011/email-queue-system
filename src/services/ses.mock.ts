import { SESClient } from "@aws-sdk/client-ses";
import { vi } from "vitest";

export class MockSESClient {
    public send = vi.fn();

    // Helper to mock successful response
    mockSuccess(messageId: string = "mock-message-id") {
        this.send.mockResolvedValue({
            MessageId: messageId,
            $metadata: { httpStatusCode: 200 },
        });
        return this;
    }

    // Helper to mock bulk successful response
    mockBulkSuccess() {
        this.send.mockResolvedValue({
            Status: [{ Status: "Success", MessageId: "bulk-mock-id" }],
            $metadata: { httpStatusCode: 200 },
        });
        return this;
    }

    // Helper to mock specific errors
    mockError(name: string, message: string = "SES Error") {
        const error = new Error(message);
        error.name = name;
        this.send.mockRejectedValue(error);
        return this;
    }
}

/**
 * Factory to create a SESService instance with a mocked client
 */
export function createMockSESService(mockClient: any) {
    const { SESService } = require("./ses.service");
    const service = new SESService({ region: "us-east-1" });
    (service as any).client = mockClient;
    return service;
}
