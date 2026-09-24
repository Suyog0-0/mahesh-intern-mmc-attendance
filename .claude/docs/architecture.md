# Architecture Decisions

## Stack (confirmed working as of 2026-09-24)
- Next.js 16.3.6 (App Router, src/ dir, Turbopack), TypeScript strict
- Tailwind CSS v4 (dark mode via prefers-color-scheme in globals.css)
- Drizzle ORM + Neon Postgres (serverless driver, @neondatabase/serverless,
  drizzle-orm/neon-http adapter)
- Auth: custom JWT via `jose` (HS256), HTTP-only cookie named `session`,
  8-hour expiry, `bcryptjs` for password hashing — BUILT and LIVE
- Validation: Zod — used in the login route handler
- No calendar library — custom-built, per brief's "avoid bloat" direction
- dotenv (dev dependency, used only in drizzle.config.ts to load .env.local)

## Why these choices
- Neon over Supabase: staying inside Vercel's ecosystem, free tier scale-to-zero
  is a cold-start delay (~1-2s), not data loss or downtime risk.
- Drizzle over Prisma: lighter runtime, no engine binary, plays well with
  Neon's serverless/edge driver.
- `jose` over `jsonwebtoken`: edge/middleware-compatible, needed since route
  protection runs in Next.js middleware.

## Database schema — LIVE, migrated, source of truth is drizzle/schema.ts
Migration applied: drizzle/migrations/0000_ambiguous_slyde.sql (2026-09-24)

- users (id serial pk, username varchar(64) unique, password_hash text,
  role enum[admin|staff] default staff, name varchar(128), created_at)
  -- NOT YET SEEDED. No users exist in the DB yet.
- batches (id serial pk, name varchar(128), start_date date, end_date date,
  is_current boolean default false, created_at)
  -- NOT YET SEEDED. No batches exist yet.
- students (id serial pk, batch_id fk->batches, roll_number varchar(16),
  name varchar(128), posting_period varchar(128), remarks text,
  created_at, updated_at) — UNIQUE(batch_id, roll_number)
- attendance_records (id serial pk, student_id fk->students, date date,
  status enum[absent|late|leave], remarks text, marked_by fk->users,
  created_at, updated_at) — UNIQUE(student_id, date)
  -- 'present' is implicit: absence of a record for a student+date = present.
- leaves (id serial pk, student_id fk->students, start_date date,
  end_date date, reason text, created_by fk->users, created_at)
  -- one row covers a date range; calendar + attendance-entry screen both
  -- need to query this to detect "student X is on leave through date Y"

Verified in Drizzle Studio (npx drizzle-kit studio) — all 5 tables exist with
correct columns as of 2026-09-24.

## Current folder structure (matches git as of commit 9239f8d + login page)
- src/app/login/ — LOGIN PAGE BUILT (page.tsx + login-form.tsx client component).
  Serves the /login route middleware redirects to. Placed directly under
  src/app/login/ per the folder tree in .clauderules (NOT the (auth) route
  group — see "Discrepancies" below).
- src/app/api/auth/{login,logout,me}/route.ts — BUILT, live API routes.
  (Originally misplaced under src/lib/auth/, moved in session 3.)
- src/lib/auth/jwt.ts — signSessionToken/verifySessionToken (jose, HS256,
  SESSION_COOKIE_NAME="session", 8h max age).
- src/lib/auth/session.ts — createSession/getSession/destroySession/requireRole
  (cookie read/write via next/headers).
- src/lib/auth/password.ts — bcryptjs hash/verify helpers.
- src/lib/db/index.ts — exports `db` (drizzle client using neon-http).
- src/middleware.ts — LIVE (renamed from middlware.ts in session 3). Public:
  /login, /api/auth/login (+/_next*, /favicon*). Admin-only: /admin,
  /api/admin. Unauthenticated pages redirect to /login?next=<path>;
  unauthenticated API calls get 401 JSON.
- drizzle.config.ts — at project root, loads .env.local manually via
  dotenv's config({ path: ".env.local" }) because drizzle-kit does NOT
  auto-load .env.local by default (only .env). See gotchas.md.
- .env.example — EXISTS (added session 5): DATABASE_URL + JWT_SECRET placeholders.
- scripts/seed-admin.ts — listed in .clauderules folder tree, NOT YET CREATED.
- src/app/page.tsx — still the default create-next-app placeholder.
- src/app/(auth)/ and src/app/(app)/ route-group folders from the original
  scaffold existed only as EMPTY LOCAL DIRECTORIES — they never reached git
  (git does not track empty dirs). Effectively they do not exist in the repo.

## Auth model — IMPLEMENTED (as of 2026-09-24, sessions 3 + 5)
- JWT (HS256, jose) stored in HTTP-only, secure-in-production, sameSite=lax
  cookie named "session", 8-hour expiry.
- Session payload: { userId, username, role }.
- Login: POST /api/auth/login { username, password } — Zod-validated,
  bcryptjs verify, generic "Invalid username or password" for ALL failures
  (no user enumeration). Sets cookie, returns { user }.
- Logout: POST /api/auth/logout — destroys session cookie.
- Me: GET /api/auth/me — returns current session user or 401.
- Every server action/mutation re-checks role server-side via
  getSession()/requireRole() from src/lib/auth/session.ts — never trust
  client state. Middleware is only the first layer.
- Login page: client component posts to /api/auth/login, honors the
  middleware's ?next= param (open-redirect-guarded), then router.replace +
  router.refresh.

## Environment variables
- DATABASE_URL (server-only, Neon connection string) — set in .env.local
  MANUALLY (not via `vercel env pull` — see gotchas.md for why)
- JWT_SECRET (server-only) — REQUIRED at runtime (jwt.ts throws if unset).
  Must be added to .env.local manually AND to Vercel env vars before the
  deployed app can log anyone in. Generate: openssl rand -base64 32
- No client-exposed (NEXT_PUBLIC_*) variables needed currently.
- Vercel project has DATABASE_URL and related Neon vars set for Production
  and Preview via the Neon integration (auto-managed, locked, not manually
  editable in Vercel UI).

## Discrepancies / open questions (flagged session 5)
- .clauderules folder tree says src/app/login/page.tsx; an earlier scaffold
  note said src/app/(auth)/login/. RESOLVED for now: using src/app/login/
  because .clauderules is the standing authority. Route is /login either way.
- .clauderules still references .claude/memory/MEMORY.md and a
  memory-YYYY-MM-DD-HHMMSS.md naming format — both were replaced in the
  session-4 reorg (timestamped memory-YYYYMMDD-HHMMSS.md snapshots, no
  MEMORY.md). .clauderules needs its own update pass (not done yet).
- Batch switching is fully manual (admin creates new batch, marks is_current).
- Take-attendance screen only ever shows the current batch; past batches are
  read-only via student detail/history and calendar.
- Bulk student upload is explicitly OUT of scope for now — manual add-student
  form only.

## Next steps (in order, as of session 5)
1. Add JWT_SECRET to .env.local (openssl rand -base64 32).
2. scripts/seed-admin.ts — seed one admin user (hashPassword from
   src/lib/auth/password.ts) so login can be tested end-to-end.
3. Smoke-test: npm run dev -> /login redirects, login sets cookie, /api/auth/me
   returns user, logout clears cookie.
4. Replace src/app/page.tsx placeholder with a real dashboard redirect
   (admin -> /admin or attendance view; decide landing page).
5. Product surface: attendance-taking screen (the core workflow), students,
   batches, leaves, calendar, reports — per .claude/docs/context.md.
