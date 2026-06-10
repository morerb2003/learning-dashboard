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
