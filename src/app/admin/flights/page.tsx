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
import { Plus, Search, Edit, Trash, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminFlightsPage() {
  const { data: flights, isLoading } = trpc.admin.getFlights.useQuery({
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Flight Management</h1>
          <p className="text-muted-foreground">View and manage your airline{"'"}s flight inventory</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Flight
        </Button>
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search flights..." className="pl-10" />
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
                <TableHead>Flight #</TableHead>
                <TableHead>Airline</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flights?.map((flight) => {
                const firstSegment = flight.segments[0];
                const lastSegment = flight.segments[flight.segments.length - 1];
                
                return (
                  <TableRow key={flight.id}>
                    <TableCell className="font-medium">{flight.flightNumber}</TableCell>
                    <TableCell>{flight.airline.name}</TableCell>
                    <TableCell>
                      {firstSegment && lastSegment ? (
                        `${firstSegment.departureAirport.code} → ${lastSegment.arrivalAirport.code}`
                      ) : (
                        "No route"
                      )}
                    </TableCell>
                    <TableCell>
                      {firstSegment ? format(new Date(firstSegment.departureTime), "MMM d, HH:mm") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={flight.status === "SCHEDULED" ? "default" : "secondary"}>
                        {flight.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!flights || flights.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No flights found.
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
