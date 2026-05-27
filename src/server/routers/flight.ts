import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { FlightProviderFactory } from "@/server/providers/flight/provider.factory";
import { CabinClass } from "@prisma/client";
import { redis } from "@/lib/redis";
import { SearchHistoryService } from "@/services/search-history.service";

const CACHE_TTL = 600; // 10 minutes (Amadeus recommendations for price stability)

export const flightRouter = createTRPCRouter({
  searchAirports: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      const provider = FlightProviderFactory.getProvider();
      return provider.searchAirports(input);
    }),

  searchFlights: publicProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      departureDate: z.date(),
      returnDate: z.date().optional(),
      passengers: z.object({
        adults: z.number().min(1),
        children: z.number().default(0),
        infants: z.number().default(0),
      }),
      cabinClass: z.nativeEnum(CabinClass),
    }))
    .query(async ({ input, ctx }) => {
      const cacheKey = `flights:${JSON.stringify(input)}`;
      
      // Try to get from cache
      try {
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        }
      } catch (e) {
        console.error("Redis cache get error:", e);
      }

      const provider = FlightProviderFactory.getProvider();
      const results = await provider.searchFlights(input);

      // Save to cache and store individual offers for booking flow
      try {
        if (redis) {
          await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));
          
          // Store individual offers to be retrieved by offerId during booking
          for (const offer of results.offers) {
            await redis.setex(`offer:${offer.id}`, CACHE_TTL, JSON.stringify(offer));
          }
        }
      } catch (e) {
        console.error("Redis cache set error:", e);
      }

      // Save to search history if user is logged in
      if (ctx.session?.user?.id) {
        await SearchHistoryService.save(ctx.session.user.id, input);
      }

      return results;
    }),

  getFlightDetails: publicProcedure
    .input(z.object({ offerId: z.string() }))
    .query(async ({ input }) => {
      const provider = FlightProviderFactory.getProvider();
      return provider.getFlightOffer(input.offerId);
    }),

  priceFlight: publicProcedure
    .input(z.object({ offerId: z.string() }))
    .mutation(async ({ input }) => {
      const provider = FlightProviderFactory.getProvider();
      return provider.priceFlightOffer(input);
    }),
});
