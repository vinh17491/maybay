import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };

const createRedisInstance = () => {
  if (!process.env.REDIS_URL && process.env.NODE_ENV === "production") {
    console.warn("REDIS_URL is not defined in production. Redis features will be disabled (failing open).");
    return null;
  }

  try {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const instance = new Redis(redisUrl, {
      maxRetriesPerRequest: 1, // Fail fast to trigger fail-open logic
      connectTimeout: 5000,
      retryStrategy(times) {
        // Limited retries to avoid memory leaks/event loop blocking if Redis is permanently down
        if (times > 10) return null; 
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    instance.on("error", (err) => {
      // Log error but don't crash process
      console.error("Redis Error:", err.message);
    });

    return instance;
  } catch (e) {
    console.error("Failed to initialize Redis client:", e);
    return null;
  }
};

export const redis = globalForRedis.redis || createRedisInstance();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
