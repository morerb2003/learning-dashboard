# AURA Learning Management System

AURA is a role-based learning management system built with Next.js and
Supabase. It provides student learning workflows, teacher course management,
and platform administration in one application.

## Features

- Email/password authentication, Google OAuth, and password recovery
- Student, pending teacher, teacher, and admin roles
- Course discovery with search, filters, sorting, and enrollment
- Lessons, progress tracking, notes, assignments, quizzes, and certificates
- Course reviews, notifications, messaging, discussions, and announcements
- Teacher analytics, course cloning, bulk lesson import, and CSV export
- Admin user management, moderation, audit logs, and platform analytics
- Supabase Row Level Security (RLS), database triggers, storage, and Realtime
- Unit tests and Playwright end-to-end tests

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Supabase Auth, Postgres, Storage, and Realtime
- Tailwind CSS 4
- Framer Motion and Recharts
- Node.js test runner and Playwright

## Quick Start

Requirements:

- Node.js 20.9 or newer
- npm
- A Supabase project

Install dependencies and configure the environment:

```bash
npm install
copy .env.example .env.local
```

Set the following required variables in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run the SQL files in the Supabase SQL Editor in this order:

1. `seed.sql`
2. `admin-policies.sql`
3. `lesson_progress.sql`
4. `assignments.sql`
5. `quizzes.sql`
6. `teacher-course-management.sql`
7. `professional-features.sql`
8. `remaining-features.sql`

The scripts are designed to be rerunnable. `fix-registration.sql`,
`enrollments.sql`, and `lessons.sql` are compatibility or focused repair
scripts and are not required after the complete sequence above.

Start the application:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Configuration

In **Authentication > URL Configuration**, set the site URL and allow the auth
callback URL:

```text
http://localhost:3000
http://localhost:3000/auth/callback
```

For a deployed app, replace the local origin with the production origin.

The SQL setup creates these public storage buckets:

- `course-thumbnails`
- `assignment-submissions`

Teacher registrations initially receive the `pending_teacher` role. An admin
must promote the profile to `teacher` before teacher routes become available.

## Upstash Redis Configuration (Rate Limiting, Cache, & Idempotency)

AURA integrates **Upstash Redis** for high-performance serverless rate limiting, response caching, temporary verification data, login security throttling, and payment idempotency. Supabase PostgreSQL remains the persistent source of truth.

### Setup Instructions:

1. **Create an Upstash Redis Database**:
   - Go to [Upstash Console](https://console.upstash.com/) and create a free or standard Redis database.
   - Choose a region geographically close to your Supabase instance / Vercel deployment.
2. **Copy REST Credentials**:
   - Under database details, find the **REST API** section.
   - Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. **Configure Local Environment**:
   - Add the variables to your local `.env.local`:
     ```env
     UPSTASH_REDIS_REST_URL=https://your-upstash-redis-url.upstash.io
     UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-rest-token
     ```
   - **Security Note**: Never expose these credentials with `NEXT_PUBLIC_`. Redis is strictly server-only.
4. **Configure Production (Vercel)**:
   - In your Vercel Project Settings > **Environment Variables**, add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
5. **Restart & Redeploy**:
   - For local development: restart `npm run dev`.
   - For production: trigger a redeploy or git push.

*Note: If Redis environment variables are omitted or temporarily unreachable, AURA automatically and gracefully activates in-memory fail-safe fallbacks so core LMS functionality is never interrupted.*

## Razorpay Payment Gateway Configuration (Test & Live Modes)

AURA natively integrates **Razorpay** for course enrollments and subscription upgrades, featuring HMAC-SHA256 signature verification, Redis payment idempotency, and automated webhook reconciliation.

### Setup Instructions:

1. **Obtain API Keys from Razorpay Dashboard**:
   - Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
   - Navigate to **Settings > API Keys**.
   - Generate your **Key ID** (`rzp_test_...` or `rzp_live_...`) and **Key Secret**.
2. **Configure Webhook**:
   - In Razorpay Dashboard, go to **Settings > Webhooks > Add New Webhook**.
   - Set **Webhook URL**: `https://your-domain.com/api/payments/webhook` (or using ngrok during local development).
   - Enter a secure random string for **Secret** (e.g. 32 alphanumeric characters).
   - Select active events:
     - `payment.captured`
     - `order.paid`
     - `payment.failed`
3. **Set Environment Variables in `.env.local`**:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   PAYMENT_GATEWAY=razorpay
   ```
   *Security Warning*: `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are strictly server-only. Never expose them to client code or prefix with `NEXT_PUBLIC_`.
4. **Fallback / Test Mock Gateway**:
   - If `PAYMENT_GATEWAY` is omitted or set to `mock`, AURA uses the built-in `MockPaymentGateway` for instantaneous testing without external network dependencies.

## Commands

```bash
npm run dev             # Start the local development server
npm run dev:host        # Expose the server to the local network
npm run lint            # Run ESLint
npm test                # Run unit tests
npm run test:e2e        # Run Playwright tests
npm run test:e2e:ui     # Open Playwright UI mode
npm run test:e2e:install
npm run build           # Validate types and create a production build
npm start               # Run the production build
```

Authenticated E2E workflows use optional test account variables documented in
[`.env.example`](.env.example). Tests skip workflows whose credentials or seed
records are unavailable.

## Project Structure

```text
app/          App Router pages, layouts, and the OAuth callback route
components/   Client UI grouped by feature
lib/          Auth, Supabase, analytics, and server-side course operations
types/        Shared TypeScript domain models
tests/        Unit tests
e2e/          Playwright tests
docs/         Architecture, application API, and database references
*.sql         Idempotent Supabase schema and policy scripts
proxy.ts      Session refresh and route-level access control
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Application API](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Contributor Guide](CONTRIBUTING.md)

## Security Model

The browser uses the public Supabase anon key. Authorization is enforced by:

1. `proxy.ts` for authentication and admin route redirects
2. Server-side guards for role-sensitive pages
3. Postgres RLS policies as the final data access boundary
4. Ownership checks for teacher and student records

Never place the Supabase service-role key in a `NEXT_PUBLIC_*` variable or
client-side code.
