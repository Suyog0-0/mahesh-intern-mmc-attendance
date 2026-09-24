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
