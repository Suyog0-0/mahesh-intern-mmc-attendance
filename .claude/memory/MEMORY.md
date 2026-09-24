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
