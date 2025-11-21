import { Router } from "express";
import * as systemController from "../controllers/systemController";
import { optionalAuthenticate, authenticate, requirePermissions } from "../middleware/auth";

const router = Router();

// GET /api/systems - 获取所有系统（公开接口，用于系统选择）
router.get("/", optionalAuthenticate, systemController.getAll);

// GET /api/systems/:id - 获取单个系统（公开接口）
router.get("/:id", optionalAuthenticate, systemController.getById);

// POST /api/systems - 创建系统（公开接口，支持自助注册）
router.post("/", systemController.create);

// PUT /api/systems/:id - 更新系统（需要超级管理员或系统管理员权限）
router.put("/:id", authenticate, requirePermissions("system:update"), systemController.update);

// DELETE /api/systems/:id - 删除系统（需要超级管理员或该系统的系统管理员权限）
router.delete("/:id", authenticate, systemController.deleteSystem);

export default router;
