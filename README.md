# 🎓 AURA — Next-Generation Learning Management System

A modern, role-based Learning Management System (LMS) built with **Next.js 16**, **React 19**, **Supabase**, **Upstash Redis**, and **Tailwind CSS 4**. AURA delivers an end-to-end educational platform with personalized student workflows, teacher course creation & earnings payouts, administrative backoffice governance, AI-assisted learning tools, and secure monetization.

---

## ⚡ Key Features

### 👨‍🎓 Student Learning Experience
- **Catalog & Discovery**: Search, multi-criteria filtering, categorization, difficulty level sorting, and instant enrollment.
- **Interactive Course Player**: Video lessons, lesson notes, syllabus progression, and completion tracking.
- **Assessments & Credentials**: Multiple-choice/true-false quizzes with instant scoring, assignment submissions, and downloadable verified completion certificates.
- **Interactive Community**: Course reviews with 1–5 star ratings, threaded discussion forums with real-time updates.
- **AI-Powered Learning Suite**: On-demand AI Tutor drawer for conceptual clarification and AI Quiz Generator for self-evaluation.
- **Telemetry & Gamification**: Live activity pulse, course view counters, and real-time learner XP leaderboard.

### 👩‍🏫 Teacher Studio & Course Management
- **Course Authoring**: Course builder with syllabus hierarchy (modules & lessons), video attachments, free previews, and draft/published states.
- **Course Administration**: Course cloning, bulk lesson import, student roster inspection, and CSV export.
- **Assignment Grading**: View submitted student files and attach grades and qualitative feedback.
- **Monetization & Payouts**: Real-time revenue analytics with automated **80/20 platform commission split**, ledger tracking, and payout request modal.

### 🛡️ Administrative Governance & Security
- **User Management**: Role elevation (`student` → `pending_teacher` → `teacher` → `admin`), user status controls, and role-based profiles.
- **Moderation Queue**: Review user-flagged discussion content, resolve violations, and dismiss reports.
- **Operational Audit Logs**: Immutable platform activity trail tracking critical events.
- **Platform Analytics**: Global student enrollments, course activity, revenue charts, and platform announcements.

### ⚙️ Deep Customization (38 Settings)
- **Appearance**: Dark / Light / System modes, 6 accent colors (Violet, Cyan, Sky, Emerald, Rose, Amber), compact layout density, and reduced-motion toggles.
- **Notifications**: Instant, daily, or weekly notification frequency with granular alert channels (email, in-app, course updates, quizzes, certificates).
- **Privacy & Security**: Profile visibility, learning progress display, password management, and active session termination.
- **Role-Specific Preferences**: Tailored settings workspaces for Students, Teachers, and Admins.

---

## 🛠️ Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 16 (App Router)** | Server Components (RSC), Dynamic Server Actions, and Turbopack |
| **React 19** | Latest React concurrent features and modern state management |
| **TypeScript 5** | Strict, end-to-end type safety |
| **Supabase** | PostgreSQL database, Row Level Security (RLS), Auth, Storage, & Realtime |
| **Upstash Redis** | Serverless rate-limiting, request caching, and payment idempotency locks |
| **Razorpay** | Payment gateway with HMAC-SHA256 signature verification & webhooks |
| **Tailwind CSS 4** | High-performance modern utility styling |
| **Framer Motion** | Fluid micro-interactions, tilt cards, spotlights, and counters |
| **Recharts** | Interactive revenue, enrollment, and activity analytics charts |
| **Node.js Test Runner & Playwright** | 70 automated unit/integration tests and end-to-end browser testing |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v20.9` or newer
- **npm**: `v10` or newer
- **Supabase Account**: A provisioned PostgreSQL project ([supabase.com](https://supabase.com))
- **Upstash Redis Account** *(Optional but recommended)*: Free serverless database ([upstash.com](https://upstash.com))
- **Razorpay Account** *(Optional)*: Test API keys ([razorpay.com](https://razorpay.com))

### 2. Installation & Setup

```bash
# Clone the repository
git clone https://github.com/morerb2003/learning-dashboard.git
cd learning-dashboard

