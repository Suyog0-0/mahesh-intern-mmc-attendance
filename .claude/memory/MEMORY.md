# Session Log

## 2026-09-24 — Session 1: Project scaffold
**Done:**
- Ran through full requirements discovery with Mahesh (roles, batch model,
  attendance statuses, leave handling, hosting, design direction).
- Decided stack: Next.js 16 + TypeScript + Tailwind + Drizzle + Neon + custom JWT auth.
- Scaffolded Next.js app (`create-next-app`), installed drizzle-orm,
  @neondatabase/serverless, jose, bcryptjs, zod, drizzle-kit.
- Created folder structure (src/app/(auth), src/app/(app)/*, src/lib/*, drizzle/).
- Wrote context.md and architecture.md.
- Confirmed `npm run dev` runs successfully.

**Next:**
- Write Drizzle schema (drizzle/schema.ts) for users, batches, students,
  attendance_records, leaves.
- Set up Neon database, get connection string.
- Build auth helpers (password hashing, JWT session create/verify).
- Build login page + middleware route protection.

## 2026-09-24 — Session 2: Database setup
**Done:**
- Fixed drizzle.config.ts to load .env.local via dotenv (drizzle-kit doesn't
  auto-load .env.local by default).
- Created Neon Postgres database via Vercel Storage, connected to the project.
- Worked around Vercel's managed env var sync only including Production/Preview
  (not Development) — added DATABASE_URL manually to local .env.local instead.
- Generated and ran the initial migration (0000_ambiguous_slyde.sql) — all 5
  tables created (users, batches, students, attendance_records, leaves).

**Next:**
- Build auth helpers (password hashing, JWT session create/verify).
- Build login page + middleware route protection.
- Seed an initial admin user.

## 2026-09-24 — Session 2 (continued): Verified & documented
**Done:**
- Verified all 5 tables exist correctly in Drizzle Studio.
- Wrote gotchas.md documenting the two environment issues hit today
  (drizzle-kit .env.local loading, Vercel Neon integration env scoping).
- Fully rewrote architecture.md to reflect exact current state: what's
  built vs. stubbed/empty, schema is live and migrated, auth not yet built.

**Current state summary for next session:**
- Repo scaffolded, pushed to GitHub (Suyog0-0/mahesh-intern-mmc-attendance,
  private), linked to Vercel project mahesh-intern-mmc-attendance.
- Database: Neon Postgres, live, migrated, empty (no seed data — no users,
  no batches, no students yet).
- src/lib/db/index.ts exports working `db` client.
- Folder structure exists but almost everything under src/app/(auth),
  src/app/(app)/*, src/lib/auth/, src/lib/validation/ is EMPTY — no actual
  page/component/logic code written yet beyond the Next.js default starter
  page at src/app/page.tsx (still default boilerplate, not customized).

**Next (in order):**
1. Build src/lib/auth/ — password hashing helpers (bcryptjs wrapper),
   JWT session create/verify (jose), reading/writing the HTTP-only cookie.
2. Add JWT_SECRET to .env.local manually (generate a random secret).
3. Build src/middleware.ts — protect all (app) routes, redirect
   unauthenticated users to /login.
4. Build src/app/(auth)/login/page.tsx — login form + server action.
5. Seed one admin user manually (script or one-off server action) so login
   can be tested end-to-end.
6. Only after login works end-to-end: move to dashboard, student CRUD,
   attendance-taking screen.
