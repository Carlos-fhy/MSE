import { Form, Input, InputNumber, DatePicker, Select } from "antd";
import { useState, useEffect } from "react";
import type { SchemaField } from "../types/schema";
import { dataService } from "../services/dataService";
import dayjs from "dayjs";

interface DynamicFormProps {
  fields: SchemaField[];
  initialValues?: Record<string, any>;
  onValuesChange?: (values: Record<string, any>) => void;
}

export default function DynamicForm({
  fields,
  initialValues,
  onValuesChange,
}: DynamicFormProps) {
  // 存储关联数据
  const [relationData, setRelationData] = useState<Record<string, any[]>>({});
  const [loadingRelations, setLoadingRelations] = useState<Record<string, boolean>>({});

  // 加载关联数据
  useEffect(() => {
    const loadRelationData = async () => {
      for (const field of fields) {
        if (field.type === "relation" && field.relationConfig) {
          const { entity } = field.relationConfig;

          // 如果已经加载过，跳过
          if (relationData[field.key]) continue;

          setLoadingRelations(prev => ({ ...prev, [field.key]: true }));

          try {
            // 加载所有关联实体数据（不分页）
            const result = await dataService.getAll(entity, 1, 1000);
            setRelationData(prev => ({
              ...prev,
              [field.key]: result.data,
            }));
          } catch (error) {
            console.error(`Failed to load relation data for ${field.key}:`, error);
            setRelationData(prev => ({
              ...prev,
              [field.key]: [],
            }));
          } finally {
            setLoadingRelations(prev => ({ ...prev, [field.key]: false }));
          }
        }
      }
    };

    loadRelationData();
  }, [fields]);

  // 格式化关联字段显示文本
  const formatRelationLabel = (data: any, format: string): string => {
    return format.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  };

  const renderField = (field: SchemaField) => {
    // 转换日期字符串为 dayjs 对象
    let initialValue = initialValues?.[field.key];
    if (field.type === "date" && initialValue && typeof initialValue === "string") {
      initialValue = dayjs(initialValue);
    }

    const commonProps = {
      placeholder: `请输入${field.label}`,
    };

    switch (field.type) {
      case "text":
        return <Input {...commonProps} />;

      case "number":
        return <InputNumber {...commonProps} style={{ width: "100%" }} />;

      case "date":
        return <DatePicker placeholder={`请选择${field.label}`} style={{ width: "100%" }} />;

      case "select":
        return (
          <Select placeholder={`请选择${field.label}`}>
            {field.options?.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );

      case "relation":
        if (!field.relationConfig) {
          return <Input {...commonProps} disabled placeholder="关联配置错误" />;
        }

        const options = relationData[field.key] || [];
        const isLoading = loadingRelations[field.key] || false;

        return (
          <Select
            placeholder={`请选择${field.label}`}
            showSearch
            loading={isLoading}
            filterOption={(input, option) =>
              (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
            }
            options={options.map((item) => ({
              label: formatRelationLabel(item, field.relationConfig!.labelFormat),
              value: item[field.relationConfig!.valueField],
            }))}
          />
        );

      case "textarea":
        return <Input.TextArea {...commonProps} rows={4} />;

      default:
        return <Input {...commonProps} />;
    }
  };

  return (
    <>
      {fields.map((field) => (
        <Form.Item
          key={field.key}
          name={field.key}
          label={field.label}
          rules={[
            {
              required: field.required,
              message: `请输入${field.label}`,
            },
          ]}
          initialValue={
            initialValues?.[field.key] !== undefined
              ? field.type === "date" && typeof initialValues[field.key] === "string"
                ? dayjs(initialValues[field.key])
                : initialValues[field.key]
              : field.defaultValue
          }
        >
          {renderField(field)}
        </Form.Item>
      ))}
    </>
  );
}
