import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Tabs,
  Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { VisualDesigner } from "../components/designer";
import { schemaService } from "../services/schemaService";
import { systemService } from "../services/systemService";
import type { Schema, SchemaField, System } from "../types/schema";

export default function SchemaConfigPage() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(false);
  const [schemaModalVisible, setSchemaModalVisible] = useState(false);
  const [systemModalVisible, setSystemModalVisible] = useState(false);
  const [editingSchema, setEditingSchema] = useState<Schema | null>(null);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [schemaForm] = Form.useForm();
  const [systemForm] = Form.useForm();
  const [designerFields, setDesignerFields] = useState<SchemaField[]>([]);

  // 加载所有数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [schemasData, systemsData] = await Promise.all([
        schemaService.getAllSchemas(),
        systemService.getAllSystems(),
      ]);
      setSchemas(schemasData);
      setSystems(systemsData);
    } catch (error: any) {
      message.error("加载数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // === 系统管理相关 ===
  const handleCreateSystem = () => {
    setEditingSystem(null);
    systemForm.resetFields();
    setSystemModalVisible(true);
  };

  const handleEditSystem = (system: System) => {
    setEditingSystem(system);
    systemForm.setFieldsValue({
      name: system.name,
      description: system.description,
    });
    setSystemModalVisible(true);
  };

  const handleDeleteSystem = async (id: string) => {
    try {
      await systemService.deleteSystem(id);
      message.success("删除成功");
      loadData();
    } catch (error: any) {
      message.error("删除失败: " + error.message);
    }
  };

  const handleSystemSubmit = async () => {
    try {
      const values = await systemForm.validateFields();

      if (editingSystem) {
        await systemService.updateSystem(editingSystem.id, values);
        message.success("更新成功");
      } else {
        await systemService.createSystem(values);
        message.success("创建成功");
      }

      setSystemModalVisible(false);
      loadData();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(`${editingSystem ? "更新" : "创建"}失败: ` + error.message);
    }
  };

  // === Schema 管理相关 ===
  const handleCreateSchema = () => {
    setEditingSchema(null);
    setDesignerFields([
      {
        key: "example",
        label: "示例字段",
        type: "text",
        required: true,
      },
    ]);
    schemaForm.resetFields();
    setSchemaModalVisible(true);
  };

  const handleEditSchema = (schema: Schema) => {
    setEditingSchema(schema);
    setDesignerFields(schema.fields);
    schemaForm.setFieldsValue({
      name: schema.name,
      entity: schema.entity,
      systemId: schema.systemId || undefined,
    });
    setSchemaModalVisible(true);
  };

  const handleDeleteSchema = async (id: string) => {
    try {
      await schemaService.deleteSchema(id);
      message.success("删除成功");
      loadData();
    } catch (error: any) {
      message.error("删除失败: " + error.message);
    }
  };

  const handleSchemaSubmit = async () => {
    try {
      const values = await schemaForm.validateFields();

      if (editingSchema) {
        await schemaService.updateSchema(editingSchema.id, {
          name: values.name,
          entity: values.entity,
          fields: designerFields,
          systemId: values.systemId,
        });
        message.success("更新成功");
      } else {
        await schemaService.createSchema({
          name: values.name,
          entity: values.entity,
          fields: designerFields,
          systemId: values.systemId,
        });
        message.success("创建成功");
      }

      setSchemaModalVisible(false);
      loadData();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(`${editingSchema ? "更新" : "创建"}失败: ` + error.message);
    }
  };

  // 系统表格列
  const systemColumns = [
    {
      title: "系统名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      render: (text: string) => text || "-",
    },
    {
      title: "应用数量",
      key: "schemaCount",
      render: (record: System) => record.schemas?.length || 0,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "操作",
      key: "actions",
      render: (record: System) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditSystem(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个系统吗？"
            onConfirm={() => handleDeleteSystem(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Schema 表格列
  const schemaColumns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "实体",
      dataIndex: "entity",
      key: "entity",
    },
    {
      title: "所属系统",
      key: "system",
      render: (record: Schema) => {
        const system = systems.find((s) => s.id === record.systemId);
        return system?.name || "未分组";
      },
    },
    {
      title: "字段数量",
      key: "fieldsCount",
      render: (record: Schema) => record.fields.length,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "操作",
      key: "actions",
      render: (record: Schema) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditSchema(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个配置吗？"
            onConfirm={() => handleDeleteSchema(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: "systems",
      label: "系统管理",
      children: (
        <div>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateSystem}
            >
              新建系统
            </Button>
          </div>
          <Table
            columns={systemColumns}
            dataSource={systems}
            rowKey="id"
            loading={loading}
          />
        </div>
      ),
    },
    {
      key: "schemas",
      label: "应用配置",
      children: (
        <div>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateSchema}
            >
              新建配置
            </Button>
          </div>
          <Table
            columns={schemaColumns}
            dataSource={schemas}
            rowKey="id"
            loading={loading}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, width: "100%", boxSizing: "border-box" }}>
      <h1 style={{ margin: "0 0 16px 0" }}>配置管理</h1>

      <Tabs items={tabItems} />

      {/* 系统弹窗 */}
      <Modal
        title={editingSystem ? "编辑系统" : "新建系统"}
        open={systemModalVisible}
        onOk={handleSystemSubmit}
        onCancel={() => setSystemModalVisible(false)}
        okText={editingSystem ? "更新" : "创建"}
        cancelText="取消"
      >
        <Form form={systemForm} layout="vertical">
          <Form.Item
            name="name"
            label="系统名称"
            rules={[{ required: true, message: "请输入系统名称" }]}
          >
            <Input placeholder="例如: MES系统" />
          </Form.Item>

          <Form.Item
            name="description"
            label="系统描述"
          >
            <Input.TextArea placeholder="可选的系统描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Schema 弹窗 */}
      <Modal
        title={editingSchema ? "编辑配置" : "新建配置"}
        open={schemaModalVisible}
        onOk={handleSchemaSubmit}
        onCancel={() => setSchemaModalVisible(false)}
        width={1000}
        okText={editingSchema ? "更新" : "创建"}
        cancelText="取消"
      >
        <Form form={schemaForm} layout="vertical">
          <Form.Item
            name="name"
            label="配置名称"
            rules={[{ required: true, message: "请输入配置名称" }]}
          >
            <Input placeholder="例如: work-order" />
          </Form.Item>

          <Form.Item
            name="entity"
            label="实体名称"
            rules={[{ required: true, message: "请输入实体名称" }]}
          >
            <Input placeholder="例如: WorkOrder" />
          </Form.Item>

          <Form.Item
            name="systemId"
            label="所属系统"
          >
            <Select
              placeholder="选择所属系统（可选）"
              allowClear
            >
              {systems.map((system) => (
                <Select.Option key={system.id} value={system.id}>
                  {system.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="字段配置">
            <VisualDesigner
              value={designerFields}
              onChange={setDesignerFields}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
