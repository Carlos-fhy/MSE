import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 清理孤儿系统：删除那些没有关联用户的系统
 * 这些系统通常是创建过程中因为角色名称冲突而失败留下的
 */
async function cleanupOrphanSystems() {
  console.log("开始清理孤儿系统...");

  try {
    // 查找所有系统
    const allSystems = await prisma.system.findMany({
      include: {
        users: true,
      },
    });

    console.log(`找到 ${allSystems.length} 个系统`);

    // 找出没有用户的系统（孤儿系统）
    const orphanSystems = allSystems.filter((system) => system.users.length === 0);

    if (orphanSystems.length === 0) {
      console.log("没有发现孤儿系统，无需清理");
      return;
    }

    console.log(`\n发现 ${orphanSystems.length} 个孤儿系统：`);
    orphanSystems.forEach((system) => {
      console.log(`  - ${system.name} (ID: ${system.id})`);
    });

    // 删除孤儿系统
    console.log("\n开始删除孤儿系统...");
    for (const system of orphanSystems) {
      await prisma.system.delete({
        where: { id: system.id },
      });
      console.log(`  ✓ 已删除: ${system.name}`);
    }

    console.log(`\n清理完成！共删除 ${orphanSystems.length} 个孤儿系统`);
  } catch (error: any) {
    console.error("清理失败:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanSystems()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
