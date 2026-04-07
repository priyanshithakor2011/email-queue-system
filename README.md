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

## Today's Progress (2026-04-07)

Implemented the full worker ecosystem and end-to-end job processing flow.

### 1. Worker implementation
- Created `src/worker/worker.ts` which manages the BullMQ `Worker` instance.
- **Configurable Concurrency**: Added support for adjusting the number of simultaneous job processes (default set to 5).
- **Rate Limiting**: Integrated the worker with the global `rateLimitPerSecond` setting from the configuration.

### 2. Job Processor
- Built `src/worker/processor.ts` as the core job handler.
- Currently uses a simulated email sending logic which is fully observable via structured logs.

### 3. Graceful Shutdown
- Implemented robust process signaling handling.
- The worker now listens to **SIGTERM** and **SIGINT** signals, ensuring that active jobs are drained and Redis connections are closed cleanly before the process exits.

### 4. Lifecycle Hooks
- Added real-time worker monitoring through lifecycle events:
    - **active**: Logged when the worker picks up a new job.
    - **completed**: Logged upon successful processing with result details.
    - **failed**: Captures and logs processing errors with detailed stack information.
    - **error**: Monitors and logs general system/connection errors.

### 5. Index Integration & End-to-End Test
- Updated `src/index.ts` to connect the entire ecosystem.
- The application now automatically initializes a queue and a worker, adds a test email job, and confirms the worker successfully picks it up.

### 6. Logic Verification
- Added a new test suite in `src/worker/worker.test.ts`.
- All **17 tests** (Configuration, Queuing, and Processing) are currently passing.

---

## Goal Status
- [x] Create worker.ts — BullMQ Worker with configurable concurrency
- [x] Build processor.ts — the job handler function
- [x] Add graceful shutdown: listen to SIGTERM, drain queue before exit
- [x] Add worker lifecycle hooks: onActive, onCompleted, onFailed
- [x] Connect worker to queue, test job pick-up with console log mock
- [x] Write unit tests: worker starts, processes job, shuts down cleanly

The end-to-end email queuing and processing flow is now fully operational.
