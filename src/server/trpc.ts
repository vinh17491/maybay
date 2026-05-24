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
export const publicProcedure = t.procedure.use(async ({ ctx, next, path }) => {
  // Global rate limit for all public procedures
  const ip = ctx.ip || "unknown";
  await RateLimiter.check({
    key: `ratelimit:public:${ip}`,
    limit: 100, // 100 requests
    window: 60, // per minute
  });
  
  return next();
});

export const protectedProcedure = t.procedure.use(async ({ ctx, next, path }) => {
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
  const roles = (ctx.session.user as any).roles || [];
  if (!roles.includes("ADMIN") && !roles.includes("SUPER_ADMIN")) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});
