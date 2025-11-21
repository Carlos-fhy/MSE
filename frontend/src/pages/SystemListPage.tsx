import { useState, useEffect } from "react";
import { Card, Row, Col, Button, message, Spin, Empty, Tag, Modal, Form, Input, Checkbox, Alert, Typography } from "antd";
import { AppstoreOutlined, SettingOutlined, LockOutlined, LogoutOutlined, PlusOutlined } from "@ant-design/icons";
import { systemService } from "../services/systemService";
import type { System } from "../types/schema";

const { Paragraph, Text } = Typography;

interface SystemListPageProps {
  onSelectSystem: (system: System) => void;
  onGoToConfig: () => void;
}

export default function SystemListPage({ onSelectSystem, onGoToConfig }: SystemListPageProps) {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string; message: string } | null>(null);
  const [form] = Form.useForm();

  const loadSystems = async () => {
    try {
      const data = await systemService.getAllSystems();
      setSystems(data);
    } catch (error: any) {
      message.error("加载系统列表失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAuth = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    message.success("已清除登录状态");
  };

  const handleCreateSystem = async () => {
    try {
      const values = await form.validateFields();
      const response = await systemService.createSystem(values);

      message.success("系统创建成功！");

      // 保存管理员凭据以显示
      if (response.adminCredentials) {
        setCreatedCredentials(response.adminCredentials);
      }

      // 刷新系统列表
      loadSystems();

      // 重置表单
      form.resetFields();
    } catch (error: any) {
      // 表单验证错误
      if (error.errorFields) {
        return;
      }

      // API 错误
      let errorMessage = "创建系统失败";
      if (error.response?.data?.error) {
        // 后端返回的具体错误信息
        const backendError = error.response.data.error;
        if (backendError === "System name already exists") {
          errorMessage = "系统名称已存在，请使用其他名称";
        } else {
          errorMessage = `创建失败: ${backendError}`;
        }
      } else if (error.message) {
        errorMessage = `创建失败: ${error.message}`;
      }

      message.error(errorMessage);
    }
  };

  const handleCloseCredentialsModal = () => {
    setCreatedCredentials(null);
    setCreateModalVisible(false);
  };

  useEffect(() => {
    loadSystems();
  }, []);

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f2f5"
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0f2f5",
      padding: "40px 24px"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>迷你低代码平台</h1>
            <p style={{ margin: "8px 0 0", color: "#666" }}>选择一个系统开始使用，或创建新系统</p>
          </div>
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              style={{ marginRight: 8 }}
            >
              创建系统
            </Button>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleClearAuth}
              style={{ marginRight: 8 }}
            >
              清除登录状态
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={onGoToConfig}
            >
              配置管理
            </Button>
          </div>
        </div>

        {systems.length === 0 ? (
          <Card>
            <Empty
              description="暂无系统，请通过配置管理创建系统"
              style={{ padding: "60px 0" }}
            />
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {systems.map((system) => (
              <Col xs={24} sm={12} md={8} lg={6} key={system.id}>
                <Card
                  hoverable
                  onClick={() => onSelectSystem(system)}
                  style={{ height: "100%" }}
                >
                  <Card.Meta
                    avatar={
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        backgroundColor: "#1890ff",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}>
                        <AppstoreOutlined style={{ fontSize: 24, color: "white" }} />
                      </div>
                    }
                    title={system.name}
                    description={
                      <div>
                        <div style={{
                          color: "#999",
                          fontSize: 12,
                          marginBottom: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {system.description || "暂无描述"}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#1890ff", fontSize: 12 }}>
                            {system.schemas?.length || 0} 个应用
                          </span>
                          {system.isAuthEnabled && (
                            <Tag icon={<LockOutlined />} color="green" style={{ fontSize: 11, margin: 0 }}>
                              已启用认证
                            </Tag>
                          )}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* 创建系统弹窗 */}
        <Modal
          title="创建新系统"
          open={createModalVisible && !createdCredentials}
          onOk={handleCreateSystem}
          onCancel={() => setCreateModalVisible(false)}
          okText="创建"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="系统名称"
              name="name"
              rules={[{ required: true, message: "请输入系统名称" }]}
            >
              <Input placeholder="例如：生产管理系统" />
            </Form.Item>

            <Form.Item
              label="系统描述"
              name="description"
            >
              <Input.TextArea placeholder="系统的简要说明" rows={3} />
            </Form.Item>

            <Form.Item
              label="管理员用户名"
              name="adminUsername"
              tooltip="不填写则默认为 admin"
            >
              <Input placeholder="默认: admin" />
            </Form.Item>

            <Form.Item
              label="管理员密码"
              name="adminPassword"
              tooltip="不填写则默认为 admin123"
            >
              <Input.Password placeholder="默认: admin123" />
            </Form.Item>

            <Form.Item
              name="isAuthEnabled"
              valuePropName="checked"
              initialValue={false}
            >
              <Checkbox>启用用户认证</Checkbox>
            </Form.Item>

            <Alert
              message="提示"
              description="创建系统后将自动生成管理员账号，请妥善保管密码。"
              type="info"
              showIcon
            />
          </Form>
        </Modal>

        {/* 显示管理员凭据弹窗 */}
        <Modal
          title="系统创建成功"
          open={!!createdCredentials}
          onOk={handleCloseCredentialsModal}
          onCancel={handleCloseCredentialsModal}
          okText="我已保存"
          cancelText="关闭"
          width={600}
          closable={false}
        >
          <Alert
            message="管理员账号已创建"
            description={createdCredentials?.message}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Card>
            <Paragraph>
              <Text strong>用户名：</Text>
              <Text copyable>{createdCredentials?.username}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>密码：</Text>
              <Text copyable code>{createdCredentials?.password}</Text>
            </Paragraph>
          </Card>

          <Alert
            message="重要提示"
            description="此密码仅显示一次，请务必复制保存！丢失后需要通过管理员功能重置。"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Modal>
      </div>
    </div>
  );
}
