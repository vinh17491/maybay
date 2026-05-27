"use client";

import { use } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Plane, 
  User, 
  CreditCard,
  Loader2,
  AlertCircle,
  Download,
  Clock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function BookingConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const { data: booking, isLoading, error } = trpc.booking.getBookingDetails.useQuery(
    { bookingId },
    { 
      enabled: !!bookingId,
      refetchInterval: (query) => 
        query.state.data?.status === "PENDING_PAYMENT" ? 2000 : false 
    }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn{"'"}t find the booking you{"'"}re looking for.</p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const isConfirmed = booking.status === "TICKETED" || booking.status === "PAID";
  const isProcessing = sessionId && !isConfirmed && booking.status === "PENDING_PAYMENT";

  return (
    <div className="container py-10 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground">Reference: <span className="font-mono font-bold text-foreground">{booking.bookingCode}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isConfirmed ? "default" : (booking.status === "CANCELLED" ? "destructive" : "secondary")} className="text-sm px-4 py-1">
            {booking.status}
          </Badge>
          {isConfirmed && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Tickets
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Success Message if Confirmed */}
          {isConfirmed && (
            <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Booking Confirmed!</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      Your tickets have been issued and sent to your email. You can also download them here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Message */}
          {isProcessing && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin shrink-0" />
                  <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Processing Payment...</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      We are confirming your payment with Stripe. This may take a few seconds.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flight Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flight Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {booking.flight.airline.logoUrl && (
                    <Image 
                      src={booking.flight.airline.logoUrl} 
                      alt={booking.flight.airline.name} 
                      width={32} 
                      height={32} 
                      className="object-contain" 
                    />
                  )}
                  <div>
                    <div className="font-bold">{booking.flight.airline.name}</div>
                    <div className="text-xs text-muted-foreground">Flight {booking.flight.flightNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{booking.passengers[0].cabinClass}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4 py-4 border-y">
                <div className="text-center md:text-left">
                  <div className="text-2xl font-bold">
                    {booking.flight.segments[0].departureAirport.code}
                  </div>
                  <div className="text-sm font-medium">{booking.flight.segments[0].departureAirport.city}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(booking.flight.segments[0].departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {booking.flight.segments[0].duration}m
                  </div>
                  <div className="relative w-full flex items-center justify-center">
                    <div className="h-[2px] bg-border w-full absolute" />
                    <Plane className="h-4 w-4 text-primary relative bg-background px-1" />
                  </div>
                  <div className="text-xs font-medium mt-1">Direct</div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-2xl font-bold">
                    {booking.flight.segments[0].arrivalAirport.code}
                  </div>
                  <div className="text-sm font-medium">{booking.flight.segments[0].arrivalAirport.city}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(booking.flight.segments[0].arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passengers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Passengers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {booking.passengers.map((passenger) => (
                  <div key={passenger.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">{passenger.firstName} {passenger.lastName}</div>
                        <div className="text-sm text-muted-foreground">Passport: {passenger.passportNumber}</div>
                      </div>
                      {passenger.ticket && (
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Ticket Number</div>
                          <div className="font-mono text-sm">{passenger.ticket.ticketNumber}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm border-b pb-2">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{booking.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Amount</span>
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: booking.currency,
                  }).format(Number(booking.totalPrice))}
                </span>
              </div>
              
              {!isConfirmed && booking.status === "PENDING_PAYMENT" && !sessionId && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-md">
                   <div className="flex gap-2">
                     <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                     <p className="text-xs text-amber-800 dark:text-amber-200">
                       Awaiting payment. If you have already paid, please wait a moment for the status to update.
                     </p>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>For any changes or cancellations, please contact our support team.</p>
              <Button variant="link" className="p-0 h-auto" asChild>
                 <Link href="/contact">Contact Support</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
