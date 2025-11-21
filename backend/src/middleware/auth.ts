import { Request, Response, NextFunction } from "express";
import { verifyToken, extractTokenFromHeader, JwtPayload } from "../utils/auth";
import prisma from "../utils/prisma";

// 扩展Express Request类型，添加user属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        roleId: string;
        systemId?: string;
        permissions: string[];
      };
    }
  }
}

/**
 * JWT认证中间件
 * 验证token并将用户信息附加到request对象
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 从请求头提取token
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        error: "未授权",
        message: "缺少认证token",
      });
    }

    // 验证token
    const payload: JwtPayload = verifyToken(token);

    // 从数据库获取用户完整信息（包括角色权限）
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "未授权",
        message: "用户不存在或已被禁用",
      });
    }

    // 解析角色权限
    const permissions: string[] = user.role.permissions
      ? JSON.parse(user.role.permissions)
      : [];

    // 将用户信息附加到request对象
    req.user = {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      systemId: user.systemId || undefined,
      permissions,
    };

    next();
  } catch (error: any) {
    return res.status(401).json({
      error: "未授权",
      message: error.message || "Token验证失败",
    });
  }
}

/**
 * 可选的认证中间件
 * 如果有token则验证，但不强制要求
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload: JwtPayload = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { role: true },
      });

      if (user && user.isActive) {
        const permissions: string[] = user.role.permissions
          ? JSON.parse(user.role.permissions)
          : [];

        req.user = {
          id: user.id,
          username: user.username,
          roleId: user.roleId,
          systemId: user.systemId || undefined,
          permissions,
        };
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next();
  }
}

/**
 * 检查用户是否拥有某个权限（支持通配符）
 * @param userPermissions 用户拥有的权限列表
 * @param requiredPermission 需要的权限
 */
function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.some((userPerm) => {
    // 完全匹配
    if (userPerm === requiredPermission) {
      return true;
    }

    // 通配符匹配：user:* 匹配 user:create, user:read 等
    if (userPerm.endsWith(":*")) {
      const prefix = userPerm.slice(0, -2); // 移除 ":*"
      return requiredPermission.startsWith(prefix + ":");
    }

    // 超级权限：* 匹配所有
    if (userPerm === "*") {
      return true;
    }

    return false;
  });
}

/**
 * 权限检查中间件工厂
 * @param requiredPermissions 需要的权限列表
 */
export function requirePermissions(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "未授权",
        message: "请先登录",
      });
    }

    const userPermissions = req.user.permissions;

    // 检查是否有所有必需的权限（支持通配符）
    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(userPermissions, permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        error: "禁止访问",
        message: "权限不足",
        requiredPermissions,
      });
    }

    next();
  };
}

/**
 * 系统访问检查中间件
 * 确保用户只能访问自己系统的数据（移除超级管理员特权，实现真正的多租户隔离）
 */
export function requireSystemAccess(systemIdParam: string = "systemId") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "未授权",
        message: "请先登录",
      });
    }

    const requestedSystemId = req.params[systemIdParam] || req.body[systemIdParam];

    // 所有用户都必须有 systemId（包括管理员）
    if (!req.user.systemId) {
      return res.status(403).json({
        error: "禁止访问",
        message: "用户未关联到任何系统",
      });
    }

    // 用户只能访问自己的系统
    if (req.user.systemId !== requestedSystemId) {
      return res.status(403).json({
        error: "禁止访问",
        message: "无权访问此系统",
      });
    }

    next();
  };
}
