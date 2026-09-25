# Architecture Decisions

## Stack (confirmed working as of 2026-09-25)
- Next.js 16.3.6 (App Router, src/ dir, Turbopack), TypeScript strict
- Tailwind CSS v4 (dark mode via prefers-color-scheme in globals.css)
- Brand palette: institutional blue (`#1E4F91`) is the primary interaction
  color; MMC red (`#B4233A`) is used as a restrained brand accent, with red
  status/error semantics and existing amber/green/blue status colors retained.
  Light surfaces use a cool blue-gray canvas; dark surfaces remain neutral navy.
- Drizzle ORM + Neon Postgres (serverless driver, @neondatabase/serverless,
  drizzle-orm/neon-http adapter). `db.batch([...])` is used for the few
  multi-statement writes that must be atomic (neon-http has no interactive
  transactions).
- Auth: custom JWT via `jose` (HS256), HTTP-only cookie named `session`,
  8-hour expiry, `bcryptjs` for password hashing — BUILT and LIVE
- Validation: Zod v4 — every route handler validates with `parseBody`/
  `parseQuery`/`parseParams` from `src/lib/api.ts`; note `z.flattenError`
  (Zod v4 API, not `.flatten()`).
- Nepali calendar conversion via `nepali-date-converter`; dates remain ISO in
  PostgreSQL/API payloads and display in Bikram Sambat throughout the UI.
- dotenv (dev dependency, used only in drizzle.config.ts and
  scripts/seed-admin.ts to load .env.local)
- tsx (dev dependency, added session 6, runs scripts/seed-admin.ts)

## Why these choices
- Neon over Supabase: staying inside Vercel's ecosystem, free tier scale-to-zero
  is a cold-start delay (~1-2s), not data loss or downtime risk.
- Drizzle over Prisma: lighter runtime, no engine binary, plays well with
  Neon's serverless/edge driver.
- `jose` over `jsonwebtoken`: edge/proxy-compatible, needed since route
  protection runs in Next.js's proxy (formerly "middleware").

## Database schema — LIVE, migrated, source of truth is drizzle/schema.ts
Migrations 0000–0004 are applied to the Neon database configured in the local
`.env.local` as of 2026-09-25. This does not verify that Vercel Production uses
the same database; migrate each distinct environment before deploying.

- users (id serial pk, username varchar(64) unique, password_hash text,
  role enum[superadmin|admin|staff] default staff, name varchar(128), created_at)
  -- Bootstrap the first operator with `npm run seed:admin`; append
  -- `--role=superadmin` to create the first super-admin. The script is not a
  -- fixed demo-account seed.
- batches (id serial pk, name varchar(128), start_date date, end_date date,
  is_current boolean default false, created_at)
  -- unique partial index batches_one_current_idx enforces at most one
  -- is_current=true row at the DB level (not just app logic).
  -- NOT YET SEEDED. No batches exist yet.
- students (id serial pk, batch_id fk->batches, roll_number varchar(16),
  name varchar(128), posting_period varchar(128), remarks text,
  created_at, updated_at) — UNIQUE(batch_id, roll_number)
- attendance_records (id serial pk, student_id fk->students, date date,
  status enum[absent|late|leave|present], department enum nullable,
  remarks text, marked_by nullable fk->users ON DELETE SET NULL,
  created_at, updated_at) — UNIQUE(student_id, date), plus
  attendance_records_date_idx on (date) for calendar/report range queries.
  -- Ordinary 'present' is implicit: no row = present. Explicit 'present'
  -- rows are only for logging attendance at another department; department
  -- is one of cardiology/dermatology/psychiatry/other.
- leaves (id serial pk, student_id fk->students, start_date date,
  end_date date, reason text, created_by nullable fk->users ON DELETE SET NULL, created_at), plus
  leaves_student_idx on (student_id).

Verified with `npx drizzle-kit generate` (clean diff, no drift) as of
2026-09-25.

## Attendance/leave precedence rule (important — session 6 decision)
When a date has BOTH an attendance_records row and an overlapping leaves
range for the same student, the attendance_records row wins as the
"effective status" for that date. This is implemented once, in
`src/lib/attendance/summary.ts` (`summarize()`), and every consumer
(dashboard, calendar, reports, CSV export, attendance-entry day list) goes
through that function or `src/lib/attendance/service.ts` — never recomputed
ad hoc. See that file's header comment for the full definitions (absenceCount,
lateCount, leaveDays, absentDays, daily present/absent/late/leave counts).

