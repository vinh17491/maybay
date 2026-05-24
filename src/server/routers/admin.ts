import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/trpc";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit.service";
import { CabinClass, FlightStatus } from "@prisma/client";

export const adminRouter = createTRPCRouter({
  getStats: adminProcedure.query(async () => {
    const [userCount, bookingCount, revenueResult, activeFlightsCount] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: "COMPLETED",
        },
      }),
      prisma.flight.count({
        where: {
          status: {
            in: [FlightStatus.SCHEDULED, FlightStatus.BOARDING, FlightStatus.DELAYED],
          },
        },
      }),
    ]);

    return {
      totalUsers: userCount,
      totalBookings: bookingCount,
      totalRevenue: Number(revenueResult._sum.amount) || 0,
      activeFlights: activeFlightsCount,
    };
  }),

  getRecentBookings: adminProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input }) => {
      return prisma.booking.findMany({
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            include: {
              profile: true,
            }
          },
          flight: {
            include: {
              airline: true,
            }
          }
        }
      });
    }),

  getUsers: adminProcedure
    .input(z.object({
      skip: z.number().default(0),
      take: z.number().default(10),
    }))
    .query(async ({ input }) => {
      return prisma.user.findMany({
        skip: input.skip,
        take: input.take,
        include: {
          roles: {
            include: {
              role: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getFlights: adminProcedure
    .input(z.object({
      skip: z.number().default(0),
      take: z.number().default(10),
    }))
    .query(async ({ input }) => {
      return prisma.flight.findMany({
        skip: input.skip,
        take: input.take,
        include: {
          airline: true,
          aircraft: true,
          segments: {
            include: {
              departureAirport: true,
              arrivalAirport: true,
            },
            orderBy: { sequence: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  upsertFlight: adminProcedure
    .input(z.object({
      id: z.string().optional(),
      airlineId: z.string(),
      aircraftId: z.string(),
      flightNumber: z.string(),
      status: z.nativeEnum(FlightStatus).default(FlightStatus.SCHEDULED),
      segments: z.array(z.object({
        departureAirportId: z.string(),
        arrivalAirportId: z.string(),
        departureTime: z.date(),
        arrivalTime: z.date(),
        duration: z.number(),
        sequence: z.number(),
      })),
      prices: z.array(z.object({
        class: z.nativeEnum(CabinClass),
        price: z.number(),
        currency: z.string().default("USD"),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const flight = await prisma.$transaction(async (tx) => {
        const flight = await tx.flight.upsert({
          where: { id: input.id || "new-flight" },
          update: {
            airlineId: input.airlineId,
            aircraftId: input.aircraftId,
            flightNumber: input.flightNumber,
            status: input.status,
          },
          create: {
            airlineId: input.airlineId,
            aircraftId: input.aircraftId,
            flightNumber: input.flightNumber,
            status: input.status,
          },
        });

        // Update segments
        await tx.flightSegment.deleteMany({ where: { flightId: flight.id } });
        await tx.flightSegment.createMany({
          data: input.segments.map(s => ({ ...s, flightId: flight.id }))
        });

        // Update prices
        await tx.flightPrice.deleteMany({ where: { flightId: flight.id } });
        await tx.flightPrice.createMany({
          data: input.prices.map(p => ({ ...p, flightId: flight.id }))
        });

        return flight;
      });

      await AuditService.log({
        userId: ctx.session.user.id,
        action: input.id ? "FLIGHT_UPDATED" : "FLIGHT_CREATED",
        entityType: "Flight",
        entityId: flight.id,
        details: input,
      });

      return flight;
    }),

  getBookings: adminProcedure
    .input(z.object({
      skip: z.number().default(0),
      take: z.number().default(10),
    }))
    .query(async ({ input }) => {
      return prisma.booking.findMany({
        skip: input.skip,
        take: input.take,
        include: {
          user: {
            include: {
              profile: true,
            }
          },
          flight: {
            include: {
              airline: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getAuditLogs: adminProcedure
    .input(z.object({
      userId: z.string().optional(),
      entityType: z.string().optional(),
      action: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return AuditService.getLogs(input);
    }),

  // --- Airport CRUD ---
  getAirports: adminProcedure.query(async () => {
    return prisma.airport.findMany({ orderBy: { name: "asc" } });
  }),

  upsertAirport: adminProcedure
    .input(z.object({
      id: z.string().optional(),
      code: z.string().length(3),
      name: z.string(),
      city: z.string(),
      country: z.string(),
      timezone: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const airport = await prisma.airport.upsert({
        where: { code: input.code },
        update: input,
        create: input,
      });

      await AuditService.log({
        userId: ctx.session.user.id,
        action: input.id ? "AIRPORT_UPDATED" : "AIRPORT_CREATED",
        entityType: "Airport",
        entityId: airport.id,
        details: input,
      });

      return airport;
    }),

  // --- Airline CRUD ---
  getAirlines: adminProcedure.query(async () => {
    return prisma.airline.findMany({ orderBy: { name: "asc" } });
  }),

  upsertAirline: adminProcedure
    .input(z.object({
      id: z.string().optional(),
      code: z.string().length(2),
      name: z.string(),
      country: z.string().optional(),
      logoUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const airline = await prisma.airline.upsert({
        where: { code: input.code },
        update: input,
        create: {
          code: input.code,
          name: input.name,
          country: input.country,
          logoUrl: input.logoUrl,
        },
      });

      await AuditService.log({
        userId: ctx.session.user.id,
        action: input.id ? "AIRLINE_UPDATED" : "AIRLINE_CREATED",
        entityType: "Airline",
        entityId: airline.id,
        details: input,
      });

      return airline;
    }),
});
