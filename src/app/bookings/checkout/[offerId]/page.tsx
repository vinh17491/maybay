"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CabinClass } from "@prisma/client";
import { Loader2, Plus, Trash2, Plane, Info } from "lucide-react";
import Image from "next/image";

const passengerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  passportNumber: z.string().min(5, "Passport number is required"),
  nationality: z.string().min(2, "Nationality is required"),
  cabinClass: z.nativeEnum(CabinClass),
});

const checkoutSchema = z.object({
  passengers: z.array(passengerSchema).min(1),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = use(params);
  const router = useRouter();

  // Fetch the offer details to show a summary
  const { data: offer, isLoading: isOfferLoading } = trpc.flight.getFlightDetails.useQuery(
    { offerId }, 
    { enabled: !!offerId }
  );

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      passengers: [
        {
          firstName: "",
          lastName: "",
          email: "",
          passportNumber: "",
          nationality: "",
          cabinClass: CabinClass.ECONOMY,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "passengers",
  });

  const createBooking = trpc.booking.createBooking.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/bookings/confirmation/${data.bookingId}`);
      }
    },
  });

  async function onSubmit(values: CheckoutValues) {
    createBooking.mutate({
      offerId,
      passengers: values.passengers,
    });
  }

  if (isOfferLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading flight details...</p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Offer Not Found</h1>
        <p className="text-muted-foreground mb-8">The flight offer may have expired. Please search again.</p>
        <Button onClick={() => router.push("/")}>Back to Search</Button>
      </div>
    );
  }

  const totalPrice = offer.price.amount * fields.length;

  return (
    <div className="container py-10 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      Passenger {index + 1}
                    </CardTitle>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`passengers.${index}.firstName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`passengers.${index}.lastName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`passengers.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`passengers.${index}.passportNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passport Number</FormLabel>
                          <FormControl>
                            <Input placeholder="A1234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`passengers.${index}.nationality`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nationality</FormLabel>
                          <FormControl>
                            <Input placeholder="Vietnam" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      firstName: "",
                      lastName: "",
                      email: "",
                      passportNumber: "",
                      nationality: "",
                      cabinClass: offer.cabinClass as CabinClass,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Passenger
                </Button>

                <Button type="submit" size="lg" disabled={createBooking.isPending} className="w-full sm:w-auto">
                  {createBooking.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Pay {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: offer.price.currency,
                  }).format(totalPrice)}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Flight Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                {offer.segments[0].airline.logoUrl && (
                  <Image 
                    src={offer.segments[0].airline.logoUrl} 
                    alt={offer.segments[0].airline.name} 
                    width={32} 
                    height={32} 
                    className="object-contain" 
                  />
                )}
                <div>
                  <div className="font-bold">{offer.segments[0].airline.name}</div>
                  <div className="text-xs text-muted-foreground">Flight {offer.segments[0].flightNumber}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <div className="text-center">
                  <div className="font-bold">{offer.segments[0].departureAirport.code}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{offer.segments[0].departureAirport.city}</div>
                </div>
                <div className="flex flex-col items-center">
                  <Plane className="h-4 w-4 text-muted-foreground rotate-90" />
                  <div className="h-[1px] bg-border w-full" />
                </div>
                <div className="text-center">
                  <div className="font-bold">{offer.segments[offer.segments.length - 1].arrivalAirport.code}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{offer.segments[offer.segments.length - 1].arrivalAirport.city}</div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Class</span>
                  <span className="font-medium">{offer.cabinClass}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Passengers</span>
                  <span className="font-medium">x{fields.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per person</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: offer.price.currency,
                    }).format(offer.price.amount)}
                  </span>
                </div>
                <div className="pt-4 border-t flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: offer.price.currency,
                    }).format(totalPrice)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 text-blue-600" />
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Payment is processed securely via Stripe. Your seats are held temporarily during checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
