# Architecture Decisions

## Stack (confirmed working as of 2026-09-24)
- Next.js 16.3.6 (App Router, src/ dir, Turbopack), TypeScript strict
- Tailwind CSS
- Drizzle ORM + Neon Postgres (serverless driver, @neondatabase/serverless,
  drizzle-orm/neon-http adapter)
- Auth: custom JWT via `jose`, HTTP-only cookies, `bcryptjs` for password
  hashing (NOT YET BUILT — next task)
- Validation: Zod (installed, not yet used)
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

## Folder conventions
- src/app/(auth)/login/ — created, EMPTY (no page.tsx yet)
- src/app/(app)/dashboard/, attendance/, students/, calendar/ — created, EMPTY
- src/lib/db/index.ts — EXISTS, exports `db` (drizzle client using neon-http)
- src/lib/db/queries/ — created, EMPTY (no query files yet)
- src/lib/auth/ — created, EMPTY (password hashing + JWT session helpers go here — NEXT TASK)
- src/lib/validation/ — created, EMPTY (Zod schemas go here)
- src/middleware.ts — DOES NOT EXIST YET (route protection — NEXT TASK)
- drizzle.config.ts — EXISTS at project root, loads .env.local manually via
  dotenv's config({ path: ".env.local" }) because drizzle-kit does NOT
  auto-load .env.local by default (only .env). See gotchas.md.

## Auth model (planned, not yet implemented)
- JWT stored in HTTP-only, secure, signed cookie. Session payload: { userId, role }.
- Every server action/mutation re-checks role server-side — never trust client state.
- middleware.ts blocks all (app) routes without a valid session cookie.

## Environment variables
- DATABASE_URL (server-only, Neon connection string) — set in .env.local
  MANUALLY (not via `vercel env pull` — see gotchas.md for why)
- JWT_SECRET (server-only) — NOT YET SET, needed for next task
- No client-exposed (NEXT_PUBLIC_*) variables needed currently.
- Vercel project has DATABASE_URL and related Neon vars set for Production
  and Preview via the Neon integration (auto-managed, locked, not manually
  editable in Vercel UI).

## Open decisions / things to revisit
- Batch switching is fully manual (admin creates new batch, marks is_current).
- Take-attendance screen only ever shows the current batch; past batches are
  read-only via student detail/history and calendar.
- Bulk student upload is explicitly OUT of scope for now — manual add-student
  form only.
