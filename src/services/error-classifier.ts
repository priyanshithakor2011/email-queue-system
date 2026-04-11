export type EmailErrorCategory = "permanent" | "retryable" | "throttled";

export interface SESErrorClassification {
    category: EmailErrorCategory;
    isRetryable: boolean;
    message: string;
    originalError: any;
}

export function classifySESError(error: any): SESErrorClassification {
    const errorCode = error.name || error.code || "UnknownError";
    const errorMessage = error.message || "No error message provided";

    // Throttled Errors
    if (
        errorCode === "Throttling" ||
        errorCode === "ThrottlingException" ||
        errorCode === "RequestLimitExceeded" ||
        errorCode === "AccountSendingPaused" ||
        errorCode === "TooManyRequestsException"
    ) {
        return {
            category: "throttled",
            isRetryable: true,
            message: errorMessage,
            originalError: error,
        };
    }

    // Permanent Errors
    if (
        errorCode === "MessageRejected" ||
        errorCode === "MailFromDomainNotVerified" ||
        errorCode === "ConfigurationSetDoesNotExist" ||
        errorCode === "InvalidParameterValue" ||
        errorCode === "NotFoundException" ||
        errorCode === "InvalidTemplate" ||
        errorCode === "TemplateDoesNotExist" ||
        errorCode === "InvalidParameterException"
    ) {
        return {
            category: "permanent",
            isRetryable: false,
            message: errorMessage,
            originalError: error,
        };
    }

    // Default to retryable for other errors (network issues, InternalFailure, etc.)
    return {
        category: "retryable",
        isRetryable: true,
        message: errorMessage,
        originalError: error,
    };
}
