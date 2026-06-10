# Application API

## Overview

AURA does not expose a general-purpose REST API. It uses:

- one Next.js route handler for the OAuth callback
- reusable Next.js server actions
- Supabase Data API calls from server and client components
- Postgres RPC functions for privileged or relationship-aware operations

All database access is governed by Supabase Auth and RLS.

## Route Handler

### `GET /auth/callback`

File: `app/auth/callback/route.ts`

Exchanges the Supabase OAuth or email-confirmation code for a session, then
redirects to the validated `next` path or the dashboard. Redirect paths are
sanitized by `lib/auth/redirects.ts`.

## Server Actions

### Enrollment

File: `lib/course/enrollment.ts`

| Function | Input | Result |
| --- | --- | --- |
| `enrollUser` | course UUID or `FormData` containing `courseId` | Upserts enrollment, revalidates course views, redirects to `/learning` |
| `unenrollUser` | course UUID or `FormData` containing `courseId` | Deletes the current user's enrollment and revalidates views |
| `isUserEnrolled` | course UUID | Returns a boolean |
| `getUserEnrollments` | none | Returns current-user enrollments with course data |

Unauthenticated enrollment mutations redirect to login with a safe return URL.

### Lesson Progress

File: `lib/course/progress.ts`

| Function | Input | Result |
| --- | --- | --- |
| `markLessonComplete` | lesson UUID, course UUID | Upserts completion and recalculates enrollment progress |
| `getLessonProgressForCourse` | course UUID | Returns completed lesson rows for that course |
| `getAllLessonProgress` | none | Returns all completed lesson rows for the current user |

`markLessonComplete` returns `{ success: true, progressPct }` or
`{ error: string }`.

### Course Reviews

File: `lib/course/reviews.ts`

| Function | Input | Result |
| --- | --- | --- |
| `saveCourseReview` | course UUID, rating 1-5, review text | Creates or updates the current user's review |
| `deleteCourseReview` | course UUID | Deletes the current user's review |

Review text must contain between 3 and 2000 characters. RLS additionally
requires the reviewer to be enrolled in the course when creating a review.

## Postgres RPC

### `delete_user_by_admin(target_user_id uuid)`

Deletes a Supabase Auth user and relies on cascading foreign keys to clean up
the profile and owned records. Execution is restricted by the function's admin
check.

### `get_communication_contacts()`

Returns contacts available to the current user:

- students can contact teachers for enrolled courses and admins
- teachers can contact students enrolled in their courses and admins
- admins can contact other profiles

Return columns: `id`, `full_name`, and `role`.

### `write_audit_log(...)`

Accepts an action, entity type, entity ID, and JSON details. Most tracked table
changes are logged automatically by `audit_row_change()` triggers.

## Direct Supabase Operations

Feature workspaces call the Supabase client directly:

| Feature | Main tables or storage |
| --- | --- |
| Authentication and profiles | `auth.users`, `profiles` |
| Courses and lessons | `courses`, `lessons`, `course-thumbnails` |
| Notes and progress | `notes`, `enrollments`, `lesson_progress` |
| Assignments | `assignments`, `submissions`, `assignment-submissions` |
| Quizzes | `quizzes`, `questions`, `attempts` |
| Community | `direct_messages`, `course_discussions`, `discussion_replies` |
| Administration | `platform_announcements`, `moderation_flags`, `audit_logs` |
| User feedback | `course_reviews`, `notifications`, `certificates` |

Client requests must never be trusted on their own. New operations must include
an appropriate RLS policy and ownership checks in SQL.

## Realtime Channels

`NotificationBell` subscribes to inserts on `notifications` filtered by the
current `user_id`. `RealtimeRefresh` subscribes to configured table changes and
refreshes server-rendered data.

The publication setup is maintained in `professional-features.sql` and
`remaining-features.sql`.

## Error Conventions

- Server actions used by inline forms return `{ error: string }` for expected
  failures.
- Navigation actions may throw redirects after successful completion.
- Supabase client workspaces display mutation errors in local UI state.
- Unexpected server-page failures should be logged without exposing secrets.
