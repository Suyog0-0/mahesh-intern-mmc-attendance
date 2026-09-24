# Architecture Decisions

## Stack
- Next.js 16 (App Router, src/ dir), TypeScript strict
- Tailwind CSS
- Drizzle ORM + Neon Postgres (serverless driver, @neondatabase/serverless)
- Auth: custom JWT via `jose`, HTTP-only cookies, `bcryptjs` for password hashing
  (no third-party auth provider — handled entirely in-app)
- Validation: Zod
- No calendar library — custom-built, per brief's "avoid bloat" direction

## Why these choices
- Neon over Supabase: staying inside Vercel's ecosystem, free tier scale-to-zero
  is a cold-start delay (~1-2s), not data loss or downtime risk.
- Drizzle over Prisma: lighter runtime, no engine binary, plays well with
  Neon's serverless/edge driver.
- `jose` over `jsonwebtoken`: edge/middleware-compatible, needed since route
  protection runs in Next.js middleware.

## Database schema (see drizzle/schema.ts for source of truth)
- users (id, username, password_hash, role: admin|staff, name, created_at)
- batches (id, name, start_date, end_date, is_current, created_at)
- students (id, batch_id FK, roll_number, name, posting_period, remarks,
  created_at, updated_at) — UNIQUE(batch_id, roll_number)
- attendance_records (id, student_id FK, date, status: absent|late|leave,
  remarks, marked_by FK->users, created_at, updated_at) —
  UNIQUE(student_id, date)
- leaves (id, student_id FK, start_date, end_date, reason, created_by FK->users,
  created_at)

## Folder conventions
- src/app/(auth)/ — login, unauthenticated routes
- src/app/(app)/ — everything behind auth (dashboard, attendance, students, calendar)
- src/lib/db/ — schema.ts + queries/ (one file per entity, server-only)
- src/lib/auth/ — session creation/verification, password hashing helpers
- src/lib/validation/ — Zod schemas, shared between client forms and server actions
- src/middleware.ts — route protection, redirects unauthenticated users to /login

## Auth model
- JWT stored in HTTP-only, secure, signed cookie. Session payload: { userId, role }.
- Every server action/mutation re-checks role server-side — never trust client state.
- middleware.ts blocks all (app) routes without a valid session cookie.

## Environment variables
- DATABASE_URL (server-only, Neon connection string)
- JWT_SECRET (server-only)
- No client-exposed (NEXT_PUBLIC_*) variables needed currently.

## Open decisions / things to revisit
- Batch switching is fully manual (admin creates new batch, marks is_current).
- Take-attendance screen only ever shows the current batch; past batches are
  read-only via student detail/history and calendar.
