import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Space,
  Tag,
  Popconfirm,
  Alert,
  Result,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from "@ant-design/icons";
import { userService, roleService, type User, type Role } from "../services/userService";
import { authService } from "../services/authService";

interface UserManagementPageProps {
  systemId?: string;
}

function UserManagementPage({ systemId }: UserManagementPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetUserId, setResetUserId] = useState<string>("");
  const [form] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();

  // 获取当前登录用户信息
  const currentUser = authService.isAuthenticated() ? (() => {
    try {
      const userStr = localStorage.getItem("auth_user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  })() : null;

  // 检查是否可以分配某个角色（基于权限层级）
  const canAssignRole = (role: Role): boolean => {
    if (!currentUser || !currentUser.role) return true;

    const currentPermissions: string[] = (() => {
      try {
        const perms = currentUser.role.permissions;
        return typeof perms === 'string' ? JSON.parse(perms) : perms;
      } catch {
        return [];
      }
    })();

    // 超级管理员可以分配任何角色
    if (currentPermissions.includes("*")) return true;

    // 不允许分配与自己相同的角色
    if (role.id === currentUser.role.id) return false;

    const targetPermissions: string[] = (() => {
      try {
        return typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
      } catch {
        return [];
      }
    })();

    // 检查目标角色的每个权限是否被当前用户拥有
    return targetPermissions.every((targetPerm: string) => {
      if (targetPerm === "*") return false;

      return currentPermissions.some((currentPerm: string) => {
        if (currentPerm === "*") return true;
        if (currentPerm === targetPerm) return true;
        const [currentResource, currentAction] = currentPerm.split(":");
        const [targetResource] = targetPerm.split(":");
        if (currentResource === targetResource && currentAction === "*") return true;
        return false;
      });
    });
  };

  // 过滤可分配的角色
  const assignableRoles = roles.filter(canAssignRole);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getUsers({ systemId }),
        roleService.getRoles({ systemId }),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
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
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      realName: user.realName,
      email: user.email,
      description: user.description,
      roleId: user.roleId,
      isActive: user.isActive,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await userService.deleteUser(id);
      message.success("删除成功");
      loadData();
    } catch (error: any) {
      console.error("删除用户失败:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "删除失败";
      message.error(errorMessage);
    }
  };

  const handleResetPassword = (userId: string) => {
    setResetUserId(userId);
    resetPasswordForm.resetFields();
    setResetPasswordModalVisible(true);
  };

  const handleSubmitResetPassword = async (values: { newPassword: string }) => {
    try {
      await userService.resetPassword(resetUserId, values.newPassword);
      message.success("密码重置成功");
      setResetPasswordModalVisible(false);
    } catch (error: any) {
      console.error("重置密码失败:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "密码重置失败";
      message.error(errorMessage);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, values);
        message.success("更新成功");
      } else {
        // 创建用户时，明确传递 systemId
        await userService.createUser({
          ...values,
          systemId,
        });
        message.success("创建成功");
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      console.error("提交用户数据失败:", error);
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
      title: "用户名",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "真实姓名",
      dataIndex: "realName",
      key: "realName",
    },
    {
      title: "备注",
      dataIndex: "description",
      key: "description",
      render: (description: string) => description || "-",
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      render: (email: string) => email || "-",
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (role: Role) => (
        <Tag color="blue">{role?.name || "-"}</Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "启用" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: User) => (
        <Space>
          {authService.hasPermission("user:update") && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {authService.hasPermission("user:update") && (
            <Button
              type="link"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleResetPassword(record.id)}
            >
              重置密码
            </Button>
          )}
          {authService.hasPermission("user:delete") && record.id !== currentUser?.id && (
            <Popconfirm
              title="确定要删除此用户吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 权限检查
  const hasPermission = authService.hasAnyPermission("user:read", "user:*");

  // 如果没有权限，显示权限不足提示
  if (!hasPermission) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="403"
          title="权限不足"
          subTitle="抱歉，您没有权限访问用户管理页面。"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h2>用户管理</h2>
        {authService.hasPermission("user:create") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建用户
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingUser ? "编辑用户" : "新建用户"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: "请输入密码" },
                { min: 6, message: "密码长度不能少于6位" },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[{ required: true, message: "请输入真实姓名" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="email" label="邮箱">
            <Input type="email" placeholder="可选" />
          </Form.Item>

          <Form.Item name="description" label="备注">
            <Input.TextArea
              rows={2}
              placeholder="如：组长、王工、李工等具体身份"
            />
          </Form.Item>

          <Form.Item
            name="roleId"
            label="角色"
            rules={[{ required: true, message: "请选择角色" }]}
          >
            <Select placeholder="选择用户角色">
              {assignableRoles.map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  <div>
                    <div>{role.name}</div>
                    {role.description && (
                      <div style={{ fontSize: 12, color: "#999" }}>
                        {role.description}
                      </div>
                    )}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={resetPasswordModalVisible}
        onCancel={() => setResetPasswordModalVisible(false)}
        onOk={() => resetPasswordForm.submit()}
      >
        <Form
          form={resetPasswordForm}
          layout="vertical"
          onFinish={handleSubmitResetPassword}
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "密码长度不能少于6位" },
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UserManagementPage;
