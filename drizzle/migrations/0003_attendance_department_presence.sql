CREATE TYPE "public"."attendance_department" AS ENUM('cardiology', 'dermatology', 'psychiatry', 'other');--> statement-breakpoint
ALTER TYPE "public"."attendance_status" ADD VALUE 'present';--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "department" "attendance_department";