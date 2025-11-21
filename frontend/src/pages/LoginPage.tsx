import { useState } from "react";
import { Form, Input, Button, Card, Typography, App } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { authService } from "../services/authService";

const { Title } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

interface LoginPageProps {
  onLoginSuccess: () => void;
  systemId?: string;
  systemName?: string;
}

function LoginPage({ onLoginSuccess, systemId, systemName }: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const { modal, message } = App.useApp(); // 使用 App.useApp() 获取 modal 和 message 实例

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      // 登录时传递systemId，确保用户只能登录到所属系统
      console.log("登录参数:", {
        username: values.username,
        systemId,
        systemName,
      });

      const response = await authService.login({
        ...values,
        systemId,
      });
      message.success(`欢迎，${response.user.realName}！`);
      onLoginSuccess();
    } catch (error: any) {
      console.error("登录失败:", error);
      console.error("错误详情:", error.response?.data);

      // 获取错误信息
      let errorTitle = "登录失败";
      let errorContent = "登录失败，请检查用户名和密码";

      if (error.response?.status === 401) {
        // 401 错误 - 认证失败
        const backendMessage = error.response?.data?.message || error.response?.data?.error;
        console.log("后端错误消息:", backendMessage);

        if (backendMessage) {
          if (backendMessage.includes("用户名或密码错误")) {
            errorTitle = "账号不存在或密码错误";
            errorContent = "请检查您输入的用户名和密码是否正确。如果您还没有账号，请联系系统管理员创建。";
          } else if (backendMessage.includes("已被禁用")) {
            errorTitle = "账号已被禁用";
            errorContent = backendMessage;
          } else {
            errorContent = backendMessage;
          }
        }
      } else if (error.response?.status === 403) {
        // 403 错误 - 权限不足
        errorTitle = "权限不足";
        errorContent = error.response?.data?.message || "您无权访问此系统";
      } else {
        // 其他错误
        errorContent = error.response?.data?.message || error.response?.data?.error || errorContent;
      }

      console.log("准备显示弹窗:", { errorTitle, errorContent });

      // 使用 modal.error 显示错误弹窗
      modal.error({
        title: errorTitle,
        content: errorContent,
        okText: "确定",
      });

      console.log("modal.error 已调用");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            {systemName || "低代码平台"}
          </Title>
          <Typography.Text type="secondary">
            {systemName ? "请登录以访问此系统" : "请登录以继续"}
          </Typography.Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <div>测试账号：</div>
            <div>超级管理员：admin / admin123</div>
            <div>系统管理员：sysadmin / sysadmin123</div>
            <div>组长（普通用户）：leader / user123</div>
            <div>工人（只读用户）：worker / worker123</div>
          </Typography.Text>
        </div>
      </Card>
    </div>
  );
}

export default LoginPage;
