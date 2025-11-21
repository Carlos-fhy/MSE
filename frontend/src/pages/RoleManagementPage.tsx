import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Checkbox,
  message,
  Space,
  Tag,
  Popconfirm,
  Divider,
  Result,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { roleService, type Role, PERMISSION_GROUPS } from "../services/userService";
import { authService } from "../services/authService";

interface RoleManagementPageProps {
  systemId?: string;
}

function RoleManagementPage({ systemId }: RoleManagementPageProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await roleService.getRoles({ systemId });
      setRoles(data);
    } catch (error: any) {
      console.error("加载数据失败:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "加载数据失败";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    const permissions = JSON.parse(role.permissions || "[]");
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      permissions,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await roleService.deleteRole(id);
      message.success("删除成功");
      loadData();
    } catch (error: any) {
      console.error("删除角色失败:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "删除失败";
      message.error(errorMessage);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, values);
        message.success("更新成功");
      } else {
        await roleService.createRole(values);
        message.success("创建成功");
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      console.error("提交角色数据失败:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "操作失败";
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: "角色名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "用户数",
      dataIndex: "_count",
      key: "userCount",
      render: (count: any) => count?.users || 0,
    },
    {
      title: "类型",
      dataIndex: "isBuiltIn",
      key: "isBuiltIn",
      render: (isBuiltIn: boolean) => (
        <Tag color={isBuiltIn ? "blue" : "default"}>
          {isBuiltIn ? "内置角色" : "自定义角色"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Role) => (
        <Space>
          {authService.hasPermission("role:update") && !record.isBuiltIn && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {authService.hasPermission("role:delete") && !record.isBuiltIn && (
            <Popconfirm
              title="确定要删除此角色吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
          {record.isBuiltIn && (
            <Tag color="blue">系统内置，不可编辑</Tag>
          )}
        </Space>
      ),
    },
  ];

  // 权限检查
  const hasPermission = authService.hasAnyPermission("role:read", "role:*");

  // 如果没有权限，显示权限不足提示
  if (!hasPermission) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="403"
          title="权限不足"
          subTitle="抱歉，您没有权限访问角色管理页面。"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h2>角色管理</h2>
        {authService.hasPermission("role:create") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建角色
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingRole ? "编辑角色" : "新建角色"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: "请输入角色名称" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="权限配置"
            rules={[{ required: true, message: "请至少选择一个权限" }]}
          >
            <Checkbox.Group style={{ width: "100%" }}>
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label} style={{ marginBottom: 16 }}>
                  <Divider orientation="left" style={{ margin: "8px 0" }}>
                    {group.label}
                  </Divider>
                  <div style={{ paddingLeft: 16 }}>
                    {group.permissions.map((perm) => (
                      <div key={perm.value} style={{ marginBottom: 8 }}>
                        <Checkbox value={perm.value}>{perm.label}</Checkbox>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RoleManagementPage;
