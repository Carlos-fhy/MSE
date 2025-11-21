import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Button, Empty } from "antd";
import { DeleteOutlined, HolderOutlined } from "@ant-design/icons";
import type { SchemaField } from "../../types/schema";

interface DesignCanvasProps {
  fields: SchemaField[];
  selectedFieldKey: string | null;
  onSelectField: (key: string | null) => void;
  onDeleteField: (key: string) => void;
}

// 可排序的字段项
function SortableFieldItem({
  field,
  isSelected,
  onSelect,
  onDelete,
}: {
  field: SchemaField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFieldTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      text: "文本",
      number: "数字",
      date: "日期",
      select: "下拉",
      textarea: "多行文本",
    };
    return typeMap[type] || type;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        style={{
          marginBottom: 8,
          borderColor: isSelected ? "#1890ff" : undefined,
          borderWidth: isSelected ? 2 : 1,
          cursor: "pointer",
        }}
        onClick={onSelect}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              {...attributes}
              {...listeners}
              style={{ cursor: "grab", color: "#999" }}
            >
              <HolderOutlined />
            </span>
            <div>
              <div style={{ fontWeight: 500 }}>{field.label}</div>
              <div style={{ fontSize: 12, color: "#999" }}>
                {field.key} | {getFieldTypeLabel(field.type)}
                {field.required && (
                  <span style={{ color: "#ff4d4f", marginLeft: 4 }}>*必填</span>
                )}
              </div>
            </div>
          </div>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
        </div>
      </Card>
    </div>
  );
}

export default function DesignCanvas({
  fields,
  selectedFieldKey,
  onSelectField,
  onDeleteField,
}: DesignCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: isOver ? "#e6f7ff" : "#fff",
        minHeight: 400,
        border: isOver ? "2px dashed #1890ff" : "2px dashed transparent",
        transition: "all 0.3s",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginBottom: 16 }}>画布</h3>
      {fields.length === 0 ? (
        <Empty
          description="从左侧拖拽组件到此处"
          style={{ marginTop: 100 }}
        />
      ) : (
        <SortableContext
          items={fields.map((f) => f.key)}
          strategy={verticalListSortingStrategy}
        >
          {fields.map((field) => (
            <SortableFieldItem
              key={field.key}
              field={field}
              isSelected={selectedFieldKey === field.key}
              onSelect={() => onSelectField(field.key)}
              onDelete={() => onDeleteField(field.key)}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );
}
