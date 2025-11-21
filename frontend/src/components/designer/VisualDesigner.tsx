import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Card } from "antd";
import ComponentPanel, { componentTypes } from "./ComponentPanel";
import DesignCanvas from "./DesignCanvas";
import PropertyPanel from "./PropertyPanel";
import type { SchemaField } from "../../types/schema";

interface VisualDesignerProps {
  value: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

export default function VisualDesigner({
  value,
  onChange,
}: VisualDesignerProps) {
  const [fields, setFields] = useState<SchemaField[]>(value);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 生成唯一的字段 key
  const generateFieldKey = (type: string) => {
    const existingKeys = fields.map((f) => f.key);
    let counter = 1;
    let key = `${type}_${counter}`;
    while (existingKeys.includes(key)) {
      counter++;
      key = `${type}_${counter}`;
    }
    return key;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;

    // 如果是从组件面板拖拽新组件
    if (activeData?.isNew) {
      const componentType = componentTypes.find(
        (c) => `component-${c.type}` === active.id
      );
      if (componentType && over.id === "canvas") {
        const newField: SchemaField = {
          key: generateFieldKey(componentType.type),
          label: componentType.defaultProps.label,
          type: componentType.type as SchemaField["type"],
          required: componentType.defaultProps.required,
          options: componentType.defaultProps.options,
        };
        const newFields = [...fields, newField];
        setFields(newFields);
        onChange(newFields);
        setSelectedFieldKey(newField.key);
      }
    } else {
      // 画布内排序
      const oldIndex = fields.findIndex((f) => f.key === active.id);
      const newIndex = fields.findIndex((f) => f.key === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newFields = arrayMove(fields, oldIndex, newIndex);
        setFields(newFields);
        onChange(newFields);
      }
    }
  };

  const handleSelectField = (key: string | null) => {
    setSelectedFieldKey(key);
  };

  const handleDeleteField = (key: string) => {
    const newFields = fields.filter((f) => f.key !== key);
    setFields(newFields);
    onChange(newFields);
    if (selectedFieldKey === key) {
      setSelectedFieldKey(null);
    }
  };

  const handleFieldChange = (updatedField: SchemaField) => {
    const newFields = fields.map((f) =>
      f.key === selectedFieldKey ? updatedField : f
    );
    setFields(newFields);
    onChange(newFields);
  };

  const selectedField = fields.find((f) => f.key === selectedFieldKey) || null;

  // 获取正在拖拽的组件信息
  const getActiveComponent = () => {
    if (!activeId) return null;
    const comp = componentTypes.find((c) => `component-${c.type}` === activeId);
    if (comp) {
      return (
        <Card size="small" style={{ width: 150, opacity: 0.8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {comp.icon}
            <span>{comp.label}</span>
          </div>
        </Card>
      );
    }
    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: "flex",
          height: 500,
          border: "1px solid #f0f0f0",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <ComponentPanel />
        <DesignCanvas
          fields={fields}
          selectedFieldKey={selectedFieldKey}
          onSelectField={handleSelectField}
          onDeleteField={handleDeleteField}
        />
        <PropertyPanel
          field={selectedField}
          onFieldChange={handleFieldChange}
        />
      </div>
      <DragOverlay>{getActiveComponent()}</DragOverlay>
    </DndContext>
  );
}
