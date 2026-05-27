"use client";

import { trpc } from "@/components/providers/trpc-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Calendar, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";

export default function MyBookingsPage() {
  const { data: bookings, isLoading } = trpc.booking.getUserBookings.useQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <Button asChild>
          <Link href="/">Book New Flight</Link>
        </Button>
      </div>

      {!bookings || bookings.length === 0 ? (
        <Card className="text-center py-20">
          <CardContent>
            <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No bookings found</h2>
            <p className="text-muted-foreground mb-6">You haven{"'"}t made any bookings yet.</p>
            <Button asChild variant="outline">
              <Link href="/">Start Searching</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {booking.flight.airline.logoUrl && (
                        <Image 
                          src={booking.flight.airline.logoUrl} 
                          alt={booking.flight.airline.name} 
                          width={24}
                          height={24}
                          className="object-contain" 
                        />
                      )}
                      <span className="font-semibold">{booking.flight.airline.name}</span>
                      <span className="text-xs text-muted-foreground">|</span>
                      <span className="text-xs font-mono uppercase text-muted-foreground">{booking.bookingCode}</span>
                    </div>
                    <Badge variant={
                      booking.status === "TICKETED" ? "default" : 
                      booking.status === "CANCELLED" ? "destructive" : "secondary"
                    }>
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Departure
                      </p>
                      <p className="font-bold">
                        {booking.flight.segments?.[0] ? format(new Date(booking.flight.segments[0].departureTime), "MMM d, HH:mm") : "---"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.flight.segments?.[0]?.departureAirport?.city || "---"}
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="md:text-right">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center md:justify-end gap-1">
                        Arrival
                        <MapPin className="h-3 w-3" />
                      </p>
                      <p className="font-bold">
                        {booking.flight.segments && booking.flight.segments.length > 0
                          ? format(new Date(booking.flight.segments[booking.flight.segments.length - 1].arrivalTime), "MMM d, HH:mm") 
                          : "---"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.flight.segments && booking.flight.segments.length > 0
                          ? booking.flight.segments[booking.flight.segments.length - 1].arrivalAirport?.city 
                          : "---"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-6 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l min-w-[180px]">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Paid</p>
                    <p className="text-xl font-bold">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: booking.currency,
                      }).format(Number(booking.totalPrice))}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full mt-4">
                    <Link href={`/bookings/confirmation/${booking.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
