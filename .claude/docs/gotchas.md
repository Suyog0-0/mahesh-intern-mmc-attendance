# Gotchas & Environment Quirks

## drizzle-kit doesn't load .env.local automatically
drizzle-kit (generate/migrate/studio commands) only auto-loads a file named
`.env` by default. `.env.local` is a Next.js-specific convention that Next.js
itself loads, but the drizzle-kit CLI does not. Fix: drizzle.config.ts
explicitly does `import { config } from "dotenv"; config({ path: ".env.local" })`
before defineConfig(). This is already in place — don't remove it.

## Vercel's Neon integration only syncs DATABASE_URL to Production/Preview
When you create a Neon database via Vercel's Storage tab and connect it to
a project, the resulting env vars (DATABASE_URL, PGHOST, POSTGRES_*, etc.)
get scoped to Production and Preview environments ONLY — not Development —
and are LOCKED (not manually editable in the Vercel dashboard UI; the "edit"
option is replaced with "Manage Connection" / "Rotate Integration Secrets").
This means `npx vercel env pull .env.local` will NOT pull DATABASE_URL for
local dev, no matter how many times you retry it.

Workaround used: got the connection string from Neon's dashboard directly
(Vercel Storage tab → your DB → Open in Neon → Connection Details) and added
it to .env.local BY HAND, as a plain line:
  DATABASE_URL="postgresql://..."
This is separate from and not overwritten by `vercel env pull` (pull only
touches vars it manages, like VERCEL_OIDC_TOKEN — it won't delete manually
added lines, but also won't add DATABASE_URL to them).

If .env.local ever gets wiped or needs recreating on a new machine, repeat
this manual step — don't expect `vercel env pull` to provide DATABASE_URL
for local dev under the current Vercel/Neon integration setup.

## Next.js 16, not 14
The brief/plan originally assumed Next.js 14 conventions. `create-next-app`
installed 16.3.6, which is still App Router based, so nothing in the plan
changed, but be aware version-specific docs/APIs should target Next 16.

## Empty local folders never reach git (session 5 discovery)
The route-group folders created in the original scaffold —
`src/app/(auth)/login/`, `src/app/(app)/dashboard/` etc. — existed only as
EMPTY directories on the local machine. Git does not track empty directories,
so they were absent from every clone/push (confirmed via the GitHub tree API
at commit 9239f8d). Don't assume a folder convention "exists" just because it
was scaffolded locally — check `git ls-tree -r origin/main --name-only`.
Same reason `.claude/docs/debug-reports/` vanished until a `.gitkeep` was
added.

## useSearchParams() needs a Suspense boundary (Next.js App Router)
A client component that calls `useSearchParams()` (e.g. reading the
middleware's `?next=` redirect param on /login) must be wrapped in
<Suspense> by its parent page, or prerendering/build fails. Pattern used in
src/app/login/page.tsx: server page renders <Suspense fallback={null}>
around the client form component.

## Zod v4 API differences (session 6)
This project pins zod ^4.6.5. Some v3-era APIs moved:
- `error.flatten()` → `z.flattenError(error)` (top-level function, not a
  method on the error instance). Used in `src/lib/api.ts`'s `validate()`.
- `z.string().email()` etc. chained validators still work, but prefer
  checking `node_modules/zod/package.json` version before assuming any
  particular v3 pattern from training data still applies.

## `next dev`/`next build` writes to AGENTS.md — don't fight it
AGENTS.md contains a `<!-- BEGIN:nextjs-agent-rules -->...<!-- END -->` block
that Next.js itself regenerates on `next dev`/`next build`
(`node_modules/next/dist/server/lib/generate-agent-files.js`). If it's
missing from a diff, that's normal — removing it just means it gets
silently re-added the next time the dev/build server runs. Committing it
is fine and keeps the working tree clean; don't hand-edit inside that block.

## Font fetch (next/font/google) needs real internet access
`next build`/`next dev` fetch Geist/Geist Mono from fonts.googleapis.com at
build time. In network-restricted environments (sandboxes, CI without
egress to Google) this fails with `next/font: error: Failed to fetch`. This
is an environment/network issue, not a code bug — it will build fine on a
normal machine or on Vercel. `npx tsc --noEmit` and `npx eslint` are
reliable checks to run instead when full builds aren't possible locally.

## Next.js 16 renamed middleware.ts → proxy.ts (session 6)
The file convention `src/middleware.ts` (exported `middleware()` function)
is deprecated in Next 16 in favor of `src/proxy.ts` (exported `proxy()`
function) — same behavior, same `config.matcher`. `next build` prints a
deprecation warning (not an error) if you still use `middleware.ts`. This
project now uses `src/proxy.ts`. If you see the deprecation warning again,
check that nobody re-added a `middleware.ts` alongside it.

## `db.batch([...])` for atomic multi-statement writes on neon-http
The `drizzle-orm/neon-http` adapter has no interactive transactions
(`db.transaction()` is not available the way it is with node-postgres).
For the two places that need atomicity — switching which batch is
"current" (`setCurrentBatch`), and cascading a student delete across
attendance_records + leaves + students (`deleteStudentWithRecords`) — use
`db.batch([stmt1, stmt2, ...])` instead, which sends multiple statements as
one atomic request. Don't reach for `db.transaction()` on this adapter.
