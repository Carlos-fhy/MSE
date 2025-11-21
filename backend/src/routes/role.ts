import { Router } from "express";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roleController";
import { authenticate, requirePermissions } from "../middleware/auth";

const router = Router();

// 所有角色路由都需要认证
router.use(authenticate);

// 角色管理路由
router.get("/", getAllRoles);
router.get("/:id", getRoleById);
router.post("/", requirePermissions("role:create"), createRole);
router.put("/:id", requirePermissions("role:update"), updateRole);
router.delete("/:id", requirePermissions("role:delete"), deleteRole);

export default router;
