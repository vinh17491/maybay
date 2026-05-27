import { FlightOffer } from "@/server/providers/flight/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, Clock, Luggage, Info } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

interface FlightCardProps {
  offer: FlightOffer;
  onSelect?: (offerId: string) => void;
}

export function FlightCard({ offer, onSelect }: FlightCardProps) {
  const firstSegment = offer.segments[0];
  const lastSegment = offer.segments[offer.segments.length - 1];
  
  const departureTime = firstSegment.departureTime;
  const arrivalTime = lastSegment.arrivalTime;
  
  const totalDuration = offer.segments.reduce((acc, segment) => acc + segment.duration, 0);
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  const stops = offer.segments.length - 1;

  // Use the airline of the first segment for primary display
  const primaryAirline = firstSegment.airline;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Airline Info */}
          <div className="flex items-center gap-3 md:w-40 shrink-0">
            {primaryAirline.logoUrl ? (
              <Image 
                src={primaryAirline.logoUrl} 
                alt={primaryAirline.name} 
                width={32} 
                height={32} 
                className="object-contain" 
              />
            ) : (
              <div className="h-8 w-8 bg-muted flex items-center justify-center rounded">
                <Plane className="h-4 w-4" />
              </div>
            )}
            <span className="font-medium text-sm">{primaryAirline.name}</span>
          </div>

          {/* Flight Path */}
          <div className="flex-1 flex items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="text-xl font-bold">{format(new Date(departureTime), "HH:mm")}</div>
              <div className="text-sm text-muted-foreground">{firstSegment.departureAirport.code}</div>
            </div>

            <div className="flex-1 flex flex-col items-center max-w-[200px]">
              <div className="text-xs text-muted-foreground mb-1">
                {hours}h {minutes}m
              </div>
              <div className="relative w-full flex items-center justify-center">
                <div className="h-[2px] bg-border w-full absolute top-1/2 -translate-y-1/2" />
                <div className="flex gap-1 relative bg-background px-2">
                  {stops === 0 ? (
                    <span className="text-[10px] font-medium text-emerald-600 uppercase">Direct</span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-600 uppercase">
                      {stops} {stops === 1 ? "Stop" : "Stops"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="text-xl font-bold">{format(new Date(arrivalTime), "HH:mm")}</div>
              <div className="text-sm text-muted-foreground">{lastSegment.arrivalAirport.code}</div>
            </div>
          </div>

          {/* Price & Action */}
          <div className="shrink-0 flex flex-col items-end gap-2 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 min-w-[150px]">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              From
            </div>
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: offer.price.currency,
              }).format(offer.price.amount)}
            </div>
            <Button className="w-full" onClick={() => onSelect?.(offer.id)}>
              Select
            </Button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Luggage className="h-3 w-3" />
            <span>Cabin: {offer.cabinClass}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Flight: {firstSegment.flightNumber}</span>
          </div>
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>{offer.availableSeats} seats left at this price</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
