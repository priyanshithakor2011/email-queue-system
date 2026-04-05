import fs from "node:fs";
import path from "node:path";
import pino from "pino";
import { config } from "../config/index.js";

const streams: pino.StreamEntry[] = [
    {
        level: (config.LOG_LEVEL as pino.Level) || "info",
        stream:
            process.env["NODE_ENV"] !== "production"
                ? pino.transport({ target: "pino-pretty" })
                : process.stdout,
    },
];

if (config.ERROR_LOG_FILE) {
    const logDir = path.dirname(config.ERROR_LOG_FILE);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    streams.push({
        level: "error",
        stream: fs.createWriteStream(config.ERROR_LOG_FILE, { flags: "a" }),
    });
}

export const logger = pino(
    {
        level: (config.LOG_LEVEL as pino.Level) || "info",
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream(streams),
);
