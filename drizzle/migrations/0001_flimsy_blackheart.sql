CREATE INDEX "attendance_records_date_idx" ON "attendance_records" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "batches_one_current_idx" ON "batches" USING btree ("is_current") WHERE "batches"."is_current" = true;--> statement-breakpoint
CREATE INDEX "leaves_student_idx" ON "leaves" USING btree ("student_id");