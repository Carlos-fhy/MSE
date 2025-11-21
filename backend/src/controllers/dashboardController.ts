import { Request, Response } from "express";
import prisma from "../utils/prisma";

// GET /api/dashboard/stats - 获取看板统计数据
export const getStats = async (req: Request, res: Response) => {
  try {
    const systemId = req.query.systemId as string;

    if (!systemId) {
      return res.status(400).json({
        success: false,
        error: "systemId is required",
      });
    }

    // 并行查询所有统计数据
    const [
      totalWorkOrders,
      pendingWorkOrders,
      inProgressWorkOrders,
      completedWorkOrders,
      totalEquipment,
      runningEquipment,
      maintenanceEquipment,
      faultEquipment,
      todayReports,
      todayQualityChecks,
      recentWorkOrders,
    ] = await Promise.all([
      // 工单统计
      prisma.workOrder.count({ where: { systemId } }),
      prisma.workOrder.count({ where: { systemId, status: "pending" } }),
      prisma.workOrder.count({ where: { systemId, status: "in_progress" } }),
      prisma.workOrder.count({ where: { systemId, status: "completed" } }),
      // 设备统计
      prisma.equipment.count({ where: { systemId } }),
      prisma.equipment.count({ where: { systemId, status: "running" } }),
      prisma.equipment.count({ where: { systemId, status: "maintenance" } }),
      prisma.equipment.count({ where: { systemId, status: "fault" } }),
      // 今日报工数
      prisma.workReport.count({
        where: {
          systemId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // 今日质检数
      prisma.qualityCheck.count({
        where: {
          systemId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // 最近工单
      prisma.workOrder.findMany({
        where: { systemId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          equipment: { select: { equipmentName: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        workOrders: {
          total: totalWorkOrders,
          pending: pendingWorkOrders,
          inProgress: inProgressWorkOrders,
          completed: completedWorkOrders,
          completionRate: totalWorkOrders > 0
            ? Math.round((completedWorkOrders / totalWorkOrders) * 100)
            : 0,
        },
        equipment: {
          total: totalEquipment,
          running: runningEquipment,
          maintenance: maintenanceEquipment,
          fault: faultEquipment,
          idle: totalEquipment - runningEquipment - maintenanceEquipment - faultEquipment,
        },
        today: {
          reports: todayReports,
          qualityChecks: todayQualityChecks,
        },
        recentWorkOrders,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET /api/dashboard/trends - 获取趋势数据（近7天）
export const getTrends = async (req: Request, res: Response) => {
  try {
    const systemId = req.query.systemId as string;

    if (!systemId) {
      return res.status(400).json({
        success: false,
        error: "systemId is required",
      });
    }

    // 获取近7天的日期
    const dates: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }

    // 获取近7天的报工数据
    const reportTrends = await Promise.all(
      dates.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const [count, totalHours, totalQty] = await Promise.all([
          prisma.workReport.count({
            where: {
              systemId,
              reportDate: {
                gte: date,
                lt: nextDate,
              },
            },
          }),
          prisma.workReport.aggregate({
            where: {
              systemId,
              reportDate: {
                gte: date,
                lt: nextDate,
              },
            },
            _sum: { workHours: true },
          }),
          prisma.workReport.aggregate({
            where: {
              systemId,
              reportDate: {
                gte: date,
                lt: nextDate,
              },
            },
            _sum: { quantity: true },
          }),
        ]);

        return {
          date: date.toISOString().split("T")[0],
          count,
          workHours: Math.round((totalHours._sum.workHours || 0) * 10) / 10,
          quantity: totalQty._sum.quantity || 0,
        };
      })
    );

    // 获取近7天的质检数据
    const qualityTrends = await Promise.all(
      dates.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const result = await prisma.qualityCheck.aggregate({
          where: {
            systemId,
            checkDate: {
              gte: date,
              lt: nextDate,
            },
          },
          _sum: {
            totalQty: true,
            passQty: true,
            failQty: true,
          },
          _count: true,
        });

        return {
          date: date.toISOString().split("T")[0],
          count: result._count,
          totalQty: result._sum.totalQty || 0,
          passQty: result._sum.passQty || 0,
          failQty: result._sum.failQty || 0,
          passRate: result._sum.totalQty
            ? Math.round((result._sum.passQty || 0) / result._sum.totalQty * 100)
            : 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        reportTrends,
        qualityTrends,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET /api/dashboard/gantt - 获取甘特图数据
export const getGanttData = async (req: Request, res: Response) => {
  try {
    const systemId = req.query.systemId as string;

    if (!systemId) {
      return res.status(400).json({
        success: false,
        error: "systemId is required",
      });
    }

    // 获取有计划日期的工单
    const workOrders = await prisma.workOrder.findMany({
      where: {
        systemId,
        planStartDate: { not: null },
        planEndDate: { not: null },
      },
      include: {
        equipment: { select: { equipmentName: true } },
      },
      orderBy: { planStartDate: "asc" },
      take: 30, // 限制数量
    });

    const tasks = workOrders.map((wo) => ({
      id: wo.id,
      name: `${wo.orderNo} - ${wo.productName}`,
      start: wo.planStartDate!.toISOString(),
      end: wo.planEndDate!.toISOString(),
      progress: wo.status === "completed" ? 100 : wo.status === "in_progress" ? 50 : 0,
      type: "task" as const,
      status: wo.status,
      priority: wo.priority,
      equipment: wo.equipment?.equipmentName || "未分配",
      quantity: wo.quantity,
    }));

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
