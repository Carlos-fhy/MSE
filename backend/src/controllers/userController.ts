import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { hashPassword } from "../utils/auth";

/**
 * 获取所有用户
 */
export async function getAllUsers(req: Request, res: Response) {
  try {
    const { systemId, roleId, isActive } = req.query;

    const where: any = {};

    // 根据systemId过滤
    if (systemId) {
      where.systemId = systemId as string;
    }

    // 根据roleId过滤
    if (roleId) {
      where.roleId = roleId as string;
    }

    // 根据isActive过滤
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    // 普通用户只能查看自己系统的用户
    if (req.user?.systemId) {
      where.systemId = req.user.systemId;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
        system: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 移除密码字段
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    res.json(usersWithoutPassword);
  } catch (error: any) {
    console.error("获取用户列表失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 获取单个用户
 */
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        system: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "用户不存在",
        message: `用户ID "${id}" 不存在`,
      });
    }

    // 普通用户只能查看自己系统的用户
    if (req.user?.systemId && user.systemId !== req.user.systemId) {
      return res.status(403).json({
        error: "权限不足",
        message: "无权查看此用户信息",
      });
    }

    // 移除密码字段
    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error("获取用户失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 创建用户
 */
export async function createUser(req: Request, res: Response) {
  try {
    let { username, password, realName, email, description, roleId, systemId } = req.body;

    // 验证必填字段
    if (!username || !password || !realName || !roleId) {
      return res.status(400).json({
        error: "参数错误",
        message: "用户名、密码、真实姓名和角色为必填项",
      });
    }

    // 如果当前用户有systemId，自动使用当前用户的systemId
    if (req.user?.systemId) {
      systemId = req.user.systemId;
    }

    // 验证角色是否存在，并检查权限层级
    const targetRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!targetRole) {
      return res.status(400).json({
        error: "角色不存在",
        message: "指定的角色ID不存在",
      });
    }

    // 权限层级检查：只能分配权限等级低于自己的角色
    if (req.user) {
      const creatorRole = await prisma.role.findUnique({
        where: { id: req.user.roleId },
      });

      if (creatorRole) {
        // 不允许创建与自己相同角色的用户
        if (targetRole.id === creatorRole.id) {
          return res.status(403).json({
            error: "权限不足",
            message: "不能创建与自己相同角色的用户",
          });
        }

        const creatorPermissions = JSON.parse(creatorRole.permissions) as string[];
        const targetPermissions = JSON.parse(targetRole.permissions) as string[];

        // 超级管理员可以分配任何角色
        if (!creatorPermissions.includes("*")) {
          // 检查目标角色的每个权限是否被创建者拥有
          const hasAllPermissions = targetPermissions.every((targetPerm: string) => {
            // 如果目标角色有超级权限，但创建者没有，则不允许
            if (targetPerm === "*") return false;

            // 检查创建者是否有对应的权限
            return creatorPermissions.some((creatorPerm: string) => {
              if (creatorPerm === "*") return true;
              if (creatorPerm === targetPerm) return true;
              // 检查通配符权限，如 user:* 包含 user:read
              const [creatorResource, creatorAction] = creatorPerm.split(":");
              const [targetResource, targetAction] = targetPerm.split(":");
              if (creatorResource === targetResource && creatorAction === "*") return true;
              return false;
            });
          });

          if (!hasAllPermissions) {
            return res.status(403).json({
              error: "权限不足",
              message: "只能分配权限等级低于自己的角色",
            });
          }
        }
      }
    }

    // 检查用户名是否已存在（在同一系统内）
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        systemId,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "用户名已存在",
        message: `用户名 "${username}" 在此系统中已被使用`,
      });
    }

    // 如果指定了系统ID，验证系统是否存在
    if (systemId) {
      const system = await prisma.system.findUnique({
        where: { id: systemId },
      });

      if (!system) {
        return res.status(400).json({
          error: "系统不存在",
          message: "指定的系统ID不存在",
        });
      }
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        email,
        description,
        roleId,
        systemId,
      },
      include: {
        role: true,
        system: true,
      },
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    console.error("创建用户失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 更新用户
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username, realName, email, description, roleId, systemId, isActive } = req.body;

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "用户不存在",
        message: `用户ID "${id}" 不存在`,
      });
    }

    // 普通用户只能更新自己系统的用户
    if (req.user?.systemId && existingUser.systemId !== req.user.systemId) {
      return res.status(403).json({
        error: "权限不足",
        message: "无权更新此用户信息",
      });
    }

    // 如果修改了用户名，检查新用户名是否已存在
    if (username && username !== existingUser.username) {
      const userWithSameUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (userWithSameUsername) {
        return res.status(400).json({
          error: "用户名已存在",
          message: `用户名 "${username}" 已被使用`,
        });
      }
    }

    // 验证角色是否存在，并检查权限层级
    if (roleId) {
      const targetRole = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!targetRole) {
        return res.status(400).json({
          error: "角色不存在",
          message: "指定的角色ID不存在",
        });
      }

      // 权限层级检查：只能分配权限等级低于自己的角色
      if (req.user) {
        const updaterRole = await prisma.role.findUnique({
          where: { id: req.user.roleId },
        });

        if (updaterRole) {
          // 不允许将用户角色修改为与自己相同的角色（除非是超级管理员）
          const updaterPermissions = JSON.parse(updaterRole.permissions) as string[];
          if (!updaterPermissions.includes("*") && targetRole.id === updaterRole.id) {
            return res.status(403).json({
              error: "权限不足",
              message: "不能将用户角色修改为与自己相同的角色",
            });
          }

          const targetPermissions = JSON.parse(targetRole.permissions) as string[];

          // 超级管理员可以分配任何角色
          if (!updaterPermissions.includes("*")) {
            // 检查目标角色的每个权限是否被更新者拥有
            const hasAllPermissions = targetPermissions.every((targetPerm: string) => {
              if (targetPerm === "*") return false;

              return updaterPermissions.some((updaterPerm: string) => {
                if (updaterPerm === "*") return true;
                if (updaterPerm === targetPerm) return true;
                const [updaterResource, updaterAction] = updaterPerm.split(":");
                const [targetResource, targetAction] = targetPerm.split(":");
                if (updaterResource === targetResource && updaterAction === "*") return true;
                return false;
              });
            });

            if (!hasAllPermissions) {
              return res.status(403).json({
                error: "权限不足",
                message: "只能分配权限等级低于自己的角色",
              });
            }
          }
        }
      }
    }

    // 验证系统是否存在
    if (systemId) {
      const system = await prisma.system.findUnique({
        where: { id: systemId },
      });

      if (!system) {
        return res.status(400).json({
          error: "系统不存在",
          message: "指定的系统ID不存在",
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        username,
        realName,
        email,
        description,
        roleId,
        systemId,
        isActive,
      },
      include: {
        role: true,
        system: true,
      },
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error("更新用户失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 删除用户
 */
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: "用户不存在",
        message: `用户ID "${id}" 不存在`,
      });
    }

    // 普通用户只能删除自己系统的用户
    if (req.user?.systemId && user.systemId !== req.user.systemId) {
      return res.status(403).json({
        error: "权限不足",
        message: "无权删除此用户",
      });
    }

    // 不允许删除自己
    if (req.user && user.id === req.user.id) {
      return res.status(400).json({
        error: "操作被禁止",
        message: "不允许删除自己的账号",
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      message: "用户删除成功",
    });
  } catch (error: any) {
    console.error("删除用户失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 重置用户密码（管理员功能）
 */
export async function resetUserPassword(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        error: "参数错误",
        message: "新密码为必填项",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "参数错误",
        message: "新密码长度不能少于6位",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: "用户不存在",
        message: `用户ID "${id}" 不存在`,
      });
    }

    // 普通用户只能重置自己系统的用户密码
    if (req.user?.systemId && user.systemId !== req.user.systemId) {
      return res.status(403).json({
        error: "权限不足",
        message: "无权重置此用户密码",
      });
    }

    // 加密新密码
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({
      message: "密码重置成功",
    });
  } catch (error: any) {
    console.error("重置密码失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}
