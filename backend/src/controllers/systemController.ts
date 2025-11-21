import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { hashPassword } from "../utils/auth";

// GET /api/systems - 获取所有系统
export const getAll = async (req: Request, res: Response) => {
  try {
    const systems = await prisma.system.findMany({
      include: {
        schemas: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 解析 schemas 中的 fields JSON
    const result = systems.map((system) => ({
      ...system,
      schemas: system.schemas.map((schema) => ({
        ...schema,
        fields: JSON.parse(schema.fields),
      })),
    }));

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET /api/systems/:id - 获取单个系统
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const system = await prisma.system.findUnique({
      where: { id },
      include: {
        schemas: true,
      },
    });

    if (!system) {
      return res.status(404).json({
        success: false,
        error: "System not found",
      });
    }

    const result = {
      ...system,
      schemas: system.schemas.map((schema) => ({
        ...schema,
        fields: JSON.parse(schema.fields),
      })),
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// POST /api/systems - 创建系统
export const create = async (req: Request, res: Response) => {
  try {
    const { name, description, isAuthEnabled, schemaIds, adminUsername, adminPassword } = req.body;

    // 生成默认管理员用户名和密码
    const defaultAdminUsername = adminUsername || "admin";
    const defaultAdminPassword = adminPassword || "admin123";

    // 使用事务确保要么全部成功，要么全部回滚
    const result = await prisma.$transaction(async (tx) => {
      const createData: any = {
        name,
        description,
        isAuthEnabled: isAuthEnabled ?? false,
      };

      // 如果提供了 schemaIds，关联应用配置
      if (schemaIds !== undefined && Array.isArray(schemaIds)) {
        createData.schemas = {
          connect: schemaIds.map((schemaId: string) => ({ id: schemaId })),
        };
      }

      // 创建系统
      const system = await tx.system.create({
        data: createData,
        include: {
          schemas: true,
        },
      });

      // 为新系统创建系统管理员角色（使用系统名称作为前缀确保唯一性）
      const adminRole = await tx.role.create({
        data: {
          name: `${system.name}-管理员`,
          description: `${system.name}的系统管理员`,
          permissions: JSON.stringify([
            "system:read",
            "system:update",
            "user:*",
            "role:read",
            "schema:*",
            "data:*"
          ]),
          systemId: system.id,
          isBuiltIn: false,
        },
      });

      // 创建默认管理员账号
      const hashedPassword = await hashPassword(defaultAdminPassword);
      const adminUser = await tx.user.create({
        data: {
          username: defaultAdminUsername,
          password: hashedPassword,
          realName: "系统管理员",
          email: `${defaultAdminUsername}@${system.name}.local`,
          roleId: adminRole.id,
          systemId: system.id,
          isActive: true,
        },
      });

      // 解析 schemas 中的 fields JSON
      return {
        ...system,
        schemas: system.schemas.map((schema) => ({
          ...schema,
          fields: JSON.parse(schema.fields),
        })),
        // 返回管理员凭据信息（仅在创建时返回）
        adminCredentials: {
          username: adminUser.username,
          password: defaultAdminPassword,
          message: "请妥善保管管理员密码，此信息仅显示一次",
        },
      };
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    // P2002: 唯一约束冲突
    if (error.code === "P2002") {
      // 根据冲突字段提供更具体的错误信息
      const target = error.meta?.target;
      if (target?.includes('name')) {
        return res.status(409).json({
          success: false,
          error: "System name already exists",
        });
      } else if (target?.includes('username')) {
        return res.status(409).json({
          success: false,
          error: "Admin username already exists in this system",
        });
      } else {
        return res.status(409).json({
          success: false,
          error: "Duplicate entry found",
        });
      }
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// PUT /api/systems/:id - 更新系统
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isAuthEnabled, schemaIds } = req.body;

    console.log("=== 收到系统更新请求 ===");
    console.log("系统ID:", id);
    console.log("请求体:", req.body);
    console.log("用户信息:", req.user);

    // 先获取现有系统数据，避免不必要的名称冲突检查
    const existingSystem = await prisma.system.findUnique({
      where: { id },
    });

    if (!existingSystem) {
      return res.status(404).json({
        success: false,
        error: "System not found",
      });
    }

    const updateData: any = {};

    // 只有当名称真的发生变化时才更新
    if (name !== undefined && name !== existingSystem.name) {
      // 检查新名称是否与其他系统冲突
      const nameExists = await prisma.system.findFirst({
        where: {
          name,
          id: { not: id },
        },
      });

      if (nameExists) {
        return res.status(409).json({
          success: false,
          error: "System name already exists",
        });
      }

      updateData.name = name;
    }

    if (description !== undefined) updateData.description = description;

    // 只有传入了 isAuthEnabled 才更新该字段
    // 前端会通过权限控制是否显示这个开关
    if (isAuthEnabled !== undefined) {
      console.log("检测到 isAuthEnabled 更新:", isAuthEnabled);
      updateData.isAuthEnabled = isAuthEnabled;
    }

    // 如果提供了 schemaIds，更新系统关联的应用配置
    if (schemaIds !== undefined && Array.isArray(schemaIds)) {
      updateData.schemas = {
        set: schemaIds.map((schemaId: string) => ({ id: schemaId })),
      };
    }

    console.log("准备更新的数据:", updateData);

    const system = await prisma.system.update({
      where: { id },
      data: updateData,
      include: {
        schemas: true,
      },
    });

    console.log("更新后的系统:", system);

    // 解析 schemas 中的 fields JSON
    const result = {
      ...system,
      schemas: system.schemas.map((schema) => ({
        ...schema,
        fields: JSON.parse(schema.fields),
      })),
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("=== 系统更新失败 ===");
    console.error("错误:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "System not found",
      });
    }

    // P2002 错误已经在前面提前处理了，这里只是保底
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "Unique constraint violation",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// DELETE /api/systems/:id - 删除系统
export const deleteSystem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // 检查系统是否存在
    const system = await prisma.system.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!system) {
      return res.status(404).json({
        success: false,
        error: "System not found",
      });
    }

    // 权限检查：
    // 1. 超级管理员（systemId为null或undefined）可以删除任何系统
    // 2. 系统管理员只能删除自己所属的系统
    const isSuperAdmin = !req.user.systemId; // null 或 undefined 都表示超级管理员
    const isSystemAdmin = req.user.systemId === id;

    if (!isSuperAdmin && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        error: "您无权删除此系统。只有超级管理员或该系统的管理员可以删除系统。",
      });
    }

    // 在多对多关系中，删除系统会自动删除关联表中的记录
    // Schema 本身不会被删除，只是取消关联
    // 关联的用户、角色等会通过 onDelete: Cascade 自动删除
    await prisma.system.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "System deleted successfully",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "System not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
