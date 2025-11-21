import { Form, Input, InputNumber, DatePicker, Select } from "antd";
import type { SchemaField } from "../types/schema";
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
