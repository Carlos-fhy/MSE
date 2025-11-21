import { Request, Response } from "express";
import prisma from "../utils/prisma";

// 预定义的 Prisma 模型列表
const PRISMA_MODELS = [
  "user",
  "role",
  "workOrder",
  "workReport",
  "qualityCheck",
  "equipment",
  "maintenanceRecord",
  "equipmentStatusLog",
  "schema",
  "dataRecord",
];

// 不同模型的用户ID字段映射
const USER_ID_FIELDS: Record<string, string> = {
  workOrder: "createdBy",
  workReport: "userId",
  qualityCheck: "inspectorId",
  maintenanceRecord: "technicianId",
};

// 关系字段映射：外键字段 -> 关系字段名
const RELATION_FIELDS: Record<string, Record<string, string>> = {
  workReport: {
    workOrderId: "workOrder",
    userId: "user",
    systemId: "system",
  },
  qualityCheck: {
    workOrderId: "workOrder",
    inspectorId: "inspector",
    systemId: "system",
  },
  workOrder: {
    equipmentId: "equipment",
    createdBy: "creator",
    systemId: "system",
  },
  maintenanceRecord: {
    equipmentId: "equipment",
    technicianId: "technician",
    systemId: "system",
  },
  equipmentStatusLog: {
    equipmentId: "equipment",
    systemId: "system",
  },
  equipment: {
    systemId: "system",
  },
  user: {
    roleId: "role",
    systemId: "system",
  },
  role: {
    systemId: "system",
  },
};

// 检查是否是预定义的 Prisma 模型
function isPrismaModel(entity: string): boolean {
  const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
  return PRISMA_MODELS.includes(modelName);
}

// 获取 Prisma 模型
function getModel(entity: string): any {
  const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
  return (prisma as any)[modelName];
}

// 检查用户是否有全量数据访问权限
function hasFullDataAccess(permissions: string[]): boolean {
  return (
    permissions.includes("*") ||
    permissions.includes("data:*") ||
    permissions.includes("data:admin")
  );
}

