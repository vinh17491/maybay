This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# SYSTEM AUDIT REPORT (5/27/2026)

## Production Readiness Score: 55/100
**Status: NOT PRODUCTION READY**

### 1. Infrastructure Layer (FAIL) - [PRIORITY 1]
- **Problem:** Redis failure blocks all tRPC API requests due to missing fail-safe in Rate Limiter.
- **Affected File:** `src/lib/redis.ts`, `src/services/rate-limit.service.ts`, `src/server/trpc.ts`
- **Root Cause:** No try-catch/fail-open logic in global middleware.
- **Risk:** Critical - System downtime.

### 2. Booking & Inventory System (FAIL) - [PRIORITY 2]
- **Problem:** Data integrity risk. Booking linked to random flights if offer matching fails. Weak `bookingCode` generation.
- **Affected File:** `src/server/routers/booking.ts` (Lines 34-44)
- **Current Behavior:** Uses `prisma.flight.findFirst()` as fallback, potentially linking a booking to the wrong flight.
- **Expected Behavior:** Must accurately map Amadeus Offer to a specific database record or upsert flight details.
- **Root Cause:** Missing proper flight upsert/mapping logic from external API to DB.
- **Risk:** Critical - Financial & Data inconsistency.

### 3. Payment Integration (FAIL) - [PRIORITY 3]
- **Problem:** Missing Stripe Webhooks. High risk of losing payment status if redirect fails.
- **Affected File:** `src/server/routers/booking.ts` (Lines 126-172)
- **Current Behavior:** Relies on client-side `verifyPayment` call after redirect.
- **Expected Behavior:** Must use Server-to-Server Webhooks to confirm payment status reliably.
- **Root Cause:** Single-point-of-failure relying on client-side redirect.
- **Risk:** High - Financial loss.

### 4. Authentication & Authorization (WARNING) - [PRIORITY 4]
- **Problem:** Hardcoded role strings ("ADMIN") and potential JWT token bloat.
- **Affected File:** `src/lib/auth.ts`, `src/server/trpc.ts`
- **Root Cause:** String-based RBAC instead of Enum/Constants.
- **Risk:** High - Security & Maintainability.

### 5. Security & Privacy (MEDIUM) - [PRIORITY 5]
- **Audit Leak:** Sensitive data (passports, emails) stored in plain text Json in Audit Logs.
- **PDF XSS:** Unsanitized DB input rendered in PDF tickets.
- **Affected Files:** `src/services/audit.service.ts`, `src/services/ticket.service.ts`
- **Risk:** Medium - Data privacy & Script injection.

### 6. Realtime & Notifications (BROKEN) - [PRIORITY 6]
- **Problem:** Realtime notification system is missing implementation.
- **Affected Files:** `src/services/notification.service` (Missing), `src/app/api/notifications/route.ts` (Missing)
- **Current Behavior:** No realtime updates for booking status or flight changes.
- **Expected Behavior:** Implementation of WebSockets or SSE for instant user alerts.
- **Root Cause:** Feature requested but not yet implemented in the codebase.
- **Risk:** Medium - UX impact.

---

## Detailed Functional Bug List

| Feature | Status | Bug Type | Affected File | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Search History** | Broken | Logic Error | `src/services/search-history.service.ts` | History saved but not displayed in UI. |
| **Admin Dashboard** | Warning | Performance | `src/server/routers/admin.ts` | Missing pagination in booking lists (N+1 risk). |
| **Inventory Management** | Warning | Logic Error | `src/server/routers/booking.ts` | Potential race condition in seat decrement. |
| **Email Service** | Warning | Runtime | `src/services/email.service.ts` | Hardcoded SMTP config with no production fallback. |
| **SEO** | Warning | UI Bug | `src/app/layout.tsx` | Missing dynamic OpenGraph tags for flights. |

---
*Note: This audit was performed by Cline (Senior QA & Security Engineer AI). No code was modified during this process.*
