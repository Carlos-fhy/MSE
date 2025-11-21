import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// JWT密钥 - 生产环境应该从环境变量读取
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// 密码加密的盐轮数
const SALT_ROUNDS = 10;

/**
 * 加密密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * JWT载荷接口
 */
export interface JwtPayload {
  userId: string;
  username: string;
  roleId: string;
  systemId?: string;
}

/**
 * 生成JWT Token
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * 验证JWT Token
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * 从请求头中提取token
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  // 支持两种格式：
  // 1. Authorization: Bearer <token>
  // 2. Authorization: <token>
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }

  return null;
}
