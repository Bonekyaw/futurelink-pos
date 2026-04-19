/**
 * One-time: create an ADMIN user if none exists.
 * Usage: ADMIN_PIN=1234 ADMIN_NAME=Admin npx tsx scripts/bootstrap-admin.ts
 */
import "dotenv/config";
import prisma from "../lib/prisma";
import { hashPin, isValidPinFormat } from "../lib/auth/pin";

async function main() {
  const pin = process.env.ADMIN_PIN?.trim() ?? "";
  const name = process.env.ADMIN_NAME?.trim() ?? "Admin";

  if (!isValidPinFormat(pin)) {
    console.error("Set ADMIN_PIN to exactly 4 digits.");
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("An ADMIN user already exists. Skipping.");
    return;
  }

  await prisma.user.create({
    data: {
      name,
      pin: await hashPin(pin),
      role: "ADMIN",
    },
  });

  console.log(`Created ADMIN user "${name}".`);
}

void main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
