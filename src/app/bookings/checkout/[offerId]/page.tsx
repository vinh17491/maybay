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
import { Loader2, Plus, Trash2, Plane } from "lucide-react";
import { FlightCard } from "@/features/flights/components/flight-card";

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
  const { data: offer, isLoading: isLoadingOffer } = trpc.flight.getFlightDetails.useQuery(
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

  return (
    <div className="container py-10 max-w-4xl">
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
                        <FormItem>
                          <FormLabel>Nationality</FormLabel>
                          <FormControl>
                            <Input placeholder="USA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      firstName: "",
                      lastName: "",
                      email: "",
                      passportNumber: "",
                      nationality: "",
                      cabinClass: CabinClass.ECONOMY,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Passenger
                </Button>

                <Button type="submit" size="lg" disabled={createBooking.isPending}>
                  {createBooking.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Continue to Payment
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Passengers (x{fields.length})</span>
                <span className="font-medium">$---.--</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxes & Fees</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>$---.--</span>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 bg-muted rounded-lg flex items-start gap-3">
            <Plane className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-medium">Selected Flight</p>
              <p className="text-xs text-muted-foreground">ID: {offerId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
