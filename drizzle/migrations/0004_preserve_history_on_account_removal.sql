ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_marked_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "leaves" DROP CONSTRAINT "leaves_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance_records" ALTER COLUMN "marked_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leaves" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;