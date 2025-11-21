import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./utils/auth";

const prisma = new PrismaClient();

// 产品名称
const PRODUCTS = [
  "电机外壳A型", "电机外壳B型", "减速器齿轮", "传动轴", "轴承座",
  "电控盒体", "散热片", "端盖", "密封圈", "连接法兰",
  "支架总成", "底座", "护罩", "接线盒", "风扇叶片"
];

// 设备数据
const EQUIPMENT_DATA = [
  { no: "CNC-001", name: "数控车床1号", category: "press", location: "A车间-01", manufacturer: "沈阳机床" },
  { no: "CNC-002", name: "数控车床2号", category: "press", location: "A车间-02", manufacturer: "沈阳机床" },
  { no: "CNC-003", name: "数控铣床1号", category: "press", location: "A车间-03", manufacturer: "大连机床" },
  { no: "INJ-001", name: "注塑机1号", category: "injection", location: "B车间-01", manufacturer: "海天" },
  { no: "INJ-002", name: "注塑机2号", category: "injection", location: "B车间-02", manufacturer: "海天" },
  { no: "ASM-001", name: "装配线1号", category: "assembly", location: "C车间-01", manufacturer: "自制" },
  { no: "ASM-002", name: "装配线2号", category: "assembly", location: "C车间-02", manufacturer: "自制" },
  { no: "INS-001", name: "三坐标测量仪", category: "inspection", location: "质检室", manufacturer: "海克斯康" },
  { no: "INS-002", name: "硬度测试仪", category: "inspection", location: "质检室", manufacturer: "莱茵" },
  { no: "PKG-001", name: "自动包装机", category: "packaging", location: "D车间-01", manufacturer: "松下" },
];

// 员工数据
const EMPLOYEES = [
  { name: "张伟", dept: "production", pos: "leader" },
  { name: "李强", dept: "production", pos: "staff" },
  { name: "王芳", dept: "production", pos: "staff" },
  { name: "刘洋", dept: "production", pos: "staff" },
  { name: "陈明", dept: "quality", pos: "supervisor" },
  { name: "赵雪", dept: "quality", pos: "staff" },
  { name: "周杰", dept: "equipment", pos: "leader" },
  { name: "吴涛", dept: "equipment", pos: "staff" },
];

// 随机选择
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 随机整数
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成日期（过去N天内）
function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(randomInt(8, 17), randomInt(0, 59), 0, 0);
  return date;
}

// 生成工单编号
function generateOrderNo(index: number): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `WO${date.getFullYear()}${month}${String(index).padStart(4, "0")}`;
}

