import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./utils/auth";

const prisma = new PrismaClient();

async function main() {
  const MES_SYSTEM_ID = "f62bf171-806d-4acd-b2bf-75d032fc678a";

  console.log("为MES系统创建管理员账号...");

  // 检查系统是否存在
  const system = await prisma.system.findUnique({
    where: { id: MES_SYSTEM_ID },
  });

  if (!system) {
    console.error("MES系统不存在！");
    process.exit(1);
  }

  console.log("找到系统:", system.name);

  // 创建管理员角色
  const adminRole = await prisma.role.create({
    data: {
      name: `${system.name}系统管理员`,
      description: `${system.name}的系统管理员`,
      permissions: JSON.stringify([
        "system:read",
        "system:update",
        "user:*",
        "role:read",
        "schema:*",
        "data:*",
      ]),
      systemId: system.id,
      isBuiltIn: false,
    },
  });

  console.log("创建角色:", adminRole.name);

  // 创建管理员用户
  const hashedPassword = await hashPassword("admin123");
  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      password: hashedPassword,
      realName: "系统管理员",
      email: `admin@${system.name}.local`,
      roleId: adminRole.id,
      systemId: system.id,
      isActive: true,
    },
  });

  console.log("创建用户:", adminUser.username);
  console.log("\n✅ 完成！MES系统管理员账号已创建:");
  console.log("  用户名: admin");
  console.log("  密码: admin123");
}

main()
  .catch((e) => {
    console.error("创建失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
