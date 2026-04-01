export interface EmailJob {
    to: string;
    subject: string;
    body: string;
    from?: string;
}

export interface JobResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
