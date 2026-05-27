import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { BookingStatus, PaymentStatus, Ticket } from "@prisma/client";
import { TicketService } from "@/services/ticket.service";
import { EmailService } from "@/services/email.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;

      if (!bookingId) {
        console.error("No bookingId found in session metadata");
        break;
      }

      await handleSuccessfulPayment(bookingId, session);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.bookingId;

      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED },
        });
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(bookingId: string, session: Stripe.Checkout.Session) {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { include: { profile: true } },
        passengers: true,
        flight: {
          include: {
            airline: true,
            segments: {
              include: {
                departureAirport: true,
                arrivalAirport: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      console.error(`Booking ${bookingId} not found`);
      return;
    }

    if (booking.status === BookingStatus.PAID || booking.status === BookingStatus.TICKETED) {
      return;
    }

    // 1. Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.TICKETED },
      include: {
        user: { include: { profile: true } },
        passengers: true,
        flight: {
          include: {
            airline: true,
            segments: {
              include: {
                departureAirport: true,
                arrivalAirport: true,
              },
            },
          },
        },
      },
    });

    // 2. Record payment
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        currency: booking.currency,
        status: PaymentStatus.COMPLETED,
        provider: "STRIPE",
        transactionId: session.id,
      },
    });

    // 3. Issue tickets
    const tickets: Ticket[] = [];
    for (const passenger of updatedBooking.passengers) {
      const ticket = await tx.ticket.create({
        data: {
          bookingId: updatedBooking.id,
          passengerId: passenger.id,
          ticketNumber: `TK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          status: "ISSUED",
          issuedAt: new Date(),
        },
      });
      tickets.push(ticket);
    }

    // 4. Send confirmation email (Can be moved to a background job in production)
    if (updatedBooking.user) {
      try {
        const bookingWithTickets = {
          ...updatedBooking,
          passengers: updatedBooking.passengers.map((p, idx) => ({
            ...p,
            ticket: tickets[idx],
          })),
        };
        const pdfBuffer = await TicketService.generateTicketPDF(bookingWithTickets as any);
        await EmailService.sendBookingConfirmation(
          updatedBooking.user.email,
          bookingWithTickets as any,
          pdfBuffer
        );
      } catch (e) {
        console.error("Failed to send booking confirmation email:", e);
      }
    }
  });
}
