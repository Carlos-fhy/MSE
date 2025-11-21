import { Router } from "express";
import * as dashboardController from "../controllers/dashboardController";
import { optionalAuthenticate } from "../middleware/auth";

const router = Router();

// GET /api/dashboard/stats - 获取统计数据
router.get("/stats", optionalAuthenticate, dashboardController.getStats);

// GET /api/dashboard/trends - 获取趋势数据
router.get("/trends", optionalAuthenticate, dashboardController.getTrends);

// GET /api/dashboard/gantt - 获取甘特图数据
router.get("/gantt", optionalAuthenticate, dashboardController.getGanttData);

export default router;
