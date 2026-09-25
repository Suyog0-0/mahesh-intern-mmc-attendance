/**
 * Seed comprehensive dummy data across all tables so you can test the app.
 * Usage: npx tsx --env-file=.env.local scripts/seed.ts
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

  // 1. Admin user
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
        name: "Admin User",
      })
      .returning();
    adminId = inserted.id;
    console.log(`Created admin user "${adminUsername}" / password123`);
  }

  // 2. Staff user
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
        name: "Staff Mahesh",
      })
      .returning();
    staffId = inserted.id;
    console.log(`Created staff user "${staffUsername}" / password123`);
  }

  // 3. Clear existing seed batches
  const seedBatchNames = ["Batch 2026-A", "Batch 2025-B"];

  const existingSeedBatches = await db
    .select({ id: batches.id })
    .from(batches)
    .where(inArray(batches.name, seedBatchNames));

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
    console.log("Cleared previously seeded batches/students/attendance/leaves.");
  }

  // 4. Create batches
  await db
    .update(batches)
    .set({ isCurrent: false })
    .where(eq(batches.isCurrent, true));

  const [currentBatch] = await db
    .insert(batches)
    .values({
      name: "Batch 2026-A",
      startDate: "2026-01-01",
      endDate: "2026-06-30",
      isCurrent: true,
    })
    .returning();

  await db.insert(batches).values({
    name: "Batch 2025-B",
    startDate: "2025-07-01",
    endDate: "2025-12-31",
    isCurrent: false,
  });

  console.log(`Created current batch "${currentBatch.name}"`);

  // 5. Create 12 students
  const internNames = [
    "Ramesh Sharma",
    "Sita Gurung",
    "Bikash Thapa",
    "Anita Rai",
    "Prakash Karki",
    "Sunita Shrestha",
    "Deepak Adhikari",
    "Manju Tamang",
    "Kiran Khatri",
    "Aasha Bista",
    "Roshan Mahato",
    "Pooja Chaudhary",
  ];

  const insertedStudents = await db
    .insert(students)
    .values(
      internNames.map((name, i) => ({
        batchId: currentBatch.id,
        rollNumber: `${i + 1}`,
        name,
        postingPeriod: "2026-01-01 to 2026-06-30",
        remarks: i % 2 === 0 ? "Surgery rotation" : "Internal Medicine",
      })),
    )
    .returning();

  console.log(`Created ${insertedStudents.length} interns.`);

  // 6. Create attendance records for last 7 days
  const today = new Date();
  const statuses = ["absent", "late", "leave"] as const;
  const attendanceRows: {
    studentId: number;
    date: string;
    status: "absent" | "late" | "leave";
    remarks: string | null;
    markedBy: number;
  }[] = [];

  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

  for (const student of insertedStudents) {
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      if (Math.random() > 0.35) continue;

      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      attendanceRows.push({
        studentId: student.id,
        date: toDateStr(date),
        status,
        remarks: status === "late" ? "Arrived 20 mins late" : null,
        markedBy: staffId,
      });
    }
  }

  if (attendanceRows.length > 0) {
    await db.insert(attendanceRecords).values(attendanceRows);
  }
  console.log(`Created ${attendanceRows.length} attendance records.`);

  // 7. Create 3 approved leave entries
  const leaveStart = new Date(today);
  leaveStart.setDate(leaveStart.getDate() + 2);
  const leaveEnd = new Date(leaveStart);
  leaveEnd.setDate(leaveEnd.getDate() + 3);

  const leaveRows = insertedStudents.slice(0, 3).map((student, i) => ({
    studentId: student.id,
    startDate: toDateStr(leaveStart),
    endDate: toDateStr(leaveEnd),
    reason: i === 0 ? "Medical leave" : i === 1 ? "Family event" : "Academic seminar",
    createdBy: adminId,
  }));

  await db.insert(leaves).values(leaveRows);
  console.log(`Created ${leaveRows.length} leave entries.`);

  console.log("\nSeed complete successfully!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
