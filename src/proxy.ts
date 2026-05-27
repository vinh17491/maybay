import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// next-auth declarations are already in src/lib/auth.ts

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { nextUrl } = request;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAuthRoute = nextUrl.pathname.startsWith("/api/auth") || 
                     nextUrl.pathname.startsWith("/login") || 
                     nextUrl.pathname.startsWith("/register");
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  if (isAuthRoute) {
    return NextResponse.next();
  }

  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // RBAC Check
    const userRoles: string[] = session.user?.roles || [];
    const hasAdminAccess = userRoles.some((role: string) => ["ADMIN", "SUPER_ADMIN"].includes(role));

    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (!session && !isAuthRoute && !isApiRoute && nextUrl.pathname !== "/") {
    // For protected customer routes like /bookings
    if (nextUrl.pathname.startsWith("/bookings") || nextUrl.pathname.startsWith("/profile")) {
       return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
