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

## Today's Progress (2026-04-04)

We have successfully implemented the core configuration and type system for the email queue.

### 1. Types Defined
Created robust type definitions in `src/types/index.ts`:
- **EmailOptions**: Structure for sending emails (to, from, subject, html, text, templateId, attachments).
- **QueueConfig**: Configuration for the system (redis, ses, rateLimitPerSecond, maxRetries, logLevel).
- **JobResult**: Standardized output for email jobs (jobId, status, messageId, error).
- **Supporting Types**: `Attachment`, `RedisConfig`, `SESConfig`, `LogLevel`, `JobStatus`.

### 2. Configuration Schema & Validation
Implemented a robust validation layer using **Zod** in `src/config/schema.ts`:
- **init()**: A centralized function to initialize and validate the configuration.
- **Fail-Fast Policy**: The system now throws clear, actionable errors if the configuration is invalid.
- **Content Validation**: Ensures that at least one of `html`, `text`, or `templateId` is provided for each email.

### 3. Default Configuration
Created `src/config/defaults.ts` with sensible out-of-the-box settings:
- **Max Retries**: 3
- **Rate Limit**: 14 emails per second
- **Log Level**: info
- **Redis Defaults**: localhost:6379

### 4. Unit Testing
Added comprehensive unit tests in `src/config/schema.test.ts` using **Vitest**:
- Validates default configuration initialization.
- Verifies custom configuration overrides.
- Ensures invalid inputs (like negative retries or invalid log levels) are caught and reported.
- Tests email option validation (e.g., missing content, invalid emails).

---

## Goal Status
- [x] Define EmailOptions type
- [x] Define QueueConfig type
- [x] Define JobResult type
- [x] Build config/schema.ts using Zod (init validation)
- [x] Write config/defaults.ts
- [x] Write unit tests for config validation
- [x] Update README.md with project details

All exported types and config validation layers are now ready for integration.
