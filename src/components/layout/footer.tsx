import Link from "next/link";
import { Plane } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background py-12">
      <div className="container grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-2">
          <Link href="/" className="flex items-center space-x-2">
            <Plane className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SkyBooker</span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Book your next adventure with SkyBooker. The most reliable and fastest airline booking platform.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Services</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/flights">Flights</Link></li>
            <li><Link href="/hotels">Hotels</Link></li>
            <li><Link href="/packages">Packages</Link></li>
            <li><Link href="/insurance">Insurance</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/careers">Careers</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/cookie-policy">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mt-12 border-t pt-8">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SkyBooker Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
