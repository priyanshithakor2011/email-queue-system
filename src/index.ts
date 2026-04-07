import { EmailQueueSystem } from "./queue/index.js";
import { EmailWorker } from "./worker/index.js";
import { logger } from "./logger/index.js";

async function main() {
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
