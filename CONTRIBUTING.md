# Contributing

## Development Setup

1. Install Node.js 20.9 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure a Supabase project and run the SQL sequence in `README.md`.
5. Run `npm run dev`.

Do not commit `.env.local`, Supabase service-role keys, test passwords, or user
data.

## Branches and Commits

Create a focused branch from the current default branch:

```bash
git switch -c feat/short-description
```

Use concise conventional commit messages:

```text
feat: add course discussion search
fix: restrict draft courses to owners
docs: document database policies
test: cover assignment submission flow
```

Keep unrelated refactors out of feature commits.

## Code Guidelines

- Follow existing App Router and feature-folder patterns.
- Use server components for protected initial data loading.
- Add `"use client"` only when browser state, effects, or events are needed.
- Reuse `lib/supabase/server.ts` and `lib/supabase/client.ts`.
- Keep shared domain shapes in `types/`.
- Validate user input in the application and database.
- Treat RLS as mandatory for every new table and operation.
- Keep comments focused on non-obvious decisions.
- Use ASCII unless a user-facing feature requires other characters.

## Database Changes

SQL changes must be idempotent. Prefer:

- `create table if not exists`
- `alter table ... add column if not exists`
- `drop policy if exists` before `create policy`
- `create or replace function`
- guarded Realtime publication changes

Include constraints, indexes, foreign-key behavior, RLS policies, and matching
TypeScript updates in the same contribution. Never add destructive seed logic
to a migration.

## Testing

Before opening a pull request, run:

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright account variables are listed in `.env.example`. Credential-dependent
tests may skip locally, but changes to those workflows should be verified with
appropriate test accounts.

Add tests according to risk:

- Pure calculations: unit tests in `tests/`
- Authentication and full workflows: Playwright tests in `e2e/`
- RLS changes: manually verify allowed and denied cases for every affected role

## Pull Requests

A pull request should include:

- a short problem and solution summary
- screenshots for visible UI changes
- schema deployment instructions for SQL changes
- commands run and their results
- known limitations or intentionally deferred work

Reviewers should prioritize authorization, data ownership, destructive schema
changes, regressions, error handling, and test coverage.
