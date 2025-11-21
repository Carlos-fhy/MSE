import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from "../controllers/userController";
import { authenticate, requirePermissions } from "../middleware/auth";

const router = Router();

// 所有用户路由都需要认证
router.use(authenticate);

// 用户管理路由
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", requirePermissions("user:create"), createUser);
router.put("/:id", requirePermissions("user:update"), updateUser);
router.delete("/:id", requirePermissions("user:delete"), deleteUser);
router.post("/:id/reset-password", requirePermissions("user:update"), resetUserPassword);

export default router;
