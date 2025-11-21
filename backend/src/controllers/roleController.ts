import { Request, Response } from "express";
import prisma from "../utils/prisma";

/**
 * 获取所有角色
 */
export async function getAllRoles(req: Request, res: Response) {
  try {
    const { systemId } = req.query;

    const where: any = {};

    // 如果指定了systemId，只返回该系统的角色
    if (systemId) {
      where.OR = [
        { systemId: systemId as string },
        { systemId: null }, // 包含全局角色
      ];
    }

    const roles = await prisma.role.findMany({
      where,
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(roles);
  } catch (error: any) {
    console.error("获取角色列表失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 获取单个角色
 */
export async function getRoleById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            realName: true,
            isActive: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        error: "角色不存在",
        message: `角色ID "${id}" 不存在`,
      });
    }

    res.json(role);
  } catch (error: any) {
    console.error("获取角色失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 创建角色
 */
export async function createRole(req: Request, res: Response) {
  try {
    const { name, description, permissions, systemId, isBuiltIn } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "参数错误",
        message: "角色名称为必填项",
      });
    }

    // 检查角色名是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return res.status(400).json({
        error: "角色名已存在",
        message: `角色名 "${name}" 已被使用`,
      });
    }

    // 验证permissions格式（应该是数组）
    let permissionsJson = "[]";
    if (permissions) {
      if (Array.isArray(permissions)) {
        permissionsJson = JSON.stringify(permissions);
      } else if (typeof permissions === "string") {
        try {
          JSON.parse(permissions);
          permissionsJson = permissions;
        } catch {
          return res.status(400).json({
            error: "参数错误",
            message: "permissions必须是有效的JSON数组",
          });
        }
      }
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionsJson,
        systemId,
        isBuiltIn: isBuiltIn || false,
      },
    });

    res.status(201).json(role);
  } catch (error: any) {
    console.error("创建角色失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 更新角色
 */
export async function updateRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return res.status(404).json({
        error: "角色不存在",
        message: `角色ID "${id}" 不存在`,
      });
    }

    // 不允许修改内置角色的名称和权限
    if (existingRole.isBuiltIn) {
      return res.status(400).json({
        error: "操作被禁止",
        message: "不允许修改内置角色",
      });
    }

    // 如果修改了名称，检查新名称是否已存在
    if (name && name !== existingRole.name) {
      const roleWithSameName = await prisma.role.findUnique({
        where: { name },
      });

      if (roleWithSameName) {
        return res.status(400).json({
          error: "角色名已存在",
          message: `角色名 "${name}" 已被使用`,
        });
      }
    }

    // 验证permissions格式
    let permissionsJson = existingRole.permissions;
    if (permissions !== undefined) {
      if (Array.isArray(permissions)) {
        permissionsJson = JSON.stringify(permissions);
      } else if (typeof permissions === "string") {
        try {
          JSON.parse(permissions);
          permissionsJson = permissions;
        } catch {
          return res.status(400).json({
            error: "参数错误",
            message: "permissions必须是有效的JSON数组",
          });
        }
      }
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: permissionsJson,
      },
    });

    res.json(role);
  } catch (error: any) {
    console.error("更新角色失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 删除角色
 */
export async function deleteRole(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        error: "角色不存在",
        message: `角色ID "${id}" 不存在`,
      });
    }

    // 不允许删除内置角色
    if (role.isBuiltIn) {
      return res.status(400).json({
        error: "操作被禁止",
        message: "不允许删除内置角色",
      });
    }

    // 检查是否有用户关联此角色
    if (role._count.users > 0) {
      return res.status(400).json({
        error: "操作被禁止",
        message: `该角色下有 ${role._count.users} 个用户，无法删除`,
      });
    }

    await prisma.role.delete({
      where: { id },
    });

    res.json({
      message: "角色删除成功",
    });
  } catch (error: any) {
    console.error("删除角色失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}
