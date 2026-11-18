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
      practitionerName: "Totus Team",
    },
    create: {
      id: "default",
      clinicName: "Totus Massage & Aesthetics",
      practitionerName: "Totus Team",
      phone: "079 011 8464",
      whatsappNumber: "079 011 8464",
      address: "Pretoria East",
      operatingHours: "Monday – Saturday: 08:00 – 17:00 | Sunday & Public Holidays: By appointment",
      defaultRetainerPercent: 30.0,
      adminAlertEmail: "info@kenalahealthhub.co.za",
    },
  });

  // 2. Seed Default Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Kenala2026!", salt);

  await prisma.admin.upsert({
    where: { email: "admin@kenalahealthhub.co.za" },
    update: { passwordHash, name: "Totus Admin" },
    create: {
      email: "admin@kenalahealthhub.co.za",
      name: "Totus Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  // Services are managed dynamically via the Admin Portal (0 pre-seeded services)
  console.log("✅ Studio settings and Admin account ready (0 default services).");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
