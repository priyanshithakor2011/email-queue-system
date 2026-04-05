# email-queue-system

A plug-and-play email queue system for Node.js with AWS SES support, built-in retry mechanism, and rate limiting for reliable and scalable email delivery.

## Project Setup

### Prerequisites
- Node.js (Latest LTS recommended)
- Redis server (running locally or accessible via URL)
- AWS Account (for SES support)

### Installation
```bash
npm install
```

### Running the Project
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

---

## Today's Progress (2026-04-05)

Implemented the core queue management system using BullMQ with production-ready optimizations and professional logging.

### 1. Queue initialization
- Created `src/queue/queue.ts` which initializes the main `email-queue` and a dedicated `email-dlq` (Dead-Letter Queue).
- Configured with `IORedis` for reliable persistent storage.
- Integrated the Zod-based configuration system for robust initialization.

### 2. Job Deduplication
- Implemented SHA256-based job deduplication.
- Job IDs are generated using `SHA256(to + subject + timestamp)`, ensuring that duplicate requests within the same timeframe don't result in multiple sent emails.

### 3. Priority Levels
- Added support for four priority levels: `critical`, `high`, `normal`, and `low`.
- Mapped these levels to BullMQ's internal numeric priority system (1, 10, 50, 100).

### 4. Dead-Letter Queue (DLQ)
- Setup automatic DLQ routing. When a job exhausts all its retries (default is 3), it is automatically moved to `email-dlq` for manual inspection and troubleshooting.
- The original job is cleaned from the main queue to maintain optimal performance.

### 5. Professional Logging System
- Integrated **Pino-based logger** across the queue system.
- Replaced all `console.log` and `console.error` calls with structured logging.
- **Error Persistence**: All failed jobs and system errors are automatically captured in the designated log file (e.g., `error.log`) for persistent tracking and easier auditing in production.

### 6. Event Monitoring
- Integrated emitters for job lifecycle events via `QueueEvents`:
    - **waiting**: Job is in the queue waiting for a worker.
    - **active**: Worker is currently processing the job.
    - **completed**: Successfully sent.
    - **failed**: Encountered an error (automatically logged to file and monitors retry attempts).
    - **stalled**: Job froze during processing (automatically recovered).

### 7. Logic Verification
- Added comprehensive unit tests in `src/queue/queue.test.ts` using Vitest mocks.
- Verified that jobs are added with correct priorities, deduplication works, and the logging/event system is correctly registered.

---

## Goal Status
- [x] Create queue.ts — init BullMQ Queue with Redis connection
- [x] Add job deduplication using jobId = SHA256(to + subject + timestamp)
- [x] Implement priority levels: critical | high | normal | low
- [x] Setup dead-letter queue (DLQ) for jobs exceeding max retries
- [x] Add job event emitters: waiting, active, completed, failed, stalled
- [x] Replace console logs with professional logger (Pino)
- [x] Implement persistent error logging to file
- [x] Write unit tests: job creation, deduplication, DLQ routing

The queuing system is now fully functional, production-ready, and monitored with professional logging.
