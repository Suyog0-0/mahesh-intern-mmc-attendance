CREATE TYPE "public"."attendance_session" AS ENUM('morning', 'ward');--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "session" "attendance_session" DEFAULT 'morning' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_student_id_date_unique";--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_date_session_unique" UNIQUE("student_id", "date", "session");
