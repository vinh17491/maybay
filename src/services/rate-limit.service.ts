import { redis } from "@/lib/redis";
import { TRPCError } from "@trpc/server";

export interface RateLimitOptions {
  key: string;
  limit: number;
  window: number; // in seconds
}

export const RateLimiter = {
  async check({ key, limit, window }: RateLimitOptions) {
    try {
      if (!redis) {
        console.warn("RateLimiter: Redis client not initialized. Failing open.");
        return { remaining: limit, total: limit };
      }

      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, window);
      }

      if (current > limit) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please try again later.",
        });
      }

      return {
        remaining: Math.max(0, limit - current),
        total: limit,
      };
    } catch (error) {
      // If it's a TRPC TOO_MANY_REQUESTS error, rethrow it
      if (error instanceof TRPCError && error.code === "TOO_MANY_REQUESTS") {
        throw error;
      }

      // For any other error (Redis connection, timeout, etc.), fail open
      console.error("RateLimiter Error (Failing open):", error);
      return {
        remaining: limit,
        total: limit,
      };
    }
  },
};
