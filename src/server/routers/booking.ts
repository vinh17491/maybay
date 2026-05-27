import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { prisma } from "@/lib/prisma";
import { BookingStatus, CabinClass, PaymentStatus, FlightStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { TicketService } from "@/services/ticket.service";
import { EmailService } from "@/services/email.service";
import { redis } from "@/lib/redis";
import { FlightProviderFactory } from "@/server/providers/flight/provider.factory";
import { FlightOffer } from "@/types/flight";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia", // Using the required version for this Stripe SDK
});

export const bookingRouter = createTRPCRouter({
  createBooking: protectedProcedure
    .input(z.object({
      offerId: z.string(),
      passengers: z.array(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
        passportNumber: z.string().optional(),
        nationality: z.string().optional(),
        dateOfBirth: z.date().optional(),
        gender: z.string().optional(),
        cabinClass: z.nativeEnum(CabinClass),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      let offer: FlightOffer | null = null;

      // 1. Try to get offer from Redis
      try {
        if (redis) {
          const cached = await redis.get(`offer:${input.offerId}`);
          if (cached) {
            offer = JSON.parse(cached);
          }
        }
      } catch (e) {
        console.error("Redis error in createBooking:", e);
      }

      // 2. If not in cache, try to fetch from provider
      if (!offer) {
        try {
          const provider = FlightProviderFactory.getProvider();
          offer = await provider.getFlightOffer(input.offerId);
        } catch (e) {
          console.error("Provider error in createBooking:", e);
        }
      }

      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Flight offer not found or expired. Please search again.",
        });
      }

      // Calculate total price - assuming offer price is per person if passengers were not provided to search
      // In this specific implementation, let's treat it as the total price for the offer.
      const totalPrice = offer.price.amount; 

      // 3. Sync offer to Database (Airline, Flight, Segments, Inventory)
      // This ensures we have a real record for the booking
      const booking = await prisma.$transaction(async (tx) => {
        // Find or create airline
        const firstSegment = offer!.segments[0];
        const airline = await tx.airline.upsert({
          where: { code: firstSegment.airline.code },
          update: { name: firstSegment.airline.name, logoUrl: firstSegment.airline.logoUrl },
          create: {
            code: firstSegment.airline.code,
            name: firstSegment.airline.name,
            logoUrl: firstSegment.airline.logoUrl,
          },
        });

        // Find or create aircraft (simplified for demo)
        const aircraft = await tx.aircraft.upsert({
          where: { registration: firstSegment.aircraft || "D-DEFAULT" },
          update: {},
          create: {
            registration: firstSegment.aircraft || "D-DEFAULT",
            model: "Airbus A320", // Default model
            airlineId: airline.id,
          },
        });

        // Create Flight
        const flight = await tx.flight.create({
          data: {
            airlineId: airline.id,
            aircraftId: aircraft.id,
            flightNumber: firstSegment.flightNumber,
            status: FlightStatus.SCHEDULED,
            segments: {
              create: offer!.segments.map((seg, index) => ({
                departureAirport: {
                  connectOrCreate: {
                    where: { code: seg.departureAirport.code },
                    create: {
                      code: seg.departureAirport.code,
                      name: seg.departureAirport.name,
                      city: seg.departureAirport.city,
                      country: seg.departureAirport.country,
                    },
                  },
                },
                arrivalAirport: {
                  connectOrCreate: {
                    where: { code: seg.arrivalAirport.code },
                    create: {
                      code: seg.arrivalAirport.code,
                      name: seg.arrivalAirport.name,
                      city: seg.arrivalAirport.city,
                      country: seg.arrivalAirport.country,
                    },
                  },
                },
                departureTime: new Date(seg.departureTime),
                arrivalTime: new Date(seg.arrivalTime),
                duration: seg.duration,
                sequence: index,
              })),
            },
            inventory: {
              create: {
                class: offer!.cabinClass as CabinClass,
                totalSeats: 100,
                availableSeats: 100,
              },
            },
            prices: {
              create: {
                class: offer!.cabinClass as CabinClass,
                price: offer!.price.amount,
                currency: offer!.price.currency,
              },
            },
          },
        });

        // 4. Check and decrement inventory
        const passengerCountByClass = input.passengers.reduce((acc, p) => {
          acc[p.cabinClass] = (acc[p.cabinClass] || 0) + 1;
          return acc;
        }, {} as Record<CabinClass, number>);

        for (const [cabinClass, count] of Object.entries(passengerCountByClass)) {
          const inventory = await tx.flightInventory.findUnique({
            where: {
              flightId_class: {
                flightId: flight.id,
                class: cabinClass as CabinClass,
              },
            },
          });

          if (!inventory || inventory.availableSeats < count) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Not enough seats available in ${cabinClass} class.`,
            });
          }

          await tx.flightInventory.update({
            where: { id: inventory.id },
            data: { availableSeats: { decrement: count } },
          });
        }

        const booking = await tx.booking.create({
          data: {
            userId: ctx.session.user.id,
            flightId: flight.id, 
            bookingCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
            status: BookingStatus.PENDING_PAYMENT,
            totalPrice: totalPrice,
            currency: offer!.price.currency,
            passengers: {
              create: input.passengers.map(p => ({
                ...p,
              }))
            }
          }
        });

        return booking;
      });

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: booking.currency.toLowerCase(),
              product_data: {
                name: `Flight Booking ${booking.bookingCode}`,
              },
              unit_amount: Math.round(Number(booking.totalPrice) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXTAUTH_URL}/bookings/confirmation/${booking.id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/bookings/checkout/${input.offerId}`,
        metadata: {
          bookingId: booking.id,
        },
      });

      return {
        bookingId: booking.id,
        checkoutUrl: session.url,
      };
    }),

  verifyPayment: protectedProcedure
    .input(z.object({ bookingId: z.string(), sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      // This is now just a status check. 
      // The authoritative update happens in the Stripe Webhook.
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: { 
          passengers: { include: { ticket: true } },
          flight: {
            include: {
              airline: true,
              segments: {
                include: {
                  departureAirport: true,
                  arrivalAirport: true,
                }
              }
            }
          }
        }
      });

      if (!booking || booking.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return {
        status: booking.status,
        isPaid: booking.status === BookingStatus.PAID || booking.status === BookingStatus.TICKETED,
        booking
      };
    }),

  getUserBookings: protectedProcedure
    .query(async ({ ctx }) => {
      return prisma.booking.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          flight: {
            include: {
              airline: true,
              segments: {
                include: {
                  departureAirport: true,
                  arrivalAirport: true,
                }
              }
            }
          },
          passengers: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getBookingDetails: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ input, ctx }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          flight: {
            include: {
              airline: true,
              segments: {
                include: {
                  departureAirport: true,
                  arrivalAirport: true,
                }
              }
            }
          },
          passengers: {
            include: {
              ticket: true
            }
          },
          payments: true,
          tickets: true,
        }
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (booking.userId !== ctx.session.user.id && !ctx.session.user.roles.includes("ADMIN")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return booking;
    }),
});
