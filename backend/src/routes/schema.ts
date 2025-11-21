import { Router } from "express";
import {
  getAllSchemas,
  getSchemaById,
  getSchemaByName,
  createSchema,
  updateSchema,
  deleteSchema,
} from "../controllers/schemaController";
import { optionalAuthenticate } from "../middleware/auth";

const router = Router();

// 平台级配置管理，不需要强制认证和权限控制
// GET /api/schemas - 获取所有 Schema
router.get("/", optionalAuthenticate, getAllSchemas);

// GET /api/schemas/name/:name - 根据 name 获取 Schema
router.get("/name/:name", optionalAuthenticate, getSchemaByName);

// GET /api/schemas/:id - 根据 ID 获取 Schema
router.get("/:id", optionalAuthenticate, getSchemaById);

// POST /api/schemas - 创建新 Schema（平台级功能，不需要权限）
router.post("/", optionalAuthenticate, createSchema);

// PUT /api/schemas/:id - 更新 Schema（平台级功能，不需要权限）
router.put("/:id", optionalAuthenticate, updateSchema);

// DELETE /api/schemas/:id - 删除 Schema（平台级功能，不需要权限）
router.delete("/:id", optionalAuthenticate, deleteSchema);

export default router;
