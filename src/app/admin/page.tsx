"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  CreditCard,
  Plane,
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { trpc } from "@/components/providers/trpc-provider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
  const { data: recentBookings, isLoading: bookingsLoading } = trpc.admin.getRecentBookings.useQuery({ limit: 5 });

  if (statsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statsConfig = [
    {
      title: "Total Revenue",
      value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(stats?.totalRevenue || 0)),
      change: "+12.5%",
      isPositive: true,
      icon: CreditCard,
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings.toLocaleString() || "0",
      change: "+18.2%",
      isPositive: true,
      icon: Ticket,
    },
    {
      title: "Active Users",
      value: stats?.totalUsers.toLocaleString() || "0",
      change: "-2.4%",
      isPositive: false,
      icon: Users,
    },
    {
      title: "Flights Operating",
      value: stats?.activeFlights.toLocaleString() || "0",
      change: "+4.3%",
      isPositive: true,
      icon: Plane,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={cn(
                  "text-xs mt-1 flex items-center gap-1",
                  stat.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {stat.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                  <span className="text-muted-foreground ml-1">from last month</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings?.map((booking) => {
                const userName = booking.user?.profile 
                  ? `${booking.user.profile.firstName} ${booking.user.profile.lastName}`
                  : booking.user?.email || "Guest";
                
                const isConfirmed = booking.status === "PAID" || booking.status === "TICKETED" || booking.status === "COMPLETED";

                return (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.flight.airline.name} • {format(new Date(booking.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${Number(booking.totalPrice).toFixed(2)}</p>
                      <p className={cn(
                        "text-xs px-2 py-0.5 rounded-full inline-block",
                        isConfirmed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {booking.status}
                      </p>
                    </div>
                  </div>
                );
              })}
              {(!recentBookings || recentBookings.length === 0) && (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent bookings found.</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              Revenue chart visualization will be implemented with Recharts
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
