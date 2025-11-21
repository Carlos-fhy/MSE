import { useDraggable } from "@dnd-kit/core";
import { Card } from "antd";
import {
  FontSizeOutlined,
  NumberOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

// 可用的组件类型
export const componentTypes = [
  {
    type: "text",
    label: "文本输入",
    icon: <FontSizeOutlined />,
    defaultProps: {
      label: "文本字段",
      required: false,
    },
  },
  {
    type: "number",
    label: "数字输入",
    icon: <NumberOutlined />,
    defaultProps: {
      label: "数字字段",
      required: false,
    },
  },
  {
    type: "date",
    label: "日期选择",
    icon: <CalendarOutlined />,
    defaultProps: {
      label: "日期字段",
      required: false,
    },
  },
  {
    type: "select",
    label: "下拉选择",
    icon: <UnorderedListOutlined />,
    defaultProps: {
      label: "选择字段",
      required: false,
      options: [
        { label: "选项1", value: "option1" },
        { label: "选项2", value: "option2" },
      ],
    },
  },
  {
    type: "textarea",
    label: "多行文本",
    icon: <FileTextOutlined />,
    defaultProps: {
      label: "多行文本字段",
      required: false,
    },
  },
];

// 可拖拽的组件项
function DraggableComponent({
  type,
  label,
  icon,
}: {
  type: string;
  label: string;
  icon: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `component-${type}`,
      data: {
        type,
        isNew: true,
      },
    });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <Card
        size="small"
        style={{
          marginBottom: 8,
          cursor: "grab",
          borderColor: isDragging ? "#1890ff" : undefined,
        }}
        hoverable
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon}
          <span>{label}</span>
        </div>
      </Card>
    </div>
  );
}

export default function ComponentPanel() {
  return (
    <div
      style={{
        width: 200,
        padding: 16,
        backgroundColor: "#fafafa",
        borderRight: "1px solid #f0f0f0",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginBottom: 16 }}>组件</h3>
      {componentTypes.map((comp) => (
        <DraggableComponent
          key={comp.type}
          type={comp.type}
          label={comp.label}
          icon={comp.icon}
        />
      ))}
    </div>
  );
}
