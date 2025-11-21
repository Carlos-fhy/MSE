import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating base data...");

  // Create admin role
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      description: "Administrator role",
      permissions: JSON.stringify(["*"]),
    },
  });
  console.log("Created role:", adminRole.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      realName: "System Admin",
      roleId: adminRole.id,
      isActive: true,
    },
  });
  console.log("Created user:", adminUser.username);

  // Create sample equipment
  const equipment = await prisma.equipment.upsert({
    where: { equipmentNo: "EQ-001" },
    update: {},
    create: {
      equipmentNo: "EQ-001",
      equipmentName: "Assembly Line A",
      category: "Assembly",
      status: "idle",
    },
  });
  console.log("Created equipment:", equipment.equipmentName);

  console.log("\n Base data created successfully!");
  console.log(`Admin User ID: ${adminUser.id}`);
}

main()
  .catch((e) => {
    console.error("Error creating base data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
