/**
 * Add repeatable, clearly labeled UI-review data without deleting application
 * records. Run with: npm run seed
 * The script reuses existing accounts and never creates passwords/users.
 */

import dotenv from "dotenv";
import { eq, inArray } from "drizzle-orm";
dotenv.config({ path: ".env.local" });

const DEMO_STUDENTS_PER_BATCH = 100;
const DEMO_BATCHES = [
  { name: "UI Review Cohort A", startDate: "2026-01-01", endDate: "2026-12-31" },
  { name: "UI Review Cohort B", startDate: "2026-01-01", endDate: "2026-12-31" },
] as const;

function dateAtOffset(offset: number): string {
  const date = new Date(`${todayInAppTimeZone()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function todayInAppTimeZone(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add a local/staging URL to .env.local.");
  }

  const [{ db }, schema] = await Promise.all([
    import("../src/lib/db"),
    import("../drizzle/schema"),
  ]);
  const { batches, students, attendanceRecords, leaves, users } = schema;
  const existingOperators = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.role, ["admin", "staff"]))
    .limit(1);

  const operator = existingOperators[0];
  if (!operator) {
    throw new Error("Create an admin or staff account before seeding UI-review records.");
  }

  const existingBatchRows = await db.select().from(batches);
  let activeBatchExists = existingBatchRows.some((batch) => batch.isCurrent);
  const demoBatches = [];

  for (const [index, definition] of DEMO_BATCHES.entries()) {
    const found = existingBatchRows.find((batch) => batch.name === definition.name);
    if (found) {
      if (!activeBatchExists && index === 0 && !found.isCurrent) {
        const [activatedDemoBatch] = await db
          .update(batches)
          .set({ isCurrent: true })
          .where(eq(batches.id, found.id))
          .returning();
        demoBatches.push(activatedDemoBatch);
        activeBatchExists = true;
      } else {
        demoBatches.push(found);
      }
      continue;
    }

    const [created] = await db
      .insert(batches)
      .values({
        ...definition,
        isCurrent: !activeBatchExists && index === 0,
      })
      .returning();
    demoBatches.push(created);
    if (created.isCurrent) activeBatchExists = true;
    console.log(`Created demo batch: ${definition.name}`);
  }

  const allDemoStudents = [];
  const departments = [
    "Internal Medicine",
    "Cardiology",
    "General Surgery",
    "Pediatrics",
    "Emergency Medicine",
    "Neurology",
    "Orthopedics",
    "Obstetrics & Gynecology",
  ];

  for (const [batchIndex, batch] of demoBatches.entries()) {
    const currentStudents = await db
      .select({ id: students.id, rollNumber: students.rollNumber })
      .from(students)
      .where(eq(students.batchId, batch.id));
    const existingRollNumbers = new Set(currentStudents.map((student) => student.rollNumber));
    const newStudents = Array.from({ length: DEMO_STUDENTS_PER_BATCH }, (_, index) => {
      const number = batchIndex * DEMO_STUDENTS_PER_BATCH + index + 1;
      const rollNumber = `UI${String(number).padStart(3, "0")}`;
      return {
        batchId: batch.id,
        rollNumber,
        name: `Demo Intern ${String(number).padStart(3, "0")}`,
        postingPeriod: `${batch.startDate} to ${batch.endDate}`,
        remarks: `${departments[(number - 1) % departments.length]} · UI review sample`,
      };
    }).filter((student) => !existingRollNumbers.has(student.rollNumber));

    if (newStudents.length) {
      const inserted = await db.insert(students).values(newStudents).returning({
        id: students.id,
        rollNumber: students.rollNumber,
      });
      allDemoStudents.push(...inserted);
      console.log(`Added ${inserted.length} interns to ${batch.name}.`);
    }

    const demoStudents = [...currentStudents, ...allDemoStudents]
      .filter((student) => student.rollNumber.startsWith("UI"))
      .filter((student) => {
        const number = Number(student.rollNumber.slice(2));
        return number > batchIndex * DEMO_STUDENTS_PER_BATCH &&
          number <= (batchIndex + 1) * DEMO_STUDENTS_PER_BATCH;
      });
    allDemoStudents.push(...currentStudents.filter((student) => student.rollNumber.startsWith("UI")));

    const today = todayInAppTimeZone();
    const attendanceRows = demoStudents.flatMap((student) => {
      const number = Number(student.rollNumber.slice(2));
      return Array.from({ length: 30 }, (_, dayIndex) => {
        const dayOffset = -(dayIndex + 1);
        const sample = (number * 7 + (dayIndex + 1) * 13) % 19;
        if (sample > 2) return null;
        const status = sample === 0 ? "absent" as const : sample === 1 ? "late" as const : "leave" as const;
        return {
          studentId: student.id,
          date: dateAtOffset(dayOffset),
          status,
          remarks: status === "late" ? "UI review sample · arrived late" : "UI review sample",
          markedBy: operator.id,
        };
      }).filter((row): row is NonNullable<typeof row> => row !== null);
    });

    // Include a predictable sample on the current date for the attendance view.
    const currentDaySamples = demoStudents.slice(0, 8).map((student, index) => ({
      studentId: student.id,
      date: today,
      status: index < 3 ? "absent" as const : index < 6 ? "late" as const : "leave" as const,
      remarks: "UI review sample",
      markedBy: operator.id,
    }));

    await db.insert(attendanceRecords)
      .values([...attendanceRows, ...currentDaySamples])
      .onConflictDoNothing();

    const demoStudentIds = demoStudents.map((student) => student.id);
    if (!demoStudentIds.length) continue;
    const existingLeaves = await db
      .select({ studentId: leaves.studentId, startDate: leaves.startDate })
      .from(leaves)
      .where(inArray(leaves.studentId, demoStudentIds));
    const existingLeaveKeys = new Set(existingLeaves.map((leave) => `${leave.studentId}:${leave.startDate}`));
    const leaveRows = demoStudents
      .filter((student) => Number(student.rollNumber.slice(2)) % 9 === 0)
      .map((student, index) => {
        const startDate = dateAtOffset(index % 2 === 0 ? -2 : 3);
        return {
          studentId: student.id,
          startDate,
          endDate: dateAtOffset(index % 2 === 0 ? 1 : 6),
          reason: index % 2 === 0 ? "UI review sample · medical leave" : "UI review sample · approved personal leave",
          createdBy: operator.id,
        };
      })
      .filter((leave) => !existingLeaveKeys.has(`${leave.studentId}:${leave.startDate}`));

    if (leaveRows.length) await db.insert(leaves).values(leaveRows);
    console.log(`Added attendance and ${leaveRows.length} leave samples for ${batch.name}.`);
  }

  console.log("\nUI-review seed complete. No existing records were deleted.");
  console.log("Created dataset: 200 interns across two demo cohorts, with varied attendance and leave examples.");
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("UI-review seed failed:", error);
  process.exit(1);
});
