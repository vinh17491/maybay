import { Button } from "@/components/ui/button";
import { SearchForm } from "@/features/flights/components/search-form";
import { PlaneTakeoff, Globe, ShieldCheck, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative h-[500px] w-full flex items-center justify-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10" />
          {/* We'll add a background image later */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-50" />
        </div>
        
        <div className="container relative z-20 px-4 md:px-6">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl">
              Discover the World, <br />
              One Flight at a Time
            </h1>
            <p className="text-lg text-slate-300 md:text-xl">
              Book your next trip with confidence. Best prices, real-time availability, and world-class support.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container -mt-24 relative z-30 px-4 md:px-6">
        <div className="bg-background border rounded-xl shadow-lg p-6 md:p-8">
          <SearchForm />
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold">Global Reach</h3>
            <p className="text-sm text-muted-foreground">Access thousands of routes and airlines worldwide in one place.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold">Secure Booking</h3>
            <p className="text-sm text-muted-foreground">Your data and payments are always protected with industry-standard encryption.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <PlaneTakeoff className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold">Real-time Updates</h3>
            <p className="text-sm text-muted-foreground">Get instant notifications about flight status and gate changes.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold">24/7 Support</h3>
            <p className="text-sm text-muted-foreground">Our customer service team is here to help you around the clock.</p>
          </div>
        </div>
      </section>

      {/* Promotional Section */}
      <section className="container px-4 md:px-6">
        <div className="rounded-2xl bg-slate-100 p-8 md:p-12 dark:bg-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Ready for your next adventure?</h2>
            <p className="text-muted-foreground max-w-md">
              Sign up for our newsletter and get exclusive deals delivered straight to your inbox. Save up to 30% on your next booking!
            </p>
            <div className="flex gap-4">
              <Button size="lg">Join Now</Button>
              <Button variant="outline" size="lg">Learn More</Button>
            </div>
          </div>
          <div className="hidden lg:block relative h-64 w-64">
             <PlaneTakeoff className="h-full w-full text-slate-200 dark:text-slate-700 -rotate-12" />
          </div>
        </div>
      </section>
    </div>
  );
}
