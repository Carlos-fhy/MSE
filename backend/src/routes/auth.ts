import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
  changePassword,
  logout,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

// 公开路由（不需要认证）
router.post("/register", register);
router.post("/login", login);

// 受保护路由（需要认证）
router.get("/me", authenticate, getCurrentUser);
router.post("/change-password", authenticate, changePassword);
router.post("/logout", authenticate, logout);

export default router;
