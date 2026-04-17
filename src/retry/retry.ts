import { logger } from "../logger/index.js";

const PERMANENT_ERRORS = ["MessageRejected", "InvalidParameterValue", "ValidationError"];

/**
 * Calculates the backoff delay with exponential growth and jitter.
 * @param attempts - The number of attempts already made.
 * @param baseDelay - The initial delay in milliseconds.
 * @returns The delay in milliseconds.
 */
export function calculateBackoff(attempts: number, baseDelay: number = 1000): number {
    // Exponential backoff: 2^(attempts-1) * baseDelay
    const exponentialDelay = Math.pow(2, attempts - 1) * baseDelay;

    // Add jitter: +/- 20% of the delay
    const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);

    return Math.floor(exponentialDelay + jitter);
}

/**
 * Determines if a job should be retried based on the error received.
 * @param error - The error object or string.
 * @returns boolean - true if retryable, false if permanent.
 */
export function isRetryable(error: any): boolean {
    const errorName = error?.name || error?.code || (typeof error === "string" ? error : "");

    if (PERMANENT_ERRORS.some((err) => errorName.includes(err))) {
        logger.warn({ errorName }, "Permanent error detected. Skipping retry.");
        return false;
    }

    return true;
}
