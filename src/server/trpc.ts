import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { RateLimiter } from "@/services/rate-limit.service";

export const createTRPCContext = async (opts: { 
  headers: Headers;
  ip?: string;
}) => {
  const session = await auth();
  return {
    ...opts,
    session,
    ip: opts.ip,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const ip = ctx.ip || "unknown";
  const userId = ctx.session?.user?.id;
  
  // Rate limit key depends on user or IP
  const key = userId ? `ratelimit:user:${userId}` : `ratelimit:ip:${ip}`;
  const limit = userId ? 200 : 100; // Logged in users get more quota

  await RateLimiter.check({
    key,
    limit,
    window: 60,
  });

  return next();
});

export const publicProcedure = t.procedure.use(rateLimitMiddleware);

export const protectedProcedure = t.procedure.use(rateLimitMiddleware).use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const roles = ctx.session.user.roles || [];
  if (!roles.includes("ADMIN") && !roles.includes("SUPER_ADMIN")) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});
