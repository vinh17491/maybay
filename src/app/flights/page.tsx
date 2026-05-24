"use client";

// Re-triggering Vercel build
import { useSearchParams } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import { FlightCard } from "@/features/flights/components/flight-card";
import { FlightFilters } from "@/features/flights/components/flight-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { CabinClass } from "@prisma/client";
import { FlightOffer } from "@/server/providers/flight/types";
import { Suspense } from "react";

function FlightsContent() {
  const searchParams = useSearchParams();
  
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const departureDate = searchParams.get("departureDate") ? new Date(searchParams.get("departureDate")!) : new Date();
  const returnDate = searchParams.get("returnDate") ? new Date(searchParams.get("returnDate")!) : undefined;
  const passengers = parseInt(searchParams.get("passengers") || "1");
  const cabinClass = (searchParams.get("cabinClass") as CabinClass) || CabinClass.ECONOMY;

  const { data, isLoading, error } = trpc.flight.searchFlights.useQuery({
    origin,
    destination,
    departureDate,
    returnDate,
    passengers: { adults: passengers },
    cabinClass,
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-1/4 shrink-0">
        <FlightFilters />
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              `${data?.offers.length || 0} flights found`
            )}
          </h1>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))
          ) : error ? (
            <div className="p-8 text-center border rounded-lg bg-destructive/10 text-destructive">
              <p className="font-semibold">Error loading flights</p>
              <p className="text-sm">{error.message}</p>
            </div>
          ) : data?.offers.length === 0 ? (
            <div className="p-12 text-center border rounded-lg bg-muted/50">
              <p className="text-lg font-medium">No flights found</p>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          ) : (
            data?.offers.map((offer: FlightOffer) => (
              <FlightCard 
                key={offer.id} 
                offer={offer} 
                onSelect={(id: string) => console.log("Selected offer:", id)} 
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default function FlightsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<FlightsSkeleton />}>
        <FlightsContent />
      </Suspense>
    </div>
  );
}

function FlightsSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-1/4 shrink-0">
        <div className="h-[600px] w-full bg-muted animate-pulse rounded-lg" />
      </aside>
      <main className="flex-1 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-[2px] w-1/4" />
        <Skeleton className="h-12 w-1/4" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
