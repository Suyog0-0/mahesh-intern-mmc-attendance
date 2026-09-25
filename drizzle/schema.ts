import {
  pgTable,
  serial,
  varchar,
  text,
  date,
  timestamp,
  boolean,
  pgEnum,
  integer,
  unique,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "staff", "superadmin"]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "absent",
  "late",
  "leave",
  "present",
]);
export const attendanceDepartmentEnum = pgEnum("attendance_department", [
  "cardiology",
  "dermatology",
  "psychiatry",
  "other",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("staff"),
  name: varchar("name", { length: 128 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const batches = pgTable(
  "batches",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 128 }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    isCurrent: boolean("is_current").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // At most one batch can be current — enforced by the database.
    uniqueIndex("batches_one_current_idx")
      .on(table.isCurrent)
      .where(sql`${table.isCurrent} = true`),
  ]
);

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    batchId: integer("batch_id")
      .notNull()
      .references(() => batches.id),
    rollNumber: varchar("roll_number", { length: 16 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    postingPeriod: varchar("posting_period", { length: 128 }).notNull(),
    remarks: text("remarks"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.batchId, table.rollNumber)]
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id),
    date: date("date").notNull(),
    status: attendanceStatusEnum("status").notNull(),
    department: attendanceDepartmentEnum("department"),
    remarks: text("remarks"),
    markedBy: integer("marked_by")
      .references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.studentId, table.date),
    index("attendance_records_date_idx").on(table.date),
  ]
);

export const leaves = pgTable(
  "leaves",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reason: text("reason"),
    createdBy: integer("created_by")
      .references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("leaves_student_idx").on(table.studentId)]
);
