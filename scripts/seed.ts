/**
 * Seed dummy data across all tables so you can sanity-check the app.
 *
 * Usage:
 *   npm run seed --
 * (add a "seed": "tsx --env-file=.env.local scripts/seed.ts" script,
 *  or use the dotenv-based loader below — matches seed-admin.ts style)
 *
 * Safe to re-run: wipes previously-seeded rows (by known markers) before
 * inserting fresh ones, in FK-safe order (children first).
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { hashPassword } = await import("../src/lib/auth/password");
  const { db } = await import("../src/lib/db");
  const { users, batches, students, attendanceRecords, leaves } = await import(
    "../drizzle/schema"
  );
  const { eq, inArray } = await import("drizzle-orm");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set (add it to .env.local).");
    process.exit(1);
  }

  console.log("Seeding dummy data...\n");

  // ---------------------------------------------------------------------
  // 1. Admin user (idempotent upsert, same pattern as seed-admin.ts)
  // ---------------------------------------------------------------------
  const adminUsername = "admin";
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.username, adminUsername))
    .limit(1);

  let adminId: number;
  if (existingAdmin) {
    adminId = existingAdmin.id;
    console.log(`Admin "${adminUsername}" already exists — reusing.`);
  } else {
    const passwordHash = await hashPassword("password123");
    const [inserted] = await db
      .insert(users)
      .values({
        username: adminUsername,
        passwordHash,
        role: "admin",
        name: "Seed Admin",
      })
      .returning();
    adminId = inserted.id;
    console.log(`Created admin user "${adminUsername}" / password123`);
  }

  // A staff user too, since markedBy/createdBy can be any user.
  const staffUsername = "staff1";
  const [existingStaff] = await db
    .select()
    .from(users)
    .where(eq(users.username, staffUsername))
    .limit(1);

  let staffId: number;
  if (existingStaff) {
    staffId = existingStaff.id;
    console.log(`Staff "${staffUsername}" already exists — reusing.`);
  } else {
    const passwordHash = await hashPassword("password123");
    const [inserted] = await db
      .insert(users)
      .values({
        username: staffUsername,
        passwordHash,
        role: "staff",
        name: "Seed Staff",
      })
      .returning();
    staffId = inserted.id;
    console.log(`Created staff user "${staffUsername}" / password123`);
  }

  // ---------------------------------------------------------------------
  // 2. Wipe previously seeded batch(es) + dependent rows, FK-safe order.
  //    We tag seeded batches with a recognizable name prefix so re-runs
  //    don't pile up duplicates or collide with real data.
  // ---------------------------------------------------------------------
  const seedBatchName = "Seed Batch 2026";

  const existingSeedBatches = await db
    .select({ id: batches.id })
    .from(batches)
    .where(eq(batches.name, seedBatchName));

  if (existingSeedBatches.length > 0) {
    const batchIds = existingSeedBatches.map((b) => b.id);

    const seedStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(inArray(students.batchId, batchIds));
    const studentIds = seedStudents.map((s) => s.id);

    if (studentIds.length > 0) {
      await db
        .delete(attendanceRecords)
        .where(inArray(attendanceRecords.studentId, studentIds));
      await db.delete(leaves).where(inArray(leaves.studentId, studentIds));
      await db.delete(students).where(inArray(students.id, studentIds));
    }

    await db.delete(batches).where(inArray(batches.id, batchIds));
    console.log("Cleared previously seeded batch/students/attendance/leaves.");
  }

  // ---------------------------------------------------------------------
  // 3. Batch — marked current. If another batch is already current,
  //    unset it first (DB has a unique index enforcing only one).
  // ---------------------------------------------------------------------
  await db
    .update(batches)
    .set({ isCurrent: false })
    .where(eq(batches.isCurrent, true));

  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 1);
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 5);

  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

  const [batch] = await db
    .insert(batches)
    .values({
      name: seedBatchName,
      startDate: toDateStr(startDate),
      endDate: toDateStr(endDate),
      isCurrent: true,
    })
    .returning();

  console.log(`Created batch "${batch.name}" (id=${batch.id})`);

  // ---------------------------------------------------------------------
  // 4. Students
  // ---------------------------------------------------------------------
  const studentNames = [
    "Ramesh Sharma",
    "Sita Gurung",
    "Bikash Thapa",
    "Anita Rai",
    "Prakash Karki",
  ];

  const insertedStudents = await db
    .insert(students)
    .values(
      studentNames.map((name, i) => ({
        batchId: batch.id,
        rollNumber: `${i + 1}`,
        name,
        postingPeriod: "Jan 2026 - Jun 2026",
        remarks: i === 0 ? "Sample remark for testing" : null,
      })),
    )
    .returning();

  console.log(`Created ${insertedStudents.length} students.`);

  // ---------------------------------------------------------------------
  // 5. Attendance records — last 7 days, mix of statuses.
  //    (No "present" status exists in the enum, so days with no record
  //    are implicitly "present" per your schema design.)
  // ---------------------------------------------------------------------
  const statuses = ["absent", "late", "leave"] as const;
  const attendanceRows: {
    studentId: number;
    date: string;
    status: "absent" | "late" | "leave";
    remarks: string | null;
    markedBy: number;
  }[] = [];

  for (const student of insertedStudents) {
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      // Only mark ~40% of days so most days are implicitly "present".
      if (Math.random() > 0.4) continue;

      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      attendanceRows.push({
        studentId: student.id,
        date: toDateStr(date),
        status,
        remarks: status === "late" ? "Arrived 30 min late" : null,
        markedBy: staffId,
      });
    }
  }

  if (attendanceRows.length > 0) {
    await db.insert(attendanceRecords).values(attendanceRows);
  }
  console.log(`Created ${attendanceRows.length} attendance records.`);

  // ---------------------------------------------------------------------
  // 6. Leaves — give 2 students an upcoming leave entry.
  // ---------------------------------------------------------------------
  const leaveStart = new Date(today);
  leaveStart.setDate(leaveStart.getDate() + 3);
  const leaveEnd = new Date(leaveStart);
  leaveEnd.setDate(leaveEnd.getDate() + 2);

  const leaveRows = insertedStudents.slice(0, 2).map((student, i) => ({
    studentId: student.id,
    startDate: toDateStr(leaveStart),
    endDate: toDateStr(leaveEnd),
    reason: i === 0 ? "Family event" : "Medical",
    createdBy: adminId,
  }));

  await db.insert(leaves).values(leaveRows);
  console.log(`Created ${leaveRows.length} leave entries.`);

  console.log("\nSeed complete.");
  console.log(`Login as admin: ${adminUsername} / password123`);
  console.log(`Login as staff: ${staffUsername} / password123`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