// GET /api/data/:entity - 获取所有记录（分页）
export const getAll = async (req: Request, res: Response) => {
  try {
    const { entity } = req.params;
    const { page = "1", pageSize = "10", sortBy, sortOrder = "desc" } = req.query;

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * pageSizeNum;

    // 如果是预定义模型，使用原来的逻辑
    if (isPrismaModel(entity)) {
      const model = getModel(entity);
      if (!model) {
        return res.status(404).json({
          success: false,
          error: `Entity ${entity} not found`,
        });
      }

      const queryOptions: any = {
        skip,
        take: pageSizeNum,
      };

      // 系统隔离：只能查看本系统的数据
      const where: any = {};
      if (req.user?.systemId) {
        where.systemId = req.user.systemId;
      }

      // 如果有where条件，添加到queryOptions
      if (Object.keys(where).length > 0) {
        queryOptions.where = where;
      }

      if (sortBy) {
        queryOptions.orderBy = { [sortBy as string]: sortOrder };
      } else {
        queryOptions.orderBy = { createdAt: "desc" };
      }

      // 添加关联查询：WorkReport 和 QualityCheck 需要include workOrder
      const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
      if (modelName === "workReport") {
        queryOptions.include = {
          workOrder: {
            select: { id: true, orderNo: true, productName: true },
          },
          user: {
            select: { id: true, realName: true },
          },
        };
      } else if (modelName === "qualityCheck") {
        queryOptions.include = {
          workOrder: {
            select: { id: true, orderNo: true, productName: true },
          },
          inspector: {
            select: { id: true, realName: true },
          },
        };
      }

      const [data, total] = await Promise.all([
        model.findMany(queryOptions),
        model.count(Object.keys(where).length > 0 ? { where } : {}),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      });
    }

    // 动态实体，使用 DataRecord 表
    // 实现数据隔离：按系统ID过滤，只显示同系统的数据
    const where: any = { entity };

    // 系统隔离：必须有systemId，且只能看到本系统的数据
    if (req.user?.systemId) {
      where.systemId = req.user.systemId;
    }

    // 如果用户没有全量访问权限，还要只能看到自己创建的数据
    if (req.user && !hasFullDataAccess(req.user.permissions)) {
      where.createdBy = req.user.id;
    }

    const [records, total] = await Promise.all([
      prisma.dataRecord.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.dataRecord.count({
        where,
      }),
    ]);

    // 解析 JSON 数据
    const data = records.map((record) => ({
      id: record.id,
      ...JSON.parse(record.data),
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET /api/data/:entity/:id - 获取单条记录
export const getById = async (req: Request, res: Response) => {
  try {
    const { entity, id } = req.params;

    // 如果是预定义模型
    if (isPrismaModel(entity)) {
      const model = getModel(entity);
      if (!model) {
        return res.status(404).json({
          success: false,
          error: `Entity ${entity} not found`,
        });
      }

      const data = await model.findUnique({
        where: { id },
      });

      if (!data) {
        return res.status(404).json({
          success: false,
          error: "Record not found",
        });
      }

      // 系统隔离检查：必须属于同一系统
      if (req.user?.systemId && data.systemId !== req.user.systemId) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to access this record (different system)",
        });
      }

      return res.json({
        success: true,
        data,
      });
    }

    // 动态实体 - 实现数据隔离
    const record = await prisma.dataRecord.findUnique({
      where: { id },
    });

    if (!record || record.entity !== entity) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    // 系统隔离检查：必须属于同一系统
    if (req.user?.systemId && record.systemId !== req.user.systemId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to access this record (different system)",
      });
    }

    // 权限检查：只读用户只能查看自己创建的数据
    if (req.user && !hasFullDataAccess(req.user.permissions)) {
      if (record.createdBy !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to access this record",
        });
      }
    }

    const data = {
      id: record.id,
      ...JSON.parse(record.data),
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// POST /api/data/:entity - 创建新记录
export const create = async (req: Request, res: Response) => {
  try {
    const { entity } = req.params;
    const body = req.body;

    // 如果是预定义模型
    if (isPrismaModel(entity)) {
      const model = getModel(entity);
      if (!model) {
        return res.status(404).json({
          success: false,
          error: `Entity ${entity} not found`,
        });
      }

      const processedData = processDateFields(body);

      // 自动填充用户ID字段（如果模型有对应字段且请求体中未提供）
      const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
      const userIdField = USER_ID_FIELDS[modelName];

      if (userIdField && !processedData[userIdField] && req.user?.id) {
        processedData[userIdField] = req.user.id;
      }

      // 自动填充systemId（必需字段）
      // 优先使用请求体中的systemId，否则使用用户的systemId
      if (!processedData.systemId) {
        if (!req.user?.systemId) {
          return res.status(400).json({
            success: false,
            error: "用户未关联到任何系统，且未在请求中指定systemId",
          });
        }
        processedData.systemId = req.user.systemId;
      }

      // 处理关系字段：将外键转换为 Prisma 关系语法
      const finalData = processRelationFields(processedData, modelName);

      const data = await model.create({
        data: finalData,
      });

      return res.status(201).json({
        success: true,
        data,
      });
    }

    // 动态实体，存储到 DataRecord，并记录创建者和系统ID
    // 获取 systemId（优先使用请求体中的，否则使用用户的）
    const systemId = body.systemId || req.user?.systemId;
    if (!systemId) {
      return res.status(400).json({
        success: false,
        error: "用户未关联到任何系统，且未在请求中指定systemId",
      });
    }

    const record = await prisma.dataRecord.create({
      data: {
        entity,
        data: JSON.stringify(body),
        system: {
          connect: { id: systemId }, // 使用关系语法
        },
        createdBy: req.user?.id, // createdBy 是普通字符串字段，直接传递
      },
    });

    const data = {
      id: record.id,
      ...body,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Create error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// PUT /api/data/:entity/:id - 更新记录
export const update = async (req: Request, res: Response) => {
  try {
    const { entity, id } = req.params;
    const body = req.body;

    // 如果是预定义模型
    if (isPrismaModel(entity)) {
      const model = getModel(entity);
      if (!model) {
        return res.status(404).json({
          success: false,
          error: `Entity ${entity} not found`,
        });
      }

      // 先获取现有记录以验证systemId
      const existing = await model.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Record not found",
        });
      }

      // 系统隔离检查：必须属于同一系统
      if (req.user?.systemId && existing.systemId !== req.user.systemId) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to update this record (different system)",
        });
      }

      const { id: _, ...updateData } = body;
      const processedData = processDateFields(updateData);

      // 获取模型名称并处理关系字段
      const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
      const finalData = processRelationFields(processedData, modelName);

      const data = await model.update({
        where: { id },
        data: finalData,
      });

      return res.json({
        success: true,
        data,
      });
    }

    // 动态实体 - 权限检查
    const existingRecord = await prisma.dataRecord.findUnique({
      where: { id },
    });

    if (!existingRecord || existingRecord.entity !== entity) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    // 系统隔离检查：必须属于同一系统
    if (req.user?.systemId && existingRecord.systemId !== req.user.systemId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to update this record (different system)",
      });
    }

    // 权限检查：只读用户只能修改自己创建的数据
    if (req.user && !hasFullDataAccess(req.user.permissions)) {
      if (existingRecord.createdBy !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to update this record",
        });
      }
    }

    // 移除系统字段
    const { id: _, createdAt, updatedAt, createdBy, ...updateData } = body;

    const record = await prisma.dataRecord.update({
      where: { id },
      data: {
        data: JSON.stringify(updateData),
      },
    });

    const data = {
      id: record.id,
      ...updateData,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// DELETE /api/data/:entity/:id - 删除记录
export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const { entity, id } = req.params;

    // 如果是预定义模型
    if (isPrismaModel(entity)) {
      const model = getModel(entity);
      if (!model) {
        return res.status(404).json({
          success: false,
          error: `Entity ${entity} not found`,
        });
      }

      // 先获取现有记录以验证systemId
      const existing = await model.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Record not found",
        });
      }

      // 系统隔离检查：必须属于同一系统
      if (req.user?.systemId && existing.systemId !== req.user.systemId) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to delete this record (different system)",
        });
      }

      await model.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: "Record deleted successfully",
      });
    }

    // 动态实体 - 权限检查
    const existingRecord = await prisma.dataRecord.findUnique({
      where: { id },
    });

    if (!existingRecord || existingRecord.entity !== entity) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    // 系统隔离检查：必须属于同一系统
    if (req.user?.systemId && existingRecord.systemId !== req.user.systemId) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to delete this record (different system)",
      });
    }

    // 权限检查：只有拥有删除权限且是创建者或有全量访问权限的用户才能删除
    if (req.user && !hasFullDataAccess(req.user.permissions)) {
      if (existingRecord.createdBy !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to delete this record",
        });
      }
    }

    await prisma.dataRecord.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// 处理日期字段
function processDateFields(data: any): any {
  const processed = { ...data };

  for (const key in processed) {
    const value = processed[key];
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {
      processed[key] = new Date(value);
    }
  }

  return processed;
}

// 处理关系字段：将外键字段转换为 Prisma 关系语法
function processRelationFields(data: any, modelName: string): any {
  const processed = { ...data };
  const relations = RELATION_FIELDS[modelName];

  if (!relations) {
    return processed;
  }

  for (const [foreignKey, relationName] of Object.entries(relations)) {
    if (processed[foreignKey]) {
      // 将外键转换为关系语法
      processed[relationName] = {
        connect: { id: processed[foreignKey] },
      };
      // 删除原始外键字段
      delete processed[foreignKey];
    }
  }

  return processed;
}
