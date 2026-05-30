# Next-Gen Student Learning Dashboard

A futuristic, highly animated Student Dashboard built with **Next.js (App Router)**, **Supabase**, **Tailwind CSS**, and **Framer Motion**. Designed for zero layout shifts, dynamic database integration, and micro-interactions.

---

## 🚀 Architectural Choices & Split

This project follows modern Next.js App Router patterns, strictly decoupling server-side data fetching from interactive client components:

### 1. Server Components (RSC) & Data Fetching
* **[app/page.tsx](file:///d:/Fullstack-Project/learning-dashboard/app/page.tsx)**: Runs exclusively on the server. It instantiates the secure database connection using `@supabase/ssr` cookies and fetches course data. This keeps API keys hidden and reduces client bundle sizes.
* **[app/loading.tsx](file:///d:/Fullstack-Project/learning-dashboard/app/loading.tsx)**: Implements a server-rendered bento skeleton layout that mirrors the dashboard perfectly. It streams down immediately while Supabase fetches finish, preventing sudden layout shifts on load.
* **[lib/supabase/server.ts](file:///d:/Fullstack-Project/learning-dashboard/lib/supabase/server.ts)**: Configures both the standard `@supabase/supabase-js` client and the modern cookie-based `@supabase/ssr` client, handling path sanitization automatically (stripping trailing `/rest/v1/` suffixes).

### 2. Client Components & Animation
* **[components/dashboard/Dashboard.tsx](file:///d:/Fullstack-Project/learning-dashboard/components/dashboard/Dashboard.tsx)**: Coordinates high-fidelity client states like active navigation tabs, tab views, and search filters.
* **[components/layout/Sidebar.tsx](file:///d:/Fullstack-Project/learning-dashboard/components/layout/Sidebar.tsx)**: A responsive navigation element that handles desktop (collapsible), tablet (icon-only), and mobile (bottom navigation bar) breakpoints. Highlights active items dynamically using Framer Motion's `layoutId` pill.
* **[components/layout/BentoGrid.tsx](file:///d:/Fullstack-Project/learning-dashboard/components/layout/BentoGrid.tsx)**: Handles the Bento Grid layouts and staggers the entry animations of child elements on load.
* **[components/dashboard/CourseCard.tsx](file:///d:/Fullstack-Project/learning-dashboard/components/dashboard/CourseCard.tsx)**: Renders individual courses, maps Lucide icons, animates custom progress indicators, and handles card elevations.
* **[components/dashboard/ActivityChart.tsx](file:///d:/Fullstack-Project/learning-dashboard/components/dashboard/ActivityChart.tsx)**: Renders study velocity lines using `recharts`, using mounting guards to prevent SSR hydration mismatches.

---

## ⚡ Animation Design & Zero Layout Shifts

To optimize rendering speeds and prevent browser repaints:
* **Staggered Page Load**: Bento cards fade and translate upwards (`opacity` and `transform`) via Framer Motion spring physics.
* **Elevated Hover States**: Hovering cards scale up by 1.5% and shift up (`scale: 1.015, y: -2`) using hardware-accelerated CSS transforms.
* **Glow Reveal on Hover**: To avoid reflowing text or cells, we do not modify borders. Instead, we use absolute overlays with opacity transitions (`opacity-0` to `opacity-100`) to reveal gradient borders and backdrops on hover.
* **Animated Progress Bars**: We animate the `scaleX` property of the progress bar instead of its `width` to keep layout calculations out of the main thread.

---

## 🗃️ Database Setup & Row-Level Security (RLS)

If you are setting up this project from scratch, follow these instructions to seed your Supabase database:

1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase project dashboard.
3. Paste and run the code provided in **[seed.sql](file:///d:/Fullstack-Project/learning-dashboard/seed.sql)**:
   * It creates the `courses` table.
   * It enables **Row-Level Security (RLS)**.
   * It sets up a policy allowing public read access (`SELECT`) using the anon key.
   * It inserts 4 sample course rows.
4. Copy the project **URL** and **Anon Key** and add them to a `.env.local` file (modeled after **[.env.example](file:///d:/Fullstack-Project/learning-dashboard/.env.example)**).

### Supabase Auth Redirects
For Google login and email confirmation, configure Supabase with the public URL that users actually open in their browser.

In **Supabase -> Authentication -> URL Configuration**:
* **Site URL** should be your deployed app URL, for example `https://learning-dashboard.vercel.app`.
* **Redirect URLs** should include the deployed app and callback URLs:

```text
https://learning-dashboard.vercel.app
https://learning-dashboard.vercel.app/auth/callback
```

For local phone testing, do not use `localhost` on the phone. Run the app on your network:

```bash
npm run dev:host
```

Then open your computer's LAN address on the phone, for example:

```text
http://192.168.1.15:3000
```

Add the matching local URLs to Supabase while testing:

```text
http://192.168.1.15:3000
http://192.168.1.15:3000/auth/callback
```

The login code uses `window.location.origin`, so it will redirect back to the exact host the browser is using.

### Graceful Fallback
If the database connection fails, is throttled, or has no rows seeded, the application's client logic seamlessly merges and falls back to pre-rendered course data. This keeps the prototype fully interactive while displaying a status notification.

---

## 🛠️ Installation & Testing

To test the application locally:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Run a production typecheck and build validation
npm run build
```
