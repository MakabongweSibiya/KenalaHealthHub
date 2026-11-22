import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Totus Massage & Aesthetics database...");

  const adminEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL || "totusmassages@gmail.com"
  )
    .toLowerCase()
    .trim();
  const seedPassword = process.env.ADMIN_SEED_PASSWORD?.trim();

  // 1. Seed Studio Settings
  await prisma.clinicSetting.upsert({
    where: { id: "default" },
    update: {
      clinicName: "Totus Massage & Aesthetics",
      practitionerName: "Totus Admin",
      adminAlertEmail: adminEmail,
    },
    create: {
      id: "default",
      clinicName: "Totus Massage & Aesthetics",
      practitionerName: "Totus Admin",
      phone: "079 011 8464",
      whatsappNumber: "079 011 8464",
      address: "Pretoria East",
      operatingHours: "Managed dynamically via Admin Portal",
      defaultRetainerPercent: 0,
      adminAlertEmail: adminEmail,
    },
  });

  // 2. Seed Admin account only when ADMIN_SEED_PASSWORD is provided via environment
  if (!seedPassword || seedPassword.length < 8) {
    console.log(
      "Skipping Admin password seed: set ADMIN_SEED_PASSWORD (>=8 chars) in env to initialize/reset admin."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(seedPassword, 12);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: "Totus Admin", role: "SUPER_ADMIN" },
    create: {
      email: adminEmail,
      name: "Totus Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`Studio settings and Admin account (${adminEmail}) ready.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
