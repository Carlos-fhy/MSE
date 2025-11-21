import { Form, Input, Switch, Button, Space, Empty } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import type { SchemaField } from "../../types/schema";

interface PropertyPanelProps {
  field: SchemaField | null;
  onFieldChange: (field: SchemaField) => void;
}

export default function PropertyPanel({
  field,
  onFieldChange,
}: PropertyPanelProps) {
  if (!field) {
    return (
      <div
        style={{
          width: 280,
          padding: 16,
          backgroundColor: "#fafafa",
          borderLeft: "1px solid #f0f0f0",
          height: "100%",
        }}
      >
        <h3 style={{ marginBottom: 16 }}>属性</h3>
        <Empty description="请选择一个字段" />
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    onFieldChange({
      ...field,
      [key]: value,
    });
  };

  const handleOptionChange = (
    index: number,
    key: "label" | "value",
    value: string
  ) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = {
      ...newOptions[index],
      [key]: value,
    };
    onFieldChange({
      ...field,
      options: newOptions,
    });
  };

  const addOption = () => {
    const newOptions = [
      ...(field.options || []),
      { label: `选项${(field.options?.length || 0) + 1}`, value: `option${(field.options?.length || 0) + 1}` },
    ];
    onFieldChange({
      ...field,
      options: newOptions,
    });
  };

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index) || [];
    onFieldChange({
      ...field,
      options: newOptions,
    });
  };

  return (
    <div
      style={{
        width: 280,
        padding: 16,
        backgroundColor: "#fafafa",
        borderLeft: "1px solid #f0f0f0",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginBottom: 16 }}>属性</h3>
      <Form layout="vertical" size="small">
        <Form.Item label="字段标识">
          <Input
            value={field.key}
            onChange={(e) => handleChange("key", e.target.value)}
            placeholder="如: username"
          />
        </Form.Item>

        <Form.Item label="显示名称">
          <Input
            value={field.label}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="如: 用户名"
          />
        </Form.Item>

        <Form.Item label="是否必填">
          <Switch
            checked={field.required}
            onChange={(checked) => handleChange("required", checked)}
          />
        </Form.Item>

        <Form.Item label="默认值">
          <Input
            value={field.defaultValue as string}
            onChange={(e) => handleChange("defaultValue", e.target.value)}
            placeholder="默认值"
          />
        </Form.Item>

        {field.type === "select" && (
          <Form.Item label="选项配置">
            {field.options?.map((option, index) => (
              <Space
                key={index}
                style={{ display: "flex", marginBottom: 8 }}
                align="baseline"
              >
                <Input
                  placeholder="标签"
                  value={option.label}
                  onChange={(e) =>
                    handleOptionChange(index, "label", e.target.value)
                  }
                  style={{ width: 80 }}
                />
                <Input
                  placeholder="值"
                  value={option.value}
                  onChange={(e) =>
                    handleOptionChange(index, "value", e.target.value)
                  }
                  style={{ width: 80 }}
                />
                <MinusCircleOutlined
                  onClick={() => removeOption(index)}
                  style={{ color: "#ff4d4f", cursor: "pointer" }}
                />
              </Space>
            ))}
            <Button
              type="dashed"
              onClick={addOption}
              block
              icon={<PlusOutlined />}
            >
              添加选项
            </Button>
          </Form.Item>
        )}
      </Form>
    </div>
  );
}
