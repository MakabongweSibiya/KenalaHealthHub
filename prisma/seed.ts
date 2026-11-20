import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌸 Seeding Totus Massage & Aesthetics database...");

  // 1. Seed Studio Settings
  await prisma.clinicSetting.upsert({
    where: { id: "default" },
    update: {
      clinicName: "Totus Massage & Aesthetics",
      practitionerName: "Totus Admin",
      adminAlertEmail: "totusmassages@gmail.com",
    },
    create: {
      id: "default",
      clinicName: "Totus Massage & Aesthetics",
      practitionerName: "Totus Admin",
      phone: "079 011 8464",
      whatsappNumber: "079 011 8464",
      address: "Pretoria East",
      operatingHours:
        "Monday – Saturday: 08:00 – 17:00 | Sunday & Public Holidays: By appointment",
      defaultRetainerPercent: 30.0,
      adminAlertEmail: "totusmassages@gmail.za",
    },
  });

  // 2. Remove any legacy admin emails and seed official Totus Admin account
  await prisma.admin.deleteMany({
    where: { email: { not: "totusmassages@gmail.com" } },
  });

  const passwordHash = await bcrypt.hash("Nala012!", 12);

  await prisma.admin.upsert({
    where: { email: "totusmassages@gmail.com" },
    update: { passwordHash, name: "Totus Admin", role: "SUPER_ADMIN" },
    create: {
      email: "totusmassages@gmail.com",
      name: "Totus Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("✅ Studio settings and Admin account (totusmassages@gmail.com) ready.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
