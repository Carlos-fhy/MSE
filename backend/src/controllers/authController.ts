import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";

/**
 * 用户注册
 */
export async function register(req: Request, res: Response) {
  try {
    const { username, password, realName, email, roleId, systemId } = req.body;

    // 验证必填字段
    if (!username || !password || !realName || !roleId) {
      return res.status(400).json({
        error: "参数错误",
        message: "用户名、密码、真实姓名和角色为必填项",
      });
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
        message: `用户名 "${username}" 已被使用`,
      });
    }

    // 验证角色是否存在
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return res.status(400).json({
        error: "角色不存在",
        message: "指定的角色ID不存在",
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

    res.status(201).json({
      message: "注册成功",
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error("注册失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 用户登录
 */
export async function login(req: Request, res: Response) {
  try {
    const { username, password, systemId } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        error: "参数错误",
        message: "用户名和密码为必填项",
      });
    }

    // 查找用户 - 先尝试查找指定系统的用户，如果找不到再查找超级管理员
    let user;
    if (systemId) {
      // 如果指定了systemId，先尝试使用复合唯一键查询该系统的用户
      user = await prisma.user.findUnique({
        where: {
          username_systemId: {
            username,
            systemId,
          },
        },
        include: {
          role: true,
          system: true,
        },
      });

      // 如果找不到，再尝试查找超级管理员（systemId为null）
      if (!user) {
        user = await prisma.user.findFirst({
          where: {
            username,
            systemId: null,
          },
          include: {
            role: true,
            system: true,
          },
        });
      }
    } else {
      // 如果没有指定systemId，只查找超级管理员（systemId为null）
      user = await prisma.user.findFirst({
        where: {
          username,
          systemId: null,
        },
        include: {
          role: true,
          system: true,
        },
      });
    }

    if (!user) {
      return res.status(401).json({
        error: "登录失败",
        message: "用户名或密码错误。如果您没有账号，请联系系统管理员创建。",
      });
    }

    // 检查用户是否被禁用
    if (!user.isActive) {
      return res.status(401).json({
        error: "登录失败",
        message: "账号已被禁用，请联系管理员",
      });
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "登录失败",
        message: "用户名或密码错误",
      });
    }

    // 如果指定了systemId，验证用户是否有权访问该系统
    if (systemId) {
      // 超级管理员（systemId为null）可以访问任何系统
      if (user.systemId && user.systemId !== systemId) {
        return res.status(403).json({
          error: "权限不足",
          message: "无权访问此系统",
        });
      }

      // 验证系统是否启用了认证
      const system = await prisma.system.findUnique({
        where: { id: systemId },
      });

      if (!system) {
        return res.status(404).json({
          error: "系统不存在",
          message: "指定的系统不存在",
        });
      }

      // 如果系统未启用认证，任何人都可以访问
      // 这里仍然返回token，但前端可以根据isAuthEnabled决定是否需要登录
    }

    // 生成JWT Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
      systemId: user.systemId || undefined,
    });

    // 解析权限
    const permissions: string[] = user.role.permissions
      ? JSON.parse(user.role.permissions)
      : [];

    // 返回用户信息和token（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "登录成功",
      token,
      user: {
        ...userWithoutPassword,
        permissions,
      },
    });
  } catch (error: any) {
    console.error("登录失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "未授权",
        message: "请先登录",
      });
    }

    // 从数据库获取最新的用户信息
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
        system: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "用户不存在",
        message: "用户信息未找到",
      });
    }

    // 解析权限
    const permissions: string[] = user.role.permissions
      ? JSON.parse(user.role.permissions)
      : [];

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: {
        ...userWithoutPassword,
        permissions,
      },
    });
  } catch (error: any) {
    console.error("获取用户信息失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 修改密码
 */
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "未授权",
        message: "请先登录",
      });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        error: "参数错误",
        message: "旧密码和新密码为必填项",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "参数错误",
        message: "新密码长度不能少于6位",
      });
    }

    // 获取用户当前密码
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({
        error: "用户不存在",
        message: "用户信息未找到",
      });
    }

    // 验证旧密码
    const isOldPasswordValid = await comparePassword(oldPassword, user.password);

    if (!isOldPasswordValid) {
      return res.status(400).json({
        error: "旧密码错误",
        message: "旧密码不正确",
      });
    }

    // 加密新密码
    const hashedNewPassword = await hashPassword(newPassword);

    // 更新密码
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    });

    res.json({
      message: "密码修改成功",
    });
  } catch (error: any) {
    console.error("修改密码失败:", error);
    res.status(500).json({
      error: "服务器错误",
      message: error.message,
    });
  }
}

/**
 * 登出（客户端删除token即可，这里只是提供一个端点）
 */
export async function logout(req: Request, res: Response) {
  res.json({
    message: "登出成功",
  });
}
