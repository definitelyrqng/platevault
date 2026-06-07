/**
 * PlateVault — Super Admin seeder
 * Creates user #0 with SUPERADMIN role. Run once.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <username> <email> <password>
 *
 * Example:
 *   npx tsx scripts/create-admin.ts root admin@platevault.com MyStr0ng!Pass
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const [, , username, email, password] = process.argv;

  if (!username || !email || !password) {
    console.error("\nUsage: npx tsx scripts/create-admin.ts <username> <email> <password>\n");
    process.exit(1);
  }

  // Check if user #0 already exists
  const existing = await prisma.user.findUnique({ where: { numericId: 0 } });
  if (existing) {
    console.error(`\n❌  User #0 already exists (@${existing.username}). Aborting.\n`);
    process.exit(1);
  }

  // Validate
  if (!/^[a-zA-Z0-9._]{3,20}$/.test(username)) {
    console.error("\n❌  Username must be 3–20 chars (letters, numbers, _ or .).\n");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("\n❌  Password must be at least 8 characters.\n");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Insert with numericId=0 (overrides autoincrement default)
  const user = await prisma.user.create({
    data: {
      numericId: 0,
      username,
      email: email.toLowerCase(),
      password: passwordHash,
      role: "SUPERADMIN",
    },
    select: { numericId: true, username: true, email: true, role: true },
  });

  console.log(`\n✅  Super admin created!`);
  console.log(`    Username : @${user.username}`);
  console.log(`    Email    : ${user.email}`);
  console.log(`    Profile  : /u/0`);
  console.log(`    Role     : ${user.role}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
