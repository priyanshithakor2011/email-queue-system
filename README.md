# email-queue-system

A plug-and-play email queue system for Node.js with AWS SES support, built-in retry mechanism, and rate limiting for reliable and scalable email delivery.

## Installation

```bash
npm install email-queue-system
```

## Quick Start

```typescript
import { emailQueue } from 'email-queue-system';
import pino from 'pino';

async function main() {
  // 1. Initialize the system (Optional: provide custom pino logger for Datadog/Sentry)
  await emailQueue.init({
    redis: { host: 'localhost', port: 6379 },
    ses: { region: 'us-east-1' },
    logger: pino({ level: 'debug' }) // Custom transport support
  });

  // 2. Register listeners
  emailQueue.on('queued', ({ jobId }) => console.log(`Job ${jobId} added to queue`));
  emailQueue.on('completed', ({ jobId }) => console.log(`Job ${jobId} sent successfully`));

  // 3. Send an email with end-to-end traceability
  const jobId = await emailQueue.send({
    to: 'user@example.com',
    subject: 'Welcome!',
    text: 'Hello!',
    correlationId: 'user-signup-123' // End-to-end tracing ID
  });
}

main();
```

---

## Today's Progress (2026-04-18)

Implemented professional Observability and Logging systems to make every email fully traceable.

### 1. Robust Traceability
- **Correlation IDs**: Added support for `correlationId` in `EmailOptions`. This ID travels with the job through the queue and is injected into every log entry, allowing you to trace an email back to the specific user action that triggered it.
- **Deep Context**: Every log entry now includes `jobId`, `correlationId`, and relevant metadata (like `to`, `subject`, and `attemptsMade`).

### 2. High-Precision Timing Metrics
- **End-to-End Latency**: The system now captures and logs:
    - `enqueuedAt`: When the API accepted the job.
    - `pickedUpAt`: When a worker started processing.
    - `latencyMs`: The total processing time from pick-up to completion.
- This data allows you to monitor queue health and SES delivery speed in real-time.

### 3. Flexible Observability
- **Custom Log Transports**: Developers can now inject their own **Pino** logger instance during initialization. This enables easy piping of logs to external services like **Datadog**, **Sentry**, or **CloudWatch**.
- **Log Levels**: Fully implemented log levels (`debug`, `info`, `warn`, `error`).

### 4. Visibility into Limits
- Added detailed logging for **Rate Limiter** behavior. You can now see in your debug logs exactly when your system is waiting for tokens or if a daily SES quota is nearing its limit.

---

## Goal Status
- [x] Setup pino logger with log levels (debug, info, warn, error)
- [x] Inject jobId and correlationId into every log entry
- [x] Add timing logs: job enqueued at, picked up at, completed at (latency)
- [x] Support custom log transports via config (e.g. pipe to Datadog)
- [x] Log rate limiter waits and retry attempts
- [x] Verify structured JSON output is clean and queryable

Every job is now fully traceable end-to-end, making debugging and monitoring simple for any production application.
