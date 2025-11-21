import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./utils/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // ========== 创建内置角色 ==========
  console.log("\n创建内置角色...");

  // 超级管理员角色 - 拥有所有权限
  const adminRole = await prisma.role.upsert({
    where: { name: "超级管理员" },
    update: {
      description: "系统超级管理员，拥有所有权限",
      permissions: JSON.stringify([
        "system:*",
        "user:*",
        "role:*",
        "schema:*",
        "data:*",
      ]),
      isBuiltIn: true,
    },
    create: {
      name: "超级管理员",
      description: "系统超级管理员，拥有所有权限",
      permissions: JSON.stringify([
        "system:*",
        "user:*",
        "role:*",
        "schema:*",
        "data:*",
      ]),
      systemId: null, // 全局角色
      isBuiltIn: true,
    },
  });

  console.log("创建超级管理员角色:", adminRole.name);

  // 系统管理员角色 - 仅管理单个系统
  const systemAdminRole = await prisma.role.upsert({
    where: { name: "系统管理员" },
    update: {
      description: "系统管理员，可以管理系统内的用户和配置",
      permissions: JSON.stringify([
        "system:read",   // 可以查看系统信息
        "system:update", // 可以修改系统设置
        "user:read",
        "user:create",
        "user:update",
        "user:delete",
        "role:read",
        "schema:*",
        "data:*",
      ]),
      isBuiltIn: true,
    },
    create: {
      name: "系统管理员",
      description: "系统管理员，可以管理系统内的用户和配置",
      permissions: JSON.stringify([
        "system:read",   // 可以查看系统信息
        "system:update", // 可以修改系统设置
        "user:read",
        "user:create",
        "user:update",
        "user:delete",
        "role:read",
        "schema:*",
        "data:*",
      ]),
      systemId: null, // 全局角色
      isBuiltIn: true,
    },
  });

  console.log("创建系统管理员角色:", systemAdminRole.name);

  // 普通用户角色 - 基本的读写权限
  const userRole = await prisma.role.upsert({
    where: { name: "普通用户" },
    update: {
      description: "普通用户，具有基本的数据读写权限",
      permissions: JSON.stringify(["data:read", "data:create", "data:update"]),
      isBuiltIn: true,
    },
    create: {
      name: "普通用户",
      description: "普通用户，具有基本的数据读写权限",
      permissions: JSON.stringify(["data:read", "data:create", "data:update"]),
      systemId: null, // 全局角色
      isBuiltIn: true,
    },
  });

  console.log("创建普通用户角色:", userRole.name);

  // 只读用户角色
  const readonlyRole = await prisma.role.upsert({
    where: { name: "只读用户" },
    update: {
      description: "只读用户，仅可查看数据",
      permissions: JSON.stringify(["data:read"]),
      isBuiltIn: true,
    },
    create: {
      name: "只读用户",
      description: "只读用户，仅可查看数据",
      permissions: JSON.stringify(["data:read"]),
      systemId: null, // 全局角色
      isBuiltIn: true,
    },
  });

  console.log("创建只读用户角色:", readonlyRole.name);

  // ========== 创建示例系统 ==========
  console.log("\n创建示例系统...");

  const mesSystem = await prisma.system.upsert({
    where: { name: "示例MES系统" },
    update: {
      description: "这是一个示例的MES生产管理系统",
      isAuthEnabled: false, // 默认不启用认证，方便测试
    },
    create: {
      name: "示例MES系统",
      description: "这是一个示例的MES生产管理系统",
      isAuthEnabled: false, // 默认不启用认证，方便测试
    },
  });

  console.log("创建示例系统:", mesSystem.name);

  // ========== 创建示例用户 ==========
  console.log("\n创建示例用户...");

  // 创建超级管理员用户（systemId为null，可以访问所有系统）
  const adminPassword = await hashPassword("admin123");

  // 先查找是否已存在admin用户（systemId为null）
  let adminUser = await prisma.user.findFirst({
    where: {
      username: "admin",
      systemId: null,
    },
  });

  if (adminUser) {
    // 如果已存在，更新密码和信息
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password: adminPassword,
        realName: "超级管理员",
        description: "系统超级管理员，可以访问所有系统",
        roleId: adminRole.id,
      },
    });
  } else {
    // 如果不存在，创建新用户
    adminUser = await prisma.user.create({
      data: {
        username: "admin",
        password: adminPassword,
        realName: "超级管理员",
        description: "系统超级管理员，可以访问所有系统",
        email: "admin@example.com",
        roleId: adminRole.id,
        systemId: null, // null表示可以访问所有系统
        isActive: true,
      },
    });
  }

  console.log("创建超级管理员用户:", adminUser.username, "/ 密码: admin123");

  // 创建系统管理员用户
  const sysAdminPassword = await hashPassword("sysadmin123");
  const sysAdminUser = await prisma.user.upsert({
    where: {
      username_systemId: {
        username: "sysadmin",
        systemId: mesSystem.id,
      },
    },
    update: {
      password: sysAdminPassword,
      realName: "张主管",
      description: "MES系统管理员",
      roleId: systemAdminRole.id,
      systemId: mesSystem.id,
    },
    create: {
      username: "sysadmin",
      password: sysAdminPassword,
      realName: "张主管",
      description: "MES系统管理员",
      email: "sysadmin@example.com",
      roleId: systemAdminRole.id,
      systemId: mesSystem.id,
      isActive: true,
    },
  });

  console.log("创建系统管理员用户:", sysAdminUser.username, "/ 密码: sysadmin123");

  // 创建普通用户（组长）
  const normalUserPassword = await hashPassword("user123");
  const normalUser = await prisma.user.upsert({
    where: {
      username_systemId: {
        username: "leader",
        systemId: mesSystem.id,
      },
    },
    update: {
      password: normalUserPassword,
      realName: "李组长",
      description: "生产部组长，负责工单管理",
      roleId: userRole.id,
      systemId: mesSystem.id,
    },
    create: {
      username: "leader",
      password: normalUserPassword,
      realName: "李组长",
      description: "生产部组长，负责工单管理",
      email: "leader@example.com",
      roleId: userRole.id,
      systemId: mesSystem.id,
      isActive: true,
    },
  });

  console.log("创建普通用户:", normalUser.username, "/ 密码: user123");

  // 创建只读用户（工人）
  const readonlyUserPassword = await hashPassword("worker123");
  const readonlyUser = await prisma.user.upsert({
    where: {
      username_systemId: {
        username: "worker",
        systemId: mesSystem.id,
      },
    },
    update: {
      password: readonlyUserPassword,
      realName: "王工",
      description: "生产部工人，只能查看和报工",
      roleId: readonlyRole.id,
      systemId: mesSystem.id,
    },
    create: {
      username: "worker",
      password: readonlyUserPassword,
      realName: "王工",
      description: "生产部工人，只能查看和报工",
      email: "worker@example.com",
      roleId: readonlyRole.id,
      systemId: mesSystem.id,
      isActive: true,
    },
  });

  console.log("创建只读用户:", readonlyUser.username, "/ 密码: worker123");

  // ========== 创建MES应用配置 ==========
  console.log("\n创建MES应用配置...");

  // Create a sample Schema for Work Orders
  const workOrderSchema = await prisma.schema.upsert({
    where: { name: "work-order" },
    update: {
      category: "mes",
      systems: {
        connect: { id: mesSystem.id },
      },
      fields: JSON.stringify([
        {
          key: "orderNo",
          label: "工单编号",
          type: "text",
          required: true,
        },
        {
          key: "productName",
          label: "产品名称",
          type: "text",
          required: true,
        },
        {
          key: "quantity",
          label: "数量",
          type: "number",
          required: true,
        },
        {
          key: "status",
          label: "状态",
          type: "select",
          required: true,
          options: [
            { label: "待处理", value: "pending" },
            { label: "进行中", value: "in_progress" },
            { label: "已完成", value: "completed" },
          ],
          defaultValue: "pending",
        },
        {
          key: "priority",
          label: "优先级",
          type: "select",
          required: false,
          options: [
            { label: "低", value: "low" },
            { label: "普通", value: "normal" },
            { label: "高", value: "high" },
            { label: "紧急", value: "urgent" },
          ],
          defaultValue: "normal",
        },
        {
          key: "planStartDate",
          label: "计划开始日期",
          type: "date",
          required: false,
        },
        {
          key: "planEndDate",
          label: "计划结束日期",
          type: "date",
          required: false,
        },
      ]),
    },
    create: {
      name: "work-order",
      entity: "WorkOrder",
      category: "mes",
      systems: {
        connect: { id: mesSystem.id },
      },
      fields: JSON.stringify([
        {
          key: "orderNo",
          label: "工单编号",
          type: "text",
          required: true,
        },
        {
          key: "productName",
          label: "产品名称",
          type: "text",
          required: true,
        },
        {
          key: "quantity",
          label: "数量",
          type: "number",
          required: true,
        },
        {
          key: "status",
          label: "状态",
          type: "select",
          required: true,
          options: [
            { label: "待处理", value: "pending" },
            { label: "进行中", value: "in_progress" },
            { label: "已完成", value: "completed" },
          ],
          defaultValue: "pending",
        },
        {
          key: "priority",
          label: "优先级",
          type: "select",
          required: false,
          options: [
            { label: "低", value: "low" },
            { label: "普通", value: "normal" },
            { label: "高", value: "high" },
            { label: "紧急", value: "urgent" },
          ],
          defaultValue: "normal",
        },
        {
          key: "planStartDate",
          label: "计划开始日期",
          type: "date",
          required: false,
        },
        {
          key: "planEndDate",
          label: "计划结束日期",
          type: "date",
          required: false,
        },
      ]),
    },
  });

  console.log("Created work-order schema:", workOrderSchema);

  // 创建员工管理配置示例
  const employeeSchema = await prisma.schema.upsert({
    where: { name: "employee" },
    update: {
      category: "mes",
      systems: {
        connect: { id: mesSystem.id },
      },
      fields: JSON.stringify([
        {
          key: "empNo",
          label: "工号",
          type: "text",
          required: true,
        },
        {
          key: "name",
          label: "姓名",
          type: "text",
          required: true,
        },
        {
          key: "department",
          label: "部门",
          type: "select",
          required: true,
          options: [
            { label: "生产部", value: "production" },
            { label: "质检部", value: "quality" },
            { label: "仓储部", value: "warehouse" },
            { label: "设备部", value: "equipment" },
            { label: "行政部", value: "admin" },
          ],
        },
        {
          key: "position",
          label: "职位",
          type: "select",
          required: true,
          options: [
            { label: "普通员工", value: "staff" },
            { label: "组长", value: "leader" },
            { label: "主管", value: "supervisor" },
            { label: "经理", value: "manager" },
          ],
        },
        {
          key: "phone",
          label: "联系电话",
          type: "text",
          required: false,
        },
        {
          key: "hireDate",
          label: "入职日期",
          type: "date",
          required: true,
        },
        {
          key: "remark",
          label: "备注",
          type: "textarea",
          required: false,
        },
      ]),
    },
    create: {
      name: "employee",
      entity: "Employee",
      category: "mes",
      systems: {
        connect: { id: mesSystem.id },
      },
      fields: JSON.stringify([
        {
          key: "empNo",
          label: "工号",
          type: "text",
          required: true,
        },
        {
          key: "name",
          label: "姓名",
          type: "text",
          required: true,
        },
        {
          key: "department",
          label: "部门",
          type: "select",
          required: true,
          options: [
            { label: "生产部", value: "production" },
            { label: "质检部", value: "quality" },
            { label: "仓储部", value: "warehouse" },
            { label: "设备部", value: "equipment" },
            { label: "行政部", value: "admin" },
          ],
        },
        {
          key: "position",
          label: "职位",
          type: "select",
          required: true,
          options: [
            { label: "普通员工", value: "staff" },
            { label: "组长", value: "leader" },
            { label: "主管", value: "supervisor" },
            { label: "经理", value: "manager" },
          ],
        },
        {
          key: "phone",
          label: "联系电话",
          type: "text",
          required: false,
        },
        {
          key: "hireDate",
          label: "入职日期",
          type: "date",
          required: true,
        },
        {
          key: "remark",
          label: "备注",
          type: "textarea",
          required: false,
        },
      ]),
    },
  });

  console.log("Created employee schema:", employeeSchema);

  // 创建报工记录配置
  const workReportSchema = await prisma.schema.upsert({
    where: { name: "work-report" },
    update: {
      entity: "WorkReport",  // 更新为固定表实体
      category: "mes",
      systems: {
        connect: { id: mesSystem.id },
      },
      fields: JSON.stringify([
        {
          key: "workOrderId",
          label: "关联工单",
          type: "relation",
          required: true,
          relationConfig: {
            entity: "WorkOrder",
            labelFormat: "{orderNo} - {productName}",
            valueField: "id",
          },
        },
        {
          key: "workHours",
          label: "工时(小时)",
          type: "number",
          required: true,
        },
        {
          key: "quantity",
          label: "完成数量",
          type: "number",
          required: true,
        },
        {
          key: "reportDate",
          label: "报工日期",
          type: "date",
          required: true,
        },
        {
          key: "remarks",
          label: "备注",
          type: "textarea",
          required: false,
        },
      ]),
    },
    create: {
      name: "work-report",
      entity: "WorkReport",
      category: "mes",
      systems: {
        connect: { id: mesSystem.id },
      },
      fields: JSON.stringify([
        {
          key: "workOrderId",
          label: "关联工单",
          type: "relation",
          required: true,
          relationConfig: {
            entity: "WorkOrder",
            labelFormat: "{orderNo} - {productName}",
            valueField: "id",
          },
        },
        {
          key: "workHours",
          label: "工时(小时)",
          type: "number",
          required: true,
        },
        {
          key: "quantity",
          label: "完成数量",
          type: "number",
          required: true,
        },
        {
          key: "reportDate",
          label: "报工日期",
          type: "date",
          required: true,
        },
        {
          key: "remarks",
          label: "备注",
          type: "textarea",
          required: false,
        },
      ]),
    },
  });

  console.log("Created work-report schema:", workReportSchema);

  // 创建质检记录配置
  const qualityCheckSchema = await prisma.schema.upsert({
    where: { name: "quality-check" },
    update: {
      entity: "QualityCheck",  // 更新为固定表实体
      category: "mes",
      systems: {
        connect: { id: mesSystem.id },
      },
      fields: JSON.stringify([
        {
          key: "workOrderId",
          label: "关联工单",
          type: "relation",
          required: true,
          relationConfig: {
            entity: "WorkOrder",
            labelFormat: "{orderNo} - {productName}",
            valueField: "id",
          },
        },
        {
          key: "result",
          label: "检验结果",
          type: "select",
          required: true,
          options: [
            { label: "合格", value: "pass" },
            { label: "不合格", value: "fail" },
          ],
        },
        {
          key: "totalQty",
          label: "检验数量",
          type: "number",
          required: true,
        },
        {
          key: "passQty",
          label: "合格数量",
          type: "number",
          required: true,
        },
        {
          key: "failQty",
          label: "不良数量",
          type: "number",
          required: true,
        },
        {
          key: "checkDate",
          label: "质检日期",
          type: "date",
          required: true,
        },
        {
          key: "remarks",
          label: "备注",
          type: "textarea",
          required: false,
        },
      ]),
    },
    create: {
      name: "quality-check",
      entity: "QualityCheck",
      category: "mes",
      systems: {
        connect: { id: mesSystem.id },
      },
      fields: JSON.stringify([
        {
          key: "workOrderId",
          label: "关联工单",
          type: "relation",
          required: true,
          relationConfig: {
            entity: "WorkOrder",
            labelFormat: "{orderNo} - {productName}",
            valueField: "id",
          },
        },
        {
          key: "result",
          label: "检验结果",
          type: "select",
          required: true,
          options: [
            { label: "合格", value: "pass" },
            { label: "不合格", value: "fail" },
          ],
        },
        {
          key: "totalQty",
          label: "检验数量",
          type: "number",
          required: true,
        },
        {
          key: "passQty",
          label: "合格数量",
          type: "number",
          required: true,
        },
        {
          key: "failQty",
          label: "不良数量",
          type: "number",
          required: true,
        },
        {
          key: "checkDate",
          label: "质检日期",
          type: "date",
          required: true,
        },
        {
          key: "remarks",
          label: "备注",
          type: "textarea",
          required: false,
        },
      ]),
    },
  });

  console.log("Created quality-check schema:", qualityCheckSchema);

  // 创建设备管理配置
  const equipmentSchema = await prisma.schema.upsert({
    where: { name: "equipment" },
    update: {
      category: "mes",
      systems: {
        connect: { id: mesSystem.id },
      },
      fields: JSON.stringify([
        {
          key: "equipmentNo",
          label: "设备编号",
          type: "text",
          required: true,
        },
        {
          key: "equipmentName",
          label: "设备名称",
          type: "text",
          required: true,
        },
        {
          key: "category",
          label: "设备类别",
          type: "select",
          required: true,
          options: [
            { label: "冲压设备", value: "press" },
            { label: "注塑设备", value: "injection" },
            { label: "装配设备", value: "assembly" },
            { label: "检测设备", value: "inspection" },
            { label: "包装设备", value: "packaging" },
          ],
        },
        {
          key: "model",
          label: "型号",
          type: "text",
          required: false,
        },
        {
          key: "manufacturer",
          label: "制造商",
          type: "text",
          required: false,
        },
        {
          key: "status",
          label: "状态",
          type: "select",
          required: true,
          options: [
            { label: "空闲", value: "idle" },
            { label: "运行中", value: "running" },
            { label: "维护中", value: "maintenance" },
            { label: "故障", value: "fault" },
          ],
          defaultValue: "idle",
        },
        {
          key: "location",
          label: "所在位置",
          type: "text",
          required: false,
        },
        {
          key: "purchaseDate",
          label: "采购日期",
          type: "date",
          required: false,
        },
      ]),
    },
    create: {
      name: "equipment",
      entity: "Equipment",
      category: "mes",
      systems: {
        connect: { id: mesSystem.id },
      },
      fields: JSON.stringify([
        {
          key: "equipmentNo",
          label: "设备编号",
          type: "text",
          required: true,
        },
        {
          key: "equipmentName",
          label: "设备名称",
          type: "text",
          required: true,
        },
        {
          key: "category",
          label: "设备类别",
          type: "select",
          required: true,
          options: [
            { label: "冲压设备", value: "press" },
            { label: "注塑设备", value: "injection" },
            { label: "装配设备", value: "assembly" },
            { label: "检测设备", value: "inspection" },
            { label: "包装设备", value: "packaging" },
          ],
        },
        {
          key: "model",
          label: "型号",
          type: "text",
          required: false,
        },
        {
          key: "manufacturer",
          label: "制造商",
          type: "text",
          required: false,
        },
        {
          key: "status",
          label: "状态",
          type: "select",
          required: true,
          options: [
            { label: "空闲", value: "idle" },
            { label: "运行中", value: "running" },
            { label: "维护中", value: "maintenance" },
            { label: "故障", value: "fault" },
          ],
          defaultValue: "idle",
        },
        {
          key: "location",
          label: "所在位置",
          type: "text",
          required: false,
        },
        {
          key: "purchaseDate",
          label: "采购日期",
          type: "date",
          required: false,
        },
      ]),
    },
  });

  console.log("Created equipment schema:", equipmentSchema);

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
