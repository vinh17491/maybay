"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, MapPin, Users, PlaneTakeoff, PlaneLanding } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useRouter } from "next/navigation";

const searchFormSchema = z.object({
  origin: z.string().min(3, "Please enter at least 3 characters"),
  destination: z.string().min(3, "Please enter at least 3 characters"),
  departureDate: z.date({
    message: "Departure date is required",
  }),
  returnDate: z.date().optional(),
  passengers: z.number().min(1).max(9),
  cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

export function SearchForm() {
  const router = useRouter();
  const [tripType, setTripType] = useState<"one-way" | "round-trip" | "multi-city">("round-trip");

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      origin: "",
      destination: "",
      passengers: 1,
      cabinClass: "ECONOMY",
    },
  });

  function onSubmit(data: SearchFormValues) {
    const params = new URLSearchParams({
      origin: data.origin,
      destination: data.destination,
      departureDate: data.departureDate.toISOString(),
      passengers: data.passengers.toString(),
      cabinClass: data.cabinClass,
    });

    if (data.returnDate) {
      params.append("returnDate", data.returnDate.toISOString());
    }

    router.push(`/flights?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <Tabs value={tripType} onValueChange={(v) => setTripType(v as any)} className="w-full">
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="round-trip">Round-trip</TabsTrigger>
          <TabsTrigger value="one-way">One-way</TabsTrigger>
          <TabsTrigger value="multi-city">Multi-city</TabsTrigger>
        </TabsList>
      </Tabs>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Origin */}
            <FormField
              control={form.control}
              name="origin"
              render={({ field }: { field: any }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <PlaneTakeoff className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="City or Airport" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Destination */}
            <FormField
              control={form.control}
              name="destination"
              render={({ field }: { field: any }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <PlaneLanding className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="City or Airport" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Departure Date */}
            <FormField
              control={form.control}
              name="departureDate"
              render={({ field }: { field: any }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Departure</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date: Date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Return Date (Conditional) */}
            {tripType === "round-trip" && (
              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Return</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date < (form.getValues("departureDate") || new Date())
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-t pt-6">
            <div className="flex gap-4">
               {/* Passengers */}
              <FormField
                control={form.control}
                name="passengers"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Passengers</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="number" min={1} max={9} className="pl-10 w-24" {...field} onChange={(e: any) => field.onChange(parseInt(e.target.value))} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" size="lg" className="w-full md:w-auto px-12">
              Search Flights
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