async function main() {
  console.log("开始生成示例数据...\n");

  // 获取示例MES系统
  const mesSystem = await prisma.system.findUnique({
    where: { name: "示例MES系统" },
  });

  if (!mesSystem) {
    console.error("错误: 示例MES系统不存在，请先运行 npm run seed");
    process.exit(1);
  }

  console.log("找到系统:", mesSystem.name, "(ID:", mesSystem.id, ")");

  // 获取系统管理员角色和用户
  const sysAdminRole = await prisma.role.findFirst({
    where: { name: "系统管理员" },
  });

  if (!sysAdminRole) {
    console.error("错误: 系统管理员角色不存在");
    process.exit(1);
  }

  // 获取或创建操作员用户
  let operatorUser = await prisma.user.findFirst({
    where: { username: "sysadmin", systemId: mesSystem.id },
  });

  if (!operatorUser) {
    const password = await hashPassword("sysadmin123");
    operatorUser = await prisma.user.create({
      data: {
        username: "sysadmin",
        password,
        realName: "系统管理员",
        roleId: sysAdminRole.id,
        systemId: mesSystem.id,
        isActive: true,
      },
    });
  }

  console.log("操作用户:", operatorUser.realName);

  // ========== 1. 创建设备 ==========
  console.log("\n创建设备...");
  const equipments = [];

  for (const eq of EQUIPMENT_DATA) {
    const existing = await prisma.equipment.findUnique({
      where: { equipmentNo: eq.no },
    });

    if (existing) {
      equipments.push(existing);
      continue;
    }

    const equipment = await prisma.equipment.create({
      data: {
        equipmentNo: eq.no,
        equipmentName: eq.name,
        category: eq.category,
        location: eq.location,
        manufacturer: eq.manufacturer,
        model: `Model-${randomInt(100, 999)}`,
        status: randomPick(["idle", "running", "idle", "running", "maintenance"]),
        purchaseDate: randomDate(365 * 3),
        warrantyPeriod: randomPick([12, 24, 36]),
        systemId: mesSystem.id,
      },
    });
    equipments.push(equipment);
  }
  console.log(`  创建了 ${equipments.length} 台设备`);

  // ========== 2. 创建工单 ==========
  console.log("\n创建工单...");
  const workOrders = [];
  const ORDER_COUNT = 50;

  // 先删除旧的示例工单
  await prisma.qualityCheck.deleteMany({ where: { systemId: mesSystem.id } });
  await prisma.workReport.deleteMany({ where: { systemId: mesSystem.id } });
  await prisma.workOrder.deleteMany({ where: { systemId: mesSystem.id } });

  for (let i = 1; i <= ORDER_COUNT; i++) {
    const planStartDate = randomDate(30);
    const planEndDate = new Date(planStartDate);
    planEndDate.setDate(planEndDate.getDate() + randomInt(1, 7));

    const status = randomPick(["pending", "in_progress", "in_progress", "completed", "completed", "completed"]);
    const actualStartDate = status !== "pending" ? new Date(planStartDate.getTime() + randomInt(-2, 2) * 86400000) : null;
    const actualEndDate = status === "completed" ? new Date(planEndDate.getTime() + randomInt(-1, 3) * 86400000) : null;

    const workOrder = await prisma.workOrder.create({
      data: {
        orderNo: generateOrderNo(i),
        productName: randomPick(PRODUCTS),
        quantity: randomInt(50, 500),
        status,
        priority: randomPick(["low", "normal", "normal", "high", "urgent"]),
        planStartDate,
        planEndDate,
        actualStartDate,
        actualEndDate,
        equipmentId: randomPick(equipments).id,
        createdBy: operatorUser.id,
        systemId: mesSystem.id,
      },
    });
    workOrders.push(workOrder);
  }
  console.log(`  创建了 ${workOrders.length} 个工单`);

  // ========== 3. 创建报工记录 ==========
  console.log("\n创建报工记录...");
  let reportCount = 0;

  for (const wo of workOrders) {
    if (wo.status === "pending") continue;

    // 每个进行中或完成的工单生成1-5条报工
    const reportNum = randomInt(1, 5);
    for (let j = 0; j < reportNum; j++) {
      const reportDate = wo.actualStartDate || wo.planStartDate;
      const date = new Date(reportDate);
      date.setDate(date.getDate() + j);

      await prisma.workReport.create({
        data: {
          workOrderId: wo.id,
          userId: operatorUser.id,
          workHours: randomInt(2, 8) + Math.random(),
          quantity: Math.floor(wo.quantity / reportNum) + randomInt(-10, 10),
          reportDate: date,
          remarks: randomPick(["正常生产", "设备调试后继续", "加班完成", "", ""]),
          systemId: mesSystem.id,
        },
      });
      reportCount++;
    }
  }
  console.log(`  创建了 ${reportCount} 条报工记录`);

  // ========== 4. 创建质检记录 ==========
  console.log("\n创建质检记录...");
  let checkCount = 0;

  for (const wo of workOrders) {
    if (wo.status !== "completed") continue;

    const totalQty = wo.quantity;
    const passRate = 0.85 + Math.random() * 0.14; // 85%-99% 合格率
    const passQty = Math.floor(totalQty * passRate);
    const failQty = totalQty - passQty;

    await prisma.qualityCheck.create({
      data: {
        workOrderId: wo.id,
        inspectorId: operatorUser.id,
        result: failQty > totalQty * 0.1 ? "fail" : "pass",
        totalQty,
        passQty,
        failQty,
        checkDate: wo.actualEndDate || new Date(),
        remarks: failQty > 0 ? `发现${failQty}件不良品` : "全部合格",
        systemId: mesSystem.id,
      },
    });
    checkCount++;
  }
  console.log(`  创建了 ${checkCount} 条质检记录`);

  // ========== 5. 创建员工数据 (DataRecord) ==========
  console.log("\n创建员工数据...");

  // 清除旧的员工数据
  await prisma.dataRecord.deleteMany({
    where: { entity: "Employee", systemId: mesSystem.id },
  });

  for (let i = 0; i < EMPLOYEES.length; i++) {
    const emp = EMPLOYEES[i];
    await prisma.dataRecord.create({
      data: {
        entity: "Employee",
        data: JSON.stringify({
          empNo: `EMP${String(i + 1).padStart(3, "0")}`,
          name: emp.name,
          department: emp.dept,
          position: emp.pos,
          phone: `138${randomInt(10000000, 99999999)}`,
          hireDate: randomDate(365 * 5).toISOString().split("T")[0],
          remark: "",
        }),
        systemId: mesSystem.id,
        createdBy: operatorUser.id,
      },
    });
  }
  console.log(`  创建了 ${EMPLOYEES.length} 条员工记录`);

  // ========== 统计 ==========
  console.log("\n========== 数据生成完成 ==========");
  console.log(`设备: ${equipments.length} 台`);
  console.log(`工单: ${workOrders.length} 个`);
  console.log(`  - 待处理: ${workOrders.filter(w => w.status === "pending").length}`);
  console.log(`  - 进行中: ${workOrders.filter(w => w.status === "in_progress").length}`);
  console.log(`  - 已完成: ${workOrders.filter(w => w.status === "completed").length}`);
  console.log(`报工记录: ${reportCount} 条`);
  console.log(`质检记录: ${checkCount} 条`);
  console.log(`员工: ${EMPLOYEES.length} 人`);
}

main()
  .catch((e) => {
    console.error("生成数据失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
