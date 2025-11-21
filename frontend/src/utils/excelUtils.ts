import * as XLSX from "xlsx";
import type { Field } from "../types/schema";

/**
 * 将数据导出为 Excel 文件
 * @param data 数据数组
 * @param fields 字段定义
 * @param filename 文件名
 */
export function exportToExcel(data: any[], fields: Field[], filename: string) {
  // 构建表头（使用字段的 label）
  const headers = fields.map((field) => field.label);

  // 构建数据行（使用字段的 key）
  const rows = data.map((item) =>
    fields.map((field) => {
      const value = item[field.key];
      // 格式化日期
      if (field.type === "date" && value) {
        return new Date(value).toLocaleDateString("zh-CN");
      }
      // 格式化选择框
      if (field.type === "select" && value && field.options) {
        const option = field.options.find((opt) => opt.value === value);
        return option ? option.label : value;
      }
      return value ?? "";
    })
  );

  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 设置列宽
  const colWidths = fields.map((field) => ({
    wch: Math.max(field.label.length * 2, 15),
  }));
  worksheet["!cols"] = colWidths;

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "数据");

  // 导出文件
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * 下载 Excel 模板
 * @param fields 字段定义
 * @param filename 文件名
 */
export function downloadTemplate(fields: Field[], filename: string) {
  // 构建表头
  const headers = fields.map((field) => field.label);

  // 构建示例数据行（展示数据格式）
  const exampleRow = fields.map((field) => {
    if (field.type === "text") return "示例文本";
    if (field.type === "number") return "100";
    if (field.type === "date") return "2024-01-01";
    if (field.type === "select" && field.options && field.options.length > 0) {
      return field.options[0].label;
    }
    if (field.type === "textarea") return "示例多行文本";
    return "";
  });

  // 构建字段说明行
  const descriptionRow = fields.map((field) => {
    let desc = field.type;
    if (field.required) desc += " (必填)";
    if (field.type === "select" && field.options) {
      desc += ` [${field.options.map((opt) => opt.label).join("/")}]`;
    }
    return desc;
  });

  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    descriptionRow,
    exampleRow,
  ]);

  // 设置列宽
  const colWidths = fields.map((field) => ({
    wch: Math.max(field.label.length * 2, 20),
  }));
  worksheet["!cols"] = colWidths;

  // 设置第一行样式（表头）
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "CCCCCC" } },
    };
  }

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "模板");

  // 导出文件
  XLSX.writeFile(workbook, `${filename}_模板.xlsx`);
}

/**
 * 从 Excel 文件读取数据
 * @param file Excel 文件
 * @param fields 字段定义
 * @returns 解析后的数据数组和错误信息
 */
export async function importFromExcel(
  file: File,
  fields: Field[]
): Promise<{ data: any[]; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // 读取第一个工作表
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 将工作表转换为 JSON
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });

        if (jsonData.length < 2) {
          resolve({
            data: [],
            errors: ["Excel 文件为空或格式不正确"],
          });
          return;
        }

        // 第一行是表头
        const headers: string[] = jsonData[0];

        // 创建表头到字段 key 的映射
        const headerToKey: Record<string, string> = {};
        fields.forEach((field) => {
          const headerIndex = headers.findIndex((h) => h === field.label);
          if (headerIndex !== -1) {
            headerToKey[field.label] = field.key;
          }
        });

        // 解析数据行（跳过表头和说明行）
        const parsedData: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          // 跳过空行
          if (!jsonData[i] || jsonData[i].every((cell) => !cell)) continue;

          // 跳过说明行（第二行通常是字段说明）
          if (i === 1 && jsonData[i][0] && String(jsonData[i][0]).includes("(")) {
            continue;
          }

          const row = jsonData[i];
          const item: Record<string, any> = {};
          let hasError = false;

          // 解析每个字段
          fields.forEach((field, index) => {
            const cellValue = row[index];
            const value = cellValue !== undefined && cellValue !== null ? String(cellValue).trim() : "";

            // 必填校验
            if (field.required && !value) {
              errors.push(`第 ${i + 1} 行：${field.label} 为必填项`);
              hasError = true;
              return;
            }

            // 类型转换和校验
            if (value) {
              if (field.type === "number") {
                const numValue = Number(value);
                if (isNaN(numValue)) {
                  errors.push(`第 ${i + 1} 行：${field.label} 必须是数字`);
                  hasError = true;
                  return;
                }
                item[field.key] = numValue;
              } else if (field.type === "date") {
                // 尝试解析日期
                const dateValue = new Date(value);
                if (isNaN(dateValue.getTime())) {
                  errors.push(
                    `第 ${i + 1} 行：${field.label} 日期格式不正确`
                  );
                  hasError = true;
                  return;
                }
                item[field.key] = dateValue.toISOString().split("T")[0];
              } else if (field.type === "select") {
                // 验证选择值
                if (field.options) {
                  const option = field.options.find(
                    (opt) => opt.label === value || opt.value === value
                  );
                  if (!option) {
                    errors.push(
                      `第 ${i + 1} 行：${field.label} 的值不在可选范围内`
                    );
                    hasError = true;
                    return;
                  }
                  item[field.key] = option.value;
                } else {
                  item[field.key] = value;
                }
              } else {
                item[field.key] = value;
              }
            }
          });

          if (!hasError) {
            parsedData.push(item);
          }
        }

        resolve({ data: parsedData, errors });
      } catch (error: any) {
        resolve({
          data: [],
          errors: [`解析 Excel 文件失败：${error.message}`],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        data: [],
        errors: ["读取文件失败"],
      });
    };

    reader.readAsBinaryString(file);
  });
}