# Install dependencies
npm install

# Create environment configuration
copy .env.example .env.local
```

### 3. Configure Environment Variables (`.env.local`)

```env
# Required Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Upstash Redis (Server-only; optional, defaults to memory fail-safe fallback)
UPSTASH_REDIS_REST_URL=https://your-upstash-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-rest-token

# Payment Gateway (Optional, defaults to mock if unconfigured)
PAYMENT_GATEWAY=mock # or "razorpay"
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Database Migrations

Apply the migration scripts sequentially in the **Supabase Dashboard → SQL Editor** as documented in [migrations/README.md](migrations/README.md):

1. `migrations/001_core_profiles.sql` — Profiles, role constraints, and `auth.users` provisioning trigger
2. `migrations/002_courses.sql` — Course catalog, modules, lessons, and publishing RLS
3. `migrations/003_learning_progress.sql` — Student enrollments, lesson progress, and notes
4. `migrations/004_quizzes.sql` — Multi-question quizzes and student attempt tracking
5. `migrations/005_assignments.sql` — Teacher assignments and student file submissions
6. `migrations/006_certificates.sql` — Dynamic course completion credentials and verification tokens
7. `migrations/007_settings.sql` — 38 user preferences across appearance, privacy, and roles
8. `migrations/008_role_profiles.sql` — Role extension tables (Student, Teacher, Admin)
9. `migrations/009_payments.sql` — Subscriptions, coupons, and payment intents
10. `migrations/010_notifications.sql` — In-app alerts, reviews, discussions, and Realtime publications
11. `migrations/011_admin_audit.sql` — Operational audit logging and site-wide announcements
12. `migrations/013_monetization_production.sql` — 80/20 teacher revenue ledger, payout requests, refunds, and webhooks
13. `migrations/014_system_architecture_hardening.sql` — Idempotency locks, security tracking, and integrity checks

*All migrations are idempotent and non-destructive.*

### 5. Supabase URL & Storage Configuration

