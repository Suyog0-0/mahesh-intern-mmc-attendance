/**
 * Bootstrap an admin or super-admin account so login can be tested.
 *
 * Usage:
 *   npm run seed:admin -- --username=owner --name="Owner" --role=superadmin
 * Or interactively:
 *   npm run seed:admin
 *
 * Safe to re-run: if the username already exists, it resets that user's
 * password instead of creating a duplicate.
 */

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import * as readline from "node:readline/promises";

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};

  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) out[match[1]] = match[2];
  }

  return out;
}

async function prompt(
  rl: readline.Interface,
  question: string,
  hidden = false,
) {
  if (!hidden) return (await rl.question(question)).trim();

  return new Promise<string>((resolve) => {
    const stdin = process.stdin;

    process.stdout.write(question);

    let value = "";

    const onData = (buf: Buffer) => {
      const char = buf.toString("utf8");

      if (char === "\n" || char === "\r" || char === "\u0004") {
        stdin.setRawMode?.(false);
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value.trim());
        return;
      }

      if (char === "\u0003") process.exit(1);

      if (char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    };

    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function main() {
  // Load these only after .env.local has been loaded.
  const { hashPassword } = await import("../src/lib/auth/password");
  const { db } = await import("../src/lib/db");
  const { users } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set (add it to .env.local).");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set (add it to .env.local).");
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const username = (args.username ?? (await prompt(rl, "Admin username: ")))
    .trim()
    .toLowerCase();

  const name = args.name ?? (await prompt(rl, "Full name: "));

  const password =
    args.password ?? (await prompt(rl, "Password (min 8 chars): ", true));
  if (args.role && args.role !== "admin" && args.role !== "superadmin") {
    console.error("Role must be admin or superadmin.");
    process.exit(1);
  }
  const requestedRole = args.role === "superadmin"
    ? "superadmin"
    : args.role === "admin"
      ? "admin"
      : undefined;

  rl.close();

  if (!username || !name || !password) {
    console.error("Username, name and password are all required.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const role = requestedRole ?? existing?.role ?? "admin";

  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash,
        name,
        role,
      })
      .where(eq(users.id, existing.id));

    console.log(
      `Updated existing user "${username}" — password reset, role set to ${role}.`,
    );
  } else {
    await db.insert(users).values({
      username,
      passwordHash,
      name,
      role,
    });

    console.log(`Created ${role} user "${username}".`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
