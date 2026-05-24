import { createTRPCRouter, publicProcedure } from "./trpc";
import { flightRouter } from "./routers/flight";
import { bookingRouter } from "./routers/booking";
import { adminRouter } from "./routers/admin";

export const appRouter = createTRPCRouter({
  healthcheck: publicProcedure.query(() => "ok"),
  flight: flightRouter,
  booking: bookingRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
