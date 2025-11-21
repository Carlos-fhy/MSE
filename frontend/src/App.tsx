import { useState } from "react";
import { Layout, Menu, Spin, Button, Dropdown, message, Modal, Form, Input, Space } from "antd";
import {
  SettingOutlined,
  TableOutlined,
  SwapOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  SafetyOutlined,
  KeyOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import SchemaConfigPage from "./pages/SchemaConfigPage";
import SchemaRuntimePage from "./pages/SchemaRuntimePage";
import SystemListPage from "./pages/SystemListPage";
import LoginPage from "./pages/LoginPage";
import UserManagementPage from "./pages/UserManagementPage";
import RoleManagementPage from "./pages/RoleManagementPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";
import DashboardPage from "./pages/DashboardPage";
import { systemService } from "./services/systemService";
import { authService } from "./services/authService";
import type { System } from "./types/schema";

const { Header, Content } = Layout;

// MES应用中文名称映射
const MES_APP_NAMES: Record<string, string> = {
  "work-order": "工单管理",
  "work-report": "报工记录",
  "quality-check": "质检记录",
  "equipment": "设备管理",
  "employee": "员工管理",
  "user": "用户管理",
  "role": "角色管理",
};

function App() {
  const [currentSystem, setCurrentSystem] = useState<System | null>(null);
  const [currentPage, setCurrentPage] = useState<string>("runtime");
  const [runtimeSchema, setRuntimeSchema] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingSystem, setPendingSystem] = useState<System | null>(null);
  const [pendingPage, setPendingPage] = useState<string>("");  // 记录用户想要访问的页面
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [changePasswordForm] = Form.useForm();

  // 选择系统
  const handleSelectSystem = async (system: System) => {
    setLoading(true);
    try {
      // 重新获取最新的系统数据（包含schemas和isAuthEnabled）
      const freshSystem = await systemService.getSystemById(system.id);

      console.log("选择的系统:", freshSystem.name);
      console.log("系统是否启用认证:", freshSystem.isAuthEnabled);
      console.log("当前是否已登录:", authService.isAuthenticated());

      // 检查系统是否启用认证
      if (freshSystem.isAuthEnabled) {
        const isAuthenticated = authService.isAuthenticated();
        const canAccess = isAuthenticated && authService.canAccessSystem(freshSystem.id);

        console.log("是否有权访问该系统:", canAccess);

        // 如果未登录，或已登录但无权访问该系统
        if (!isAuthenticated || !canAccess) {
          // 如果用户已登录但无权访问，先清除登录状态
          if (isAuthenticated && !canAccess) {
            console.log("当前登录用户无权访问该系统，清除登录状态");
            await authService.logout();
          }

          // 显示登录页
          console.log("需要登录，显示登录页面");
          setPendingSystem(freshSystem);
          setShowLogin(true);
          setLoading(false);
          return;
        }
      }

      setCurrentSystem(freshSystem);
      // 默认进入生产看板
      setCurrentPage("dashboard");
      setRuntimeSchema("");
    } catch (error) {
      console.error("加载系统失败:", error);
      message.error("加载系统失败");
    } finally {
      setLoading(false);
    }
  };

  // 登录成功后的处理
  const handleLoginSuccess = () => {
    setShowLogin(false);
    if (pendingSystem) {
      setCurrentSystem(pendingSystem);

      // 如果有待访问的管理页面，跳转到该页面
      if (pendingPage) {
        setCurrentPage(pendingPage);
        if (pendingPage === "users") {
          setRuntimeSchema("user");
        } else if (pendingPage === "roles") {
          setRuntimeSchema("role");
        }
        setPendingPage("");
      } else {
        // 默认进入生产看板
        setCurrentPage("dashboard");
        setRuntimeSchema("");
      }

      setPendingSystem(null);
    }
  };

  // 退出系统，返回系统列表，同时自动登出
  const handleExitSystem = async () => {
    // 如果用户已登录，先执行登出操作
    if (authService.isAuthenticated()) {
      try {
        await authService.logout();
        console.log("退出系统时自动登出");
      } catch (error) {
        console.error("登出失败:", error);
      }
    }

    // 清除系统状态，返回系统列表
    setCurrentSystem(null);
    setRuntimeSchema("");
    setCurrentPage("runtime");
  };

  // 登出
  const handleLogout = () => {
    Modal.confirm({
      title: "确认登出",
      content: "您确定要登出吗？",
      onOk: async () => {
        try {
          await authService.logout();
          message.success("已登出");
          // 如果当前系统启用了认证，返回系统列表
          if (currentSystem && currentSystem.isAuthEnabled) {
            handleExitSystem();
          }
        } catch (error) {
          console.error("登出失败:", error);
        }
      },
    });
  };

  // 修改密码
  const handleChangePassword = () => {
    changePasswordForm.resetFields();
    setChangePasswordModalVisible(true);
  };

  const handleSubmitChangePassword = async (values: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("两次输入的新密码不一致");
      return;
    }

    try {
      await authService.changePassword(values.oldPassword, values.newPassword);
      message.success("密码修改成功");
      setChangePasswordModalVisible(false);
      changePasswordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || "密码修改失败");
    }
  };

  // 前往配置页面
  const handleGoToConfig = () => {
    setCurrentSystem({
      id: "config",
      name: "配置管理",
      schemas: [],
      createdAt: "",
      updatedAt: "",
      isAuthEnabled: false,
    });
    setCurrentPage("config");
  };

  // 前往用户管理页面
  const handleGoToUserManagement = () => {
    // 管理功能必须登录
    if (!authService.isAuthenticated()) {
      message.warning("请先登录以访问管理功能");
      setPendingSystem(currentSystem);
      setPendingPage("users");
      setShowLogin(true);
      return;
    }
    setCurrentPage("users");
    setRuntimeSchema("user");
  };

  // 前往角色管理页面
  const handleGoToRoleManagement = () => {
    // 管理功能必须登录
    if (!authService.isAuthenticated()) {
      message.warning("请先登录以访问管理功能");
      setPendingSystem(currentSystem);
      setPendingPage("roles");
      setShowLogin(true);
      return;
    }
    setCurrentPage("roles");
    setRuntimeSchema("role");
  };

  // 前往系统设置页面
  const handleGoToSystemSettings = () => {
    // 管理功能必须登录
    if (!authService.isAuthenticated()) {
      message.warning("请先登录以访问管理功能");
      setPendingSystem(currentSystem);
      setPendingPage("system-settings");
      setShowLogin(true);
      return;
    }
    // 检查权限
    if (!authService.hasAnyPermission("system:update", "system:*")) {
      message.error("您没有权限访问系统设置");
      return;
    }
    setCurrentPage("system-settings");
  };

  // 刷新当前系统数据
  const handleSystemUpdate = async () => {
    if (currentSystem && currentSystem.id !== "config") {
      try {
        const freshSystem = await systemService.getSystemById(currentSystem.id);
        setCurrentSystem(freshSystem);
      } catch (error) {
        console.error("刷新系统数据失败:", error);
      }
    }
  };

  // 如果需要显示登录页
  if (showLogin) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        systemId={pendingSystem?.id}
        systemName={pendingSystem?.name}
      />
    );
  }

  // 如果没有选择系统，显示系统列表页面
  if (!currentSystem) {
    return (
      <SystemListPage
        onSelectSystem={handleSelectSystem}
        onGoToConfig={handleGoToConfig}
      />
    );
  }

  // 配置管理页面
  if (currentSystem.id === "config") {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "bold",
                marginRight: 32,
              }}
            >
              配置管理
            </div>
          </div>
          <div>
            {authService.isAuthenticated() && (
              <UserDropdown onLogout={handleLogout} onChangePassword={handleChangePassword} />
            )}
            <Button
              type="text"
              icon={<SwapOutlined />}
              onClick={handleExitSystem}
              style={{ color: "white", marginLeft: 8 }}
            >
              返回系统列表
            </Button>
          </div>
        </Header>
        <Content style={{ backgroundColor: "#f0f2f5", width: "100%" }}>
          <SchemaConfigPage />
        </Content>
      </Layout>
    );
  }

  // 构建当前系统的菜单
  const menuItems: any[] = [
    {
      key: "app-dashboard",
      icon: <DashboardOutlined />,
      label: "生产看板",
    },
  ];

  // 添加应用菜单
  currentSystem.schemas?.forEach((schema) => {
    menuItems.push({
      key: `app-${schema.name}`,
      icon: <TableOutlined />,
      label: MES_APP_NAMES[schema.name] || schema.name,
    });
  });

  // 如果用户已登录且有权限，添加管理菜单
  if (authService.isAuthenticated()) {
    if (authService.hasAnyPermission("user:read", "user:*")) {
      menuItems.push({
        key: "app-user",
        icon: <TeamOutlined />,
        label: "用户管理",
      });
    }
    if (authService.hasAnyPermission("role:read", "role:*")) {
      menuItems.push({
        key: "app-role",
        icon: <SafetyOutlined />,
        label: "角色管理",
      });
    }
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "app-dashboard") {
      setCurrentPage("dashboard");
      setRuntimeSchema("");
    } else if (key === "app-user") {
      handleGoToUserManagement();
    } else if (key === "app-role") {
      handleGoToRoleManagement();
    } else if (key.startsWith("app-")) {
      const schemaName = key.replace("app-", "");
      setRuntimeSchema(schemaName);
      setCurrentPage("runtime");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ padding: 24, textAlign: "center" }}>
          <Spin>
            <div style={{ padding: 50 }}>加载中...</div>
          </Spin>
        </div>
      );
    }

    // 根据当前页面渲染不同内容
    if (currentPage === "dashboard") {
      return <DashboardPage systemId={currentSystem?.id || ""} />;
    }

    if (currentPage === "system-settings") {
      return (
        <SystemSettingsPage
          systemId={currentSystem?.id || ""}
          onUpdate={handleSystemUpdate}
          onDelete={() => {
            // 系统被删除后，返回系统列表页
            setCurrentSystem(null);
            setCurrentPage("runtime");
            // 清除登录状态
            authService.logout().catch(() => {});
          }}
        />
      );
    }

    if (currentPage === "users") {
      return <UserManagementPage systemId={currentSystem?.id} />;
    }

    if (currentPage === "roles") {
      return <RoleManagementPage systemId={currentSystem?.id} />;
    }

    if (!runtimeSchema) {
      return (
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ padding: 50, color: "#999" }}>
            该系统暂无应用，请先在配置管理中添加应用
          </div>
        </div>
      );
    }

    return <SchemaRuntimePage schemaName={runtimeSchema} />;
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "bold",
              marginRight: 32,
            }}
          >
            {currentSystem.name}
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[currentPage === "dashboard" ? "app-dashboard" : `app-${runtimeSchema}`]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
        <div>
          {/* 系统设置按钮：始终显示，但需要登录且有权限才能访问 */}
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={handleGoToSystemSettings}
            style={{ color: "white", marginRight: 8 }}
          >
            系统设置
          </Button>
          {authService.isAuthenticated() && (
            <UserDropdown onLogout={handleLogout} onChangePassword={handleChangePassword} />
          )}
          <Button
            type="text"
            icon={<SwapOutlined />}
            onClick={handleExitSystem}
            style={{ color: "white", marginLeft: 8 }}
          >
            切换系统
          </Button>
        </div>
      </Header>
      <Content style={{ backgroundColor: "#f0f2f5", width: "100%" }}>
        {renderContent()}
      </Content>

      {/* 修改密码对话框 */}
      <Modal
        title="修改密码"
        open={changePasswordModalVisible}
        onCancel={() => setChangePasswordModalVisible(false)}
        footer={null}
      >
        <Form
          form={changePasswordForm}
          layout="vertical"
          onFinish={handleSubmitChangePassword}
        >
          <Form.Item
            label="旧密码"
            name="oldPassword"
            rules={[{ required: true, message: "请输入旧密码" }]}
          >
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "密码长度不能少于6位" },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少6位）" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            rules={[{ required: true, message: "请再次输入新密码" }]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setChangePasswordModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

// 用户下拉菜单组件
function UserDropdown({ onLogout, onChangePassword }: { onLogout: () => void; onChangePassword: () => void }) {
  const user = authService.isAuthenticated()
    ? (() => {
        try {
          const userStr = localStorage.getItem("auth_user");
          return userStr ? JSON.parse(userStr) : null;
        } catch {
          return null;
        }
      })()
    : null;

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      key: "info",
      label: (
        <div>
          <div style={{ fontWeight: "bold" }}>{user.realName}</div>
          <div style={{ fontSize: 12, color: "#999" }}>{user.role?.name}</div>
          {user.description && (
            <div style={{ fontSize: 12, color: "#999" }}>{user.description}</div>
          )}
        </div>
      ),
      disabled: true,
    },
    {
      type: "divider" as const,
    },
    {
      key: "change-password",
      label: "修改密码",
      icon: <KeyOutlined />,
      onClick: onChangePassword,
    },
    {
      key: "logout",
      label: "登出",
      icon: <LogoutOutlined />,
      onClick: onLogout,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
      <Button type="text" icon={<UserOutlined />} style={{ color: "white" }}>
        {user.realName}
      </Button>
    </Dropdown>
  );
}

export default App;
