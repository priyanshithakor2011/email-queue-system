import { EmailQueueSystem } from "./queue/index.js";
import { EmailWorker } from "./worker/index.js";
import { logger } from "./logger/index.js";
import IORedis from "ioredis";
import { config } from "./config/index.js";

async function main() {
    // Check Redis connectivity first
    const redisCheck = new IORedis(config.REDIS_URL, {
        maxRetriesPerRequest: 0,
        connectTimeout: 2000,
    });

    try {
        await redisCheck.ping();
        redisCheck.disconnect();
        logger.info("Redis connectivity verified.");
    } catch (err) {
        logger.error(
            "CRITICAL: Redis is not reachable at " +
                config.REDIS_URL +
                ". " +
                "Please ensure Redis is running. You can start it with 'docker-compose up -d' if you have Docker.",
        );
        process.exit(1);
    }

    const queueSystem = new EmailQueueSystem();
    const workerSystem = new EmailWorker();

    logger.info("Email queue system and worker initialized.");

    // Adding a test email job
    const job = await queueSystem.addEmailJob({
        to: "startup-user@example.com",
        subject: "Welcome to our platform!",
        text: "We are glad you are here. This is a real job from the workers.",
        priority: "high",
    });

    logger.info({ jobId: job.id }, "Added test job to the queue");

    // Keep process alive slightly for processing before exit
    setTimeout(async () => {
        logger.info("Test execution complete. Shutting down...");
        await queueSystem.close();
        await workerSystem.close();
        process.exit(0);
    }, 5000);
}

main().catch((err) => {
    logger.error({ error: err.message }, "Critical initialization failure");
    process.exit(1);
});
