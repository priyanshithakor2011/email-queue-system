import IORedis from "ioredis";
import { logger } from "../logger/index.js";

export interface TokenBucketConfig {
    redis: IORedis;
    keyPrefix: string;
    ratePerSecond: number;
    ratePerDay: number;
}

/**
 * A Redis-backed Token Bucket rate limiter for SES quota enforcement.
 */
export class TokenBucket {
    private redis: IORedis;
    private keyPrefix: string;
    private ratePerSecond: number;
    private ratePerDay: number;

    constructor(config: TokenBucketConfig) {
        this.redis = config.redis;
        this.keyPrefix = config.keyPrefix;
        this.ratePerSecond = config.ratePerSecond;
        this.ratePerDay = config.ratePerDay;
    }

    /**
     * Consumes a token if available for both second and day limits.
     * @returns Promise<boolean> - true if token consumed, false if rate limited.
     */
    async consume(): Promise<boolean> {
        const now = Date.now();
        const secondKey = `${this.keyPrefix}:sec:${Math.floor(now / 1000)}`;
        const dayKey = `${this.keyPrefix}:day:${new Date().toISOString().split("T")[0]}`;

        try {
            // Check daily limit first (more critical)
            const dayCount = await this.redis.incr(dayKey);
            if (dayCount === 1) {
                await this.redis.expire(dayKey, 86400 + 3600); // 1 day + 1 hour buffer
            }

            if (dayCount > this.ratePerDay) {
                logger.warn(
                    { dayCount, limit: this.ratePerDay },
                    "Weekly/Daily SES quota exceeded!",
                );
                return false;
            }

            // Check per-second limit
            const secCount = await this.redis.incr(secondKey);
            if (secCount === 1) {
                await this.redis.expire(secondKey, 2);
            }

            if (secCount > this.ratePerSecond) {
                // Silently return false, as this is a transient local rate limit
                return false;
            }

            return true;
        } catch (error) {
            logger.error(
                { error },
                "Error in token bucket consumption. Defaulting to block for safety.",
            );
            return false;
        }
    }

    /**
     * Resets the bucket counts (useful for testing).
     */
    async reset(): Promise<void> {
        const keys = await this.redis.keys(`${this.keyPrefix}:*`);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
}
