# AURA Database Migrations Order & Schema Architecture

All migrations are designed to be **idempotent and non-destructive**, using `CREATE TABLE IF NOT EXISTS`, safe column addition (`ALTER TABLE ADD COLUMN IF NOT EXISTS`), and safe policy refreshes (`DROP POLICY IF EXISTS ... CREATE POLICY ...`).

---

## 🗂️ Sequential Execution Order

Apply these files sequentially in the **Supabase Dashboard → SQL Editor**:

| # | Migration File | Primary Tables | Purpose |
| :--- | :--- | :--- | :--- |
| **001** | `001_core_profiles.sql` | `profiles` | Base user profiles, role constraints, and `auth.users` provisioning trigger |
| **002** | `002_courses.sql` | `courses`, `course_modules`, `lessons` | Course catalog, module hierarchy, and video lessons |
| **003** | `003_learning_progress.sql` | `enrollments`, `lesson_progress` | Student course enrollments and lesson completion check-offs |
| **004** | `004_quizzes.sql` | `quizzes`, `questions`, `attempts` | Multi-question quizzes and student submission attempts |
| **005** | `005_assignments.sql` | `assignments`, `submissions` | Teacher assignments and student file/text submissions |
| **006** | `006_certificates.sql` | `certificates` | Dynamic course completion credentials and verification tokens |
| **007** | `007_settings.sql` | `user_settings` | 38 user preferences across appearance, privacy, notifications, and roles |
| **008** | `008_role_profiles.sql` | `student_profiles`, `teacher_profiles`, `admin_profiles` | Role extension tables for Student, Teacher, and Admin |
| **009** | `009_payments.sql` | `subscriptions`, `payment_intents`, `coupons` | Monetization, access tiers, and checkout intents |
| **010** | `010_notifications.sql` | `notifications`, `course_reviews`, `discussions`, `discussion_replies` | In-app alerts, reviews, and community discussion boards |
| **011** | `011_admin_audit.sql` | `admin_audit_logs`, `announcements` | Operational security logging and site-wide broadcast announcements |

---

## 🔒 Row-Level Security (RLS) Summary

* **`profiles`**: Public read for basic metadata; users can only update their own record; admin can manage all.
* **`user_settings`**: Strictly private — users can only view and update their own `user_id` row.
* **`enrollments` / `lesson_progress`**: Strictly private — students only see and update their own progress.
* **`teacher_profiles`**: Public read; teachers can only edit their own profile; verification is admin-controlled.
* **`admin_profiles` & `admin_audit_logs`**: Strictly restricted to accounts with `role = 'admin'`.
