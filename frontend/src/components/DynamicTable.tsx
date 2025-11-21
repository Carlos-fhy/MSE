import { Table, Button, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { SchemaField } from "../types/schema";
import dayjs from "dayjs";

interface DynamicTableProps {
  fields: SchemaField[];
  dataSource: any[];
  loading?: boolean;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

export default function DynamicTable({
  fields,
  dataSource,
  loading,
  onEdit,
  onDelete,
  pagination,
}: DynamicTableProps) {
  // 格式化关联字段显示文本
  const formatRelationLabel = (data: any, format: string): string => {
    return format.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  };

  // 根据字段配置生成表格列
  const columns = fields.map((field) => ({
    title: field.label,
    dataIndex: field.key,
    key: field.key,
    render: (value: any, record: any) => {
      // 格式化不同类型
      if (value === null || value === undefined) {
        return "-";
      }

      switch (field.type) {
        case "date":
          return dayjs(value).format("YYYY-MM-DD");

        case "select":
          // 从选项中找到对应的标签
          const option = field.options?.find((opt) => opt.value === value);
          return option?.label || value;

        case "number":
          return typeof value === "number" ? value.toLocaleString() : value;

        case "relation":
          // 关联字段：从关联对象中提取数据
          if (field.relationConfig) {
            // 尝试从记录中找到关联对象
            // 例如：workOrderId -> workOrder
            const relationKey = field.key.replace(/Id$/, "");
            const relationObj = record[relationKey];

            if (relationObj && typeof relationObj === "object") {
              return formatRelationLabel(relationObj, field.relationConfig.labelFormat);
            }
          }
          // 如果没有找到关联对象，显示ID
          return value;

        default:
          return value;
      }
    },
  }));

  // 添加操作列
  if (onEdit || onDelete) {
    columns.push({
      title: "操作",
      key: "actions",
      dataIndex: "",
      render: (record: any) => (
        <Space>
          {onEdit && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              编辑
            </Button>
          )}
          {onDelete && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    });
  }

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      loading={loading}
      pagination={
        pagination
          ? {
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: pagination.onChange,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }
          : false
      }
    />
  );
}
