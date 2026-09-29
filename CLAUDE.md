@AGENTS.md

## Current project context

- Frontend UI refactor is in progress around shared shadcn-style primitives in `src/components/ui/`, built on Radix UI and Tailwind CSS v4. Keep the MMC visual identity: brand blue `#1E4F91`, deep blue `#163B69`, selective red `#B4233A`, and existing route/layout/workflow behavior.
- Shared UI foundations now include Button, Input, Label, Textarea, Badge, Card, Table, Alert, Skeleton, Separator, Dialog, Tabs, Select, Dropdown Menu, Tooltip, Checkbox, Alert Dialog, and Sheet. These are composed into app-specific screens; do not force primitives where a purpose-built interaction fits better.
- Main routes/forms/tables/navigation/loading states have been migrated in part. Continue auditing any remaining custom/raw controls for consistency while preserving responsive behavior and existing functionality.
- Current verification passed: `npx tsc --noEmit`, `npm run lint`, `git diff --check`, and `npm run build`. A route smoke check showed `/login` returns 200 and protected routes redirect to login when unauthenticated. No visual browser/device pass or Vercel deployment was performed.
- `npm install` reported four moderate dependency audit findings; do not run automatic dependency upgrades/fixes without evaluating scope.
- The working tree also contains prior user-requested attendance/session logic and DB migration changes (`drizzle/migrations/0005_attendance_sessions.sql`, attendance files, staff account query changes). Preserve these; avoid reverting unrelated existing edits.
