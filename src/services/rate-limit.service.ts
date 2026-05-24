import { redis } from "@/lib/redis";
import { TRPCError } from "@trpc/server";

export interface RateLimitOptions {
  key: string;
  limit: number;
  window: number; // in seconds
}

export const RateLimiter = {
  async check({ key, limit, window }: RateLimitOptions) {
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
  },
};
