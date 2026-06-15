# AURA Payments and Monetization

## Architecture

```text
Checkout UI
   |
   | POST /api/payments/intents (product IDs, coupon, idempotency key)
   v
Payment Service ---------------------> Supabase auth session
   |                                      |
   | create_payment_intent()              | identifies user
   v                                      v
Postgres pricing transaction <------ courses / plans / coupons / redemptions
   |
   | trusted amount + currency
   v
Payment Gateway Adapter
   |  Mock today
   |  Stripe: PaymentIntent.create()
   |  Razorpay: orders.create()
   v
Provider intent + client secret
   |
   | Client confirms with provider SDK
   | Mock: POST /api/payments/intents/:id/confirm
   | Stripe production: signed webhook
   v
Server-only Payment Service (service role)
   |
   | confirm_payment_intent()
   v
Single Postgres transaction
   +-- completed payment
   +-- enrollment OR active subscription
   +-- coupon redemption
   +-- platform ledger credit
   +-- teacher ledger credit
   +-- succeeded payment intent
   |
   v
Supabase Realtime publication
   |
   v
Admin revenue dashboard refreshes transactions, charts, and ledger totals
```

The browser never supplies a trusted price and cannot write completed payments,
subscriptions, coupon redemptions, or ledger rows. Provider attachment and
confirmation RPCs are executable only by the Supabase `service_role`.

## Database Schema

The complete additive migration is in [`monetization.sql`](../monetization.sql).

| Table | Purpose |
| --- | --- |
| `subscription_plans` | Free, Pro, and Premium catalog with monthly/yearly prices and feature entitlements |
| `subscriptions` | Provider-aware subscription lifecycle and current billing period |
| `coupons` | Percentage/fixed discounts, validity window, global/per-user limits, minimum order, plan scope |
| `coupon_courses` | Optional allow-list for course-specific coupons |
| `coupon_redemptions` | Immutable usage records linked to intents and payments |
| `payment_intents` | Trusted server quote, provider state, idempotency key, and immutable pricing snapshot |
| `payments` | Settled transaction record created only during confirmation |
| `revenue_ledger` | Immutable platform and teacher credits with commission basis points |

Money used for decisions and ledger accounting is stored as integer minor units
(`*_cents`). Existing decimal payment columns remain populated for compatibility
with the current UI.

## Core Flow

1. `create_payment_intent` authenticates the user, locks relevant pricing rows,
   checks existing access, calculates the course or plan price, validates the
   coupon, and stores a pricing snapshot.
2. `PaymentGateway.createIntent` creates the provider-side intent from that
   trusted quote. The mock adapter follows the same contract as a future Stripe
   adapter.
3. The provider is confirmed. In production Stripe mode, this step should be a
   signed `payment_intent.succeeded` webhook rather than a browser assertion.
4. `confirm_payment_intent` locks the intent and coupon, rechecks coupon limits,
   creates access and accounting records atomically, and is idempotent for an
   already-succeeded intent.

## APIs and Services

```text
POST /api/payments/intents
{
  "purchaseType": "course",
  "courseId": "<uuid>",
  "couponCode": "AURA50",
  "idempotencyKey": "<checkout-session-uuid>"
}

POST /api/payments/intents/:id/confirm
```

For subscriptions:

```json
{
  "purchaseType": "subscription",
  "planCode": "premium",
  "billingCycle": "yearly",
  "couponCode": "YEARLY20",
  "idempotencyKey": "<checkout-session-uuid>"
}
```

Key modules:

- `lib/payments/service.ts`: authenticated orchestration and privileged finalization
- `lib/payments/gateway.ts`: provider interface and mock implementation
- `lib/payments/types.ts`: stable contracts shared by APIs and services
- `lib/course/payment.ts`: compatibility server actions used by the existing checkout modal

## Stripe Migration

Implement `PaymentGateway` with Stripe, persist Stripe customer/subscription IDs,
and have a webhook route verify `Stripe-Signature`. The webhook should locate the
intent by `provider_intent_id` and invoke the same privileged confirmation RPC.
No pricing, enrollment, coupon, or ledger code needs to move into the webhook.

## Realtime

`payment_intents`, `payments`, `subscriptions`, and `revenue_ledger` are added to
the `supabase_realtime` publication. `AdminLayout` subscribes to those tables
through the existing debounced `RealtimeRefresh` component, causing the revenue
server component to reload live transaction and ledger aggregates.

## Required Environment

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PAYMENT_GATEWAY=mock
```

The service-role key is server-only and must never use a `NEXT_PUBLIC_` prefix.
