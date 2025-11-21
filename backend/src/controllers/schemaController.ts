import { Request, Response } from "express";
import prisma from "../utils/prisma";

// 获取所有 Schema
export const getAllSchemas = async (req: Request, res: Response) => {
  try {
    const schemas = await prisma.schema.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({
      success: true,
      data: schemas.map((schema) => ({
        ...schema,
        fields: JSON.parse(schema.fields),
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// 根据 ID 获取单个 Schema
export const getSchemaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schema = await prisma.schema.findUnique({
      where: { id },
    });

    if (!schema) {
      return res.status(404).json({
        success: false,
        error: "Schema not found",
      });
    }

    res.json({
      success: true,
      data: {
        ...schema,
        fields: JSON.parse(schema.fields),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// 根据 name 获取 Schema
export const getSchemaByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const schema = await prisma.schema.findUnique({
      where: { name },
    });

    if (!schema) {
      return res.status(404).json({
        success: false,
        error: "Schema not found",
      });
    }

    res.json({
      success: true,
      data: {
        ...schema,
        fields: JSON.parse(schema.fields),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// 创建新 Schema
export const createSchema = async (req: Request, res: Response) => {
  try {
    const { name, entity, fields } = req.body;

    // 验证必填字段
    if (!name || !entity || !fields) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, entity, fields",
      });
    }

    // 验证 fields 是数组
    if (!Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        error: "Fields must be an array",
      });
    }

    // 创建 Schema
    const schema = await prisma.schema.create({
      data: {
        name,
        entity,
        fields: JSON.stringify(fields),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...schema,
        fields: JSON.parse(schema.fields),
      },
    });
  } catch (error: any) {
    // 处理唯一性约束错误
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "Schema name or entity already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// 更新 Schema
export const updateSchema = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, entity, fields } = req.body;

    // 构建更新数据
    const updateData: any = {};
    if (name) updateData.name = name;
    if (entity) updateData.entity = entity;
    if (fields) {
      if (!Array.isArray(fields)) {
        return res.status(400).json({
          success: false,
          error: "Fields must be an array",
        });
      }
      updateData.fields = JSON.stringify(fields);
    }

    // 更新 Schema
    const schema = await prisma.schema.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        ...schema,
        fields: JSON.parse(schema.fields),
      },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Schema not found",
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "Schema name or entity already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// 删除 Schema
export const deleteSchema = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.schema.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Schema deleted successfully",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Schema not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
