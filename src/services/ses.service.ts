import {
    SESClient,
    SendEmailCommand,
    SendBulkTemplatedEmailCommand,
    SendEmailCommandInput,
    SendBulkTemplatedEmailCommandInput,
} from "@aws-sdk/client-ses";
import { classifySESError } from "./error-classifier";
import { config as defaultConfig } from "../config";

export interface SESServiceConfig {
    region?: string;
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
    };
}

export class SESService {
    private client: SESClient;

    constructor(config?: SESServiceConfig) {
        const region = config?.region || defaultConfig.AWS_REGION;
        const credentials =
            config?.credentials ||
            (defaultConfig.AWS_ACCESS_KEY_ID && defaultConfig.AWS_SECRET_ACCESS_KEY
                ? {
                      accessKeyId: defaultConfig.AWS_ACCESS_KEY_ID,
                      secretAccessKey: defaultConfig.AWS_SECRET_ACCESS_KEY,
                  }
                : undefined);

        this.client = new SESClient({
            region,
            credentials,
        });
    }

    /**
     * Sends a single transactional email
     */
    async sendEmail(params: SendEmailCommandInput) {
        try {
            const command = new SendEmailCommand(params);
            const response = await this.client.send(command);
            return {
                messageId: response.MessageId,
                metadata: response.$metadata,
            };
        } catch (error) {
            const classification = classifySESError(error);
            throw classification;
        }
    }

    /**
     * Sends bulk emails using SES templates
     */
    async sendBulkTemplatedEmail(params: SendBulkTemplatedEmailCommandInput) {
        try {
            const command = new SendBulkTemplatedEmailCommand(params);
            const response = await this.client.send(command);
            return {
                status: response.Status,
                metadata: response.$metadata,
            };
        } catch (error) {
            const classification = classifySESError(error);
            throw classification;
        }
    }

    /**
     * Getter for the internal client, useful for testing or custom operations
     */
    getClient(): SESClient {
        return this.client;
    }
}
