# Project Context — Student Attendance System

## What this is
Mobile-first internal web app for taking daily student attendance for a single
active batch (~100+ students per batch, one batch per ~3-month posting period).
Used by Mahesh (admin) and staff he assigns to help take attendance.

## Core users
- **Admin** (Mahesh): full control — manage students, batches, staff accounts,
  take attendance.
- **Staff**: take attendance only. No student/batch/user management.

## Core entities
- **Batch**: a cohort tied to a posting period (~3 months). Only one batch is
  "current" at a time. Old batches stay viewable (read-only) for history.
- **Student**: belongs to a batch. Roll number unique within batch (not globally).
  Fields: roll_number, name, posting_period, remarks.
- **Attendance record**: one per student per date. Status is absent / late / leave.
  Absence of a record = present (no need to mark present explicitly).
  Editable after the fact (corrections allowed).
- **Leave**: pre-approved absence with a date range + reason, separate from
  attendance_records. Shows on calendar for every day in range. Attendance-entry
  screen should surface "on leave until X" automatically when looking up a
  student who has an active leave.

## Key workflow (attendance-taking)
Mahesh (or staff) opens Take Attendance, picks date (defaults today), types a
roll number, system finds student in current batch, shows status buttons
(Absent / Late / Leave), immediate confirmation, input stays ready for next
roll number. No bulk "mark all present" — most students are present by default.

## Explicit non-goals (for now)
- No bulk student CSV/paste upload — manual add-student form only.
- No mark-all-present bulk action.
- No multi-batch attendance sessions.

## Design direction
Apple-level minimalism, Tribhuwan University color palette (maroon/crimson +
gold) as aesthetic inspiration only — not officially affiliated with TU.
Light + dark mode both required. Avoid decorative bloat, gradients, glassmorphism.

## Deployment target
intern.mmc.vercel.app, private GitHub repo mahesh-intern-mmc-attendance.
