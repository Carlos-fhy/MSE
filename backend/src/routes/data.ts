import { Router } from "express";
import { getAll, getById, create, update, deleteRecord } from "../controllers/dataController";
import { authenticate, requirePermissions } from "../middleware/auth";

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// GET /api/data/:entity - Get all records
router.get("/:entity", requirePermissions("data:read"), getAll);

// GET /api/data/:entity/:id - Get single record
router.get("/:entity/:id", requirePermissions("data:read"), getById);

// POST /api/data/:entity - Create new record
router.post("/:entity", requirePermissions("data:create"), create);

// PUT /api/data/:entity/:id - Update record
router.put("/:entity/:id", requirePermissions("data:update"), update);

// DELETE /api/data/:entity/:id - Delete record
router.delete("/:entity/:id", requirePermissions("data:delete"), deleteRecord);

export default router;