## Current folder structure (as of session 6 — full product surface built)
- `src/app/(app)/` — route group for every authenticated page. Its
  `layout.tsx` calls `requirePageSession()` and wraps children in
  `<NavShell>` (nav links vary by role: admin sees Students/Batches/Staff
  Accounts in addition to the staff links). Route group segment names don't
  affect the URL, so `/`, `/attendance`, `/students` etc. are unchanged.
  - `page.tsx` — dashboard (today's counts, batch totals, top absentees).
    Admin lands here too (per product decision: admin can also take
    attendance, so admin's landing is the same dashboard → link to
    Take Attendance, not a separate /admin dashboard).
  - `attendance/` — the core roll-number-in, status-out workflow
    (`attendance-board.tsx`, client component) + date picker.
  - `students/`, `batches/`, `admin/users/` — admin/superadmin-only (each page calls
    `requireAdminPage()`, and every mutating API route re-checks
    `authorize(["admin"])` server-side; the proxy's `/api/admin/*` guard
    covers `admin/users` only, not `/api/students` etc., so those routes'
    own `authorize()` calls are the real boundary).
  - `leaves/`, `calendar/`, `reports/` — available to both roles.
- `src/lib/attendance/` — `summary.ts` (pure math, no I/O, unit-testable),
  `service.ts` (shared business logic: dashboard, calendar month, day list,
  mark/clear attendance, lookup-by-roll — all routes and pages call this,
  never the DB queries directly), `csv.ts` (report export, formula-injection
  safe).
- `src/lib/roster/service.ts` — shared business logic for batches/students/
  leaves mutations (uniqueness checks, current-batch switching, cascading
  delete of a student's attendance+leaves).
- `src/lib/db/queries/` — one file per table (`users.ts`, `batches.ts`,
  `students.ts`, `attendance.ts`, `leaves.ts`). Route handlers and
  `service.ts` files call these (includes `updateUser`, `deleteUser`, `deleteBatch`).
- `src/lib/validation/` — one Zod schema file per resource
  (`auth.ts`, `users.ts`, `batches.ts`, `students.ts`, `attendance.ts`,
  `leaves.ts`, `reports.ts`, `common.ts` for shared primitives like
  `isoDateSchema`/`idStringSchema`).
- `src/lib/api.ts` — `authorize(roles)`, `parseBody/parseQuery/parseParams`,
  `jsonError`, `respond` (maps a `Result<T>` to a `NextResponse`),
  `handleError` (maps Postgres error codes 23505/23503 to 409s, everything
  else to a generic 500 — never leaks SQL).
- `src/lib/result.ts` — `Result<T> = {ok:true,data} | {ok:false,status,error}`
  used by every function in `service.ts`/`roster/service.ts`.
- `src/lib/date.ts` — ALL date math lives here: ISO dates are stored and sent
  through APIs; `todayISO()` computes today in Asia/Kathmandu; user-facing
  dates use numeric Bikram Sambat (`DD/MM/YYYY`), and calendar month labels
  use `MM/YYYY`. The date selector accepts BS day/month/year and converts to
  ISO internally.
- `src/components/` — `nav-shell.tsx` (client, role-aware nav + logout),
  `card.tsx` (`Card`, `StatTile`), `status-badge.tsx`, `format.ts`.
- `src/app/api/auth/{login,logout,me}/route.ts` — BUILT, live API routes.
- `src/lib/auth/jwt.ts` — session payload is now
  `{ userId, username, name, role }` (added `name` in session 6 so the nav
  can show a real name without an extra DB round-trip per page).
- `src/lib/auth/session.ts` — createSession/getSession/destroySession/requireRole.
- `src/lib/auth/page-guards.ts` — `requirePageSession()` (redirects to
  /login) and `requireAdminPage()` (redirects to / if not admin) for Server
  Component pages — the page-level counterpart to `authorize()` in API routes.
- `src/lib/auth/password.ts` — bcryptjs hash/verify + `DUMMY_PASSWORD_HASH`
  (a real bcrypt hash of a random string, compared against on unknown
  usernames so login timing doesn't leak whether the username exists).
- `src/lib/db/index.ts` — exports `db` (drizzle client using neon-http).
- `src/proxy.ts` — Next.js 16 renamed `middleware.ts` → `proxy.ts` (same
  behavior, function renamed `middleware` → `proxy`); renamed in session 6.
  Public: /login, /api/auth/login (+/_next*, /favicon*). Admin-only:
  /admin, /api/admin (note: this prefix currently only matches
  /api/admin/users — student/batch/leave mutation routes are NOT under
  /api/admin and rely entirely on their own `authorize(["admin"])` call).
- drizzle.config.ts — at project root, loads .env.local manually via
  dotenv's config({ path: ".env.local" }) because drizzle-kit does NOT
  auto-load .env.local by default (only .env). See gotchas.md.
- .env.example — referenced by architecture docs but NOT actually present
  in the repo as of session 6 (see gotchas.md — a prior session's notes
  said it existed but it was never committed). Recreate it if needed:
  `DATABASE_URL=...` and `JWT_SECRET=...` placeholders.
- scripts/seed-admin.ts — BUILT (session 6). Interactive or flag-based
  (`npm run seed:admin -- --username=... --name=...`; password is prompted).
  Optional `--role=superadmin` bootstraps the initial superadmin; rerunning
  for an existing username preserves its role unless `--role` is explicit
  (idempotent bootstrap, not a general user-creation tool —
  use the Staff Accounts admin page for that once one admin exists).

## Auth model — IMPLEMENTED (sessions 3, 5, 6)
- JWT (HS256, jose) stored in HTTP-only, secure-in-production, sameSite=lax
  cookie named "session", 8-hour expiry.
- Session payload: { userId, username, name, role }.
- Login: POST /api/auth/login { username, password } — Zod-validated,
  bcryptjs verify against a real hash OR `DUMMY_PASSWORD_HASH` when the
  username doesn't exist (constant-time-ish: always one bcrypt compare),
  generic "Invalid username or password" for ALL failures (no user
  enumeration). Sets cookie, returns { user }.
- Logout: POST /api/auth/logout — destroys session cookie.
- Me: GET /api/auth/me — returns current session user or 401.
- Every server action/mutation re-checks role server-side via
  `authorize()` (API routes) or `requirePageSession()`/`requireAdminPage()`
  (pages) — never trust client state. The proxy is only the first layer.
- Login page: client component posts to /api/auth/login, honors the
  proxy's ?next= param (open-redirect-guarded), then router.replace +
  router.refresh.

## Product surface — BUILT session 6 (was the whole "queue" from session 5)
All of the following exist as real pages + API routes, not stubs:
- **Dashboard** (`/`) — today's present/absent/late/leave counts, batch
  totals to date, top-5 absentees. Both roles land here after login.
- **Take Attendance** (`/attendance`) — roll number in, Absent/Late/Leave
  actions, plus a separate Present elsewhere department group; date picker
  defaults today and disallows future dates; clearing a record marks present;
  shows approved leave coverage even if never explicitly marked.
- **Students** (`/students`, admin-only) — add/edit/delete for the current
  batch, search by name/roll. Delete cascades to that student's attendance
  records and leaves (`deleteStudentWithRecords`).
- **Batches** (`/batches`, admin-only) — create batch (optionally as
  current), "Make current" switch (atomic via `db.batch`, DB-enforced via
  the partial unique index so this can never race into two current batches).
- **Leaves** (`/leaves`) — add/delete leave ranges by roll number (resolved
  against the current batch), list with student name joined in.
- **Calendar** (`/calendar`) — month grid, colored dots for
  absent/late/leave counts per day, click a day → jumps to
  `/attendance?date=...` for that day.
- **Reports** (`/reports`) — per-batch, per-date-range summary table (per
  student: absence/late/leave counts, total absent days) + CSV export
  (`/api/reports/export`, formula-injection-safe cells).
- **Staff Accounts** (`/admin/users`, admin/superadmin-only) — create staff/admin
  accounts and reset passwords. A superadmin may create additional superadmins,
  but all superadmin accounts are view-only and cannot be edited, reset, or
  deleted by any account. Superadmins can change their own password in Settings.

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

## Discrepancies / open questions (updated session 6)
- Cleanup of exact demo usernames `staff1`, `staff2`, `staff3`, and `admin`, plus
  creation of `mahesh` (Dr.Mahesh Raj Sigdel) are complete in the Neon DB
  configured by `.env.local`; removed actors retain history and display as
  “Former account”. Vercel Production DB access is unavailable, so verify
  whether it shares this database; if separate, migrate and repeat the exact
  cleanup there.
- RESOLVED: `.clauderules` folder tree, MEMORY.md reference, and
  middleware.ts naming were all stale from before the session-4 reorg /
  Next 16's middleware→proxy rename. Fixed in session 6.
- .env.example is referenced in multiple docs/rules as existing but is not
  actually in the repo (git status confirms). Treat "does .env.example
  exist" as false until someone actually commits it.
- Batch switching is fully manual (admin creates new batch, marks current).
- Take-attendance screen only ever shows the current batch; past batches are
  read-only via Reports (pick an old batch from the dropdown) and Calendar
  only shows the current batch's month grid (no batch switcher on Calendar
  yet — flagged as a possible follow-up, not requested).
- Bulk student upload and mark-all-present remain explicitly OUT of scope
  (unchanged from session 5 — see context.md).
- `/api/admin` prefix in the proxy only actually protects `/api/admin/users`;
  every other admin-only mutation (students, batches PATCH, etc.) relies
  solely on its own route's `authorize(["admin"])` call, which is correct
  per `.clauderules` ("never rely exclusively on the proxy") but worth
  knowing so nobody assumes the URL prefix is doing more than it is.

## Next steps (none blocking — the "build everything" queue from session 5
## is now done; these are natural follow-ups if requested)
1. Local smoke test: set DATABASE_URL + JWT_SECRET in .env.local, run
   migrations (`npx drizzle-kit migrate` or apply via your usual Neon
   workflow), `npm run seed:admin`, `npm run dev`, log in, take attendance
   for a day, check the dashboard/calendar/reports reflect it.
2. Recreate `.env.example` if you want it back in the repo (see above).
3. Consider a batch switcher on the Calendar page (currently current-batch
   only) if past-batch calendars become a real need.
4. Consider bulk CSV student import if the "no bulk upload" non-goal is
   revisited later — deliberately not built.