1. In **Authentication > URL Configuration**:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`
2. Storage buckets configured by migrations:
   - `course-thumbnails` (Public)
   - `assignment-submissions` (Authenticated)

### 6. Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```text
learning-dashboard/
├── app/                          # Next.js App Router (pages, layouts, routes)
│   ├── admin/                    # Admin dashboard, users, courses, moderation, revenue
│   ├── api/                      # REST API endpoints & webhook handlers
│   │   ├── admin/payouts/        # Admin payout approval & disbursement
│   │   ├── ai/                   # AI Tutor & Quiz Generator endpoints
│   │   ├── payments/             # Intents, confirmation, coupons, refunds, webhooks
│   │   ├── teacher/payouts/      # Teacher withdrawal requests
│   │   └── telemetry/            # Live activity, course views, leaderboard
│   ├── auth/callback/            # OAuth authentication callback route
│   ├── course/[id]/              # Course overview, lesson player, & certificate
│   ├── dashboard/                # Learner personalized dashboard & notes
│   ├── learning/                 # Quizzes & assignment workspaces
│   ├── teacher/                  # Teacher studio (courses, analytics, earnings, students)
│   ├── login/ & register/        # Authentication pages
│   ├── pricing/                  # Subscription plans & course checkout
│   ├── settings/                 # 38 granular user & role settings
│   └── proxy.ts                  # Edge session refresh and route access control
├── components/                   # Modular React components grouped by domain
│   ├── admin/                    # Admin tables, moderation queue, revenue charts
│   ├── ai/                       # AI Tutor drawer and Quiz generator modal
│   ├── assignments/              # Assignment workspaces & grading views
│   ├── auth/                     # Authentication forms & layout
│   ├── community/                # Discussion boards & reply threads
│   ├── course/                   # Video player, checkout modal, reviews, certificates
│   ├── dashboard/                # Student dashboard, activity charts, notes view
│   ├── landing/                  # Bento grid, interactive hero, pricing preview, faq
│   ├── layout/                   # Headers (Admin, Teacher, Student, Public), footers, sidebars
│   ├── motion/                   # Framer motion effects (TiltCard, Spotlight, TextReveal)
│   ├── settings/                 # Tabbed settings client views and role panels
│   ├── teacher/                  # Analytics charts, stats cards, payout triggers
│   ├── telemetry/                # LiveActivityPulse, LiveLeaderboardCard, views badge
│   └── ui/                       # Reusable design system (Button, Card, Modal, Input, Badge, Tabs)
├── docs/                         # In-depth system documentation
│   ├── API.md                    # REST API endpoints and error specifications
│   ├── ARCHITECTURE.md           # High-level architecture and data-flow diagrams
│   ├── DATABASE.md               # Entity relationships (ERD), schema tables, and RLS
│   └── payments-architecture.md  # Razorpay integration, 80/20 split, ledger, and refunds
├── e2e/                          # Playwright end-to-end test suites
├── lib/                          # Core business logic, services, and utilities
│   ├── index.ts                  # Common utilities barrel export
│   ├── ai/                       # AI service integrations & rate-limiting protection
│   ├── auth/                     # Role guards, permissions, and redirects
│   ├── course/                   # Course progress, enrollments, and reviews
│   ├── payments/                 # Gateway selector, Razorpay client, pricing, and refunds
│   ├── profile/                  # User profile queries and mutations
│   ├── settings/                 # Settings actions, queries, and default generators
│   └── supabase/                 # Supabase client, server, and admin factories
├── migrations/                   # 14 idempotent sequential SQL migrations (001–014)
│   └── README.md                 # Migration order, schema documentation, and RLS rules
├── tests/                        # 70 unit and integration tests (node --test)
└── types/                        # TypeScript domain interfaces with types/index.ts barrel
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server on `http://localhost:3000` |
| `npm run dev:host` | Start development server accessible on local network (`0.0.0.0`) |
| `npm run build` | Validate TypeScript types and compile optimized production build |
| `npm start` | Run the compiled production build |
| `npm test` | Run the 70 automated unit and integration tests |
| `npm run lint` | Run ESLint across the codebase |
| `npm run test:e2e` | Run Playwright end-to-end test suite |
| `npm run test:e2e:ui` | Open Playwright test runner in interactive UI mode |

---

## 🔒 Security Architecture

1. **Edge Proxy (`proxy.ts`)**: Session refresh and edge-level route protection redirecting unauthenticated or unauthorized users before rendering.
2. **PostgreSQL Row-Level Security (RLS)**: Enforced directly at the database engine across all tables — users can only access records they own or are permitted to view.
3. **Server-Side API Guards**: Server actions and API routes verify authentication tokens and validate role permissions (`student`, `teacher`, `admin`) via [`lib/auth/guards.ts`](lib/auth/guards.ts).
4. **Financial Ledger & Idempotency**:
   - Razorpay signatures verified with HMAC-SHA256 (`crypto.timingSafeEqual`).
   - Payment order quotes generated server-side; client manipulation of prices is blocked.
   - Redis-backed distributed locks prevent double-spend and parallel checkout requests.
   - Webhook events deduplicated in database before execution.
5. **Credential Isolation**: Secret keys (`RAZORPAY_KEY_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, Supabase service keys) are strictly server-only and never exposed to client bundles.

---

## 📖 Documentation Index

- [Architecture Guide](docs/ARCHITECTURE.md) — System boundaries, data flow, and components
- [REST API Reference](docs/API.md) — Endpoints, payloads, and error codes
- [Database Schema & ERD](docs/DATABASE.md) — Table definitions, constraints, and security policies
- [Monetization & Payments Architecture](docs/payments-architecture.md) — Razorpay lifecycle, commission calculations, and ledger
- [Database Migrations](migrations/README.md) — Sequential execution order and schema changes
- [Contributor Guide](CONTRIBUTING.md) — Branch conventions, commit standards, and coding guidelines

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
