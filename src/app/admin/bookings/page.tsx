"use client";

import { trpc } from "@/components/providers/trpc-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminBookingsPage() {
  const { data: bookings, isLoading } = trpc.admin.getBookings.useQuery({
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">Monitor and manage all customer bookings</p>
        </div>
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search bookings by reference or customer..." className="pl-10" />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      <div className="border rounded-lg bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Flight</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((booking) => {
                const userName = booking.user?.profile 
                  ? `${booking.user.profile.firstName} ${booking.user.profile.lastName}`
                  : booking.user?.email || "Guest";

                const isConfirmed = ["PAID", "TICKETED", "COMPLETED"].includes(booking.status);
                const isCancelled = ["CANCELLED", "REFUNDED", "EXPIRED"].includes(booking.status);

                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.bookingCode}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{userName}</p>
                        <p className="text-xs text-muted-foreground">{booking.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{booking.flight.airline.code}</Badge>
                        <span>{booking.flight.flightNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(booking.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-bold">
                      ${Number(booking.totalPrice).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={isConfirmed ? "default" : isCancelled ? "destructive" : "secondary"}
                        className={cn(
                          isConfirmed && "bg-green-100 text-green-700 hover:bg-green-100",
                          booking.status === "PENDING_PAYMENT" && "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                        )}
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!isConfirmed && !isCancelled && (
                          <Button variant="ghost" size="icon" className="text-green-600" title="Confirm Payment">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {!isCancelled && (
                          <Button variant="ghost" size="icon" className="text-destructive" title="Cancel Booking">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!bookings || bookings.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No bookings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
