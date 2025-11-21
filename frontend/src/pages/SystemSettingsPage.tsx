import { useState, useEffect } from "react";
import { Card, Form, Input, Switch, Button, message, Spin, Space, Alert, Modal, Select, Tag, Divider, App } from "antd";
import { SaveOutlined, LockOutlined, AppstoreOutlined, DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { systemService } from "../services/systemService";
import { schemaService } from "../services/schemaService";
import type { System, Schema } from "../types/schema";

interface SystemSettingsPageProps {
  systemId: string;
  onUpdate?: () => void;
  onDelete?: () => void; // 删除后的回调
}

export default function SystemSettingsPage({ systemId, onUpdate, onDelete }: SystemSettingsPageProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [system, setSystem] = useState<System | null>(null);
  const [allSchemas, setAllSchemas] = useState<Schema[]>([]);
  const { modal, message } = App.useApp();

  useEffect(() => {
    loadData();
  }, [systemId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [systemData, schemasData] = await Promise.all([
        systemService.getSystemById(systemId),
        schemaService.getSchemas()
      ]);

      console.log("加载的系统数据:", systemData);
      console.log("所有可用的应用配置:", schemasData);

      setSystem(systemData);
      setAllSchemas(schemasData);

      form.setFieldsValue({
        name: systemData.name,
        description: systemData.description,
        isAuthEnabled: systemData.isAuthEnabled || false,
        schemaIds: systemData.schemas?.map((s: Schema) => s.id) || [],
      });

      console.log("表单初始值:", {
        name: systemData.name,
        description: systemData.description,
        isAuthEnabled: systemData.isAuthEnabled || false,
        schemaIds: systemData.schemas?.map((s: Schema) => s.id) || [],
      });
    } catch (error: any) {
      message.error("加载系统信息失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log("=== 准备保存系统设置 ===");
      console.log("表单值:", values);
      console.log("当前系统状态:", system);

      // 直接保存，不显示确认对话框
      console.log("开始保存...");
      await doSave(values);
    } catch (error: any) {
      console.error("handleSave 错误:", error);
      if (error.errorFields) return;
      message.error("保存失败: " + error.message);
    }
  };

  const doSave = async (values: any) => {
    try {
      setSaving(true);
      console.log("=== 开始调用后端API ===");
      console.log("正在保存系统设置，数据:", values);
      console.log("系统ID:", systemId);
      console.log("API URL:", `/api/systems/${systemId}`);

      const result = await systemService.updateSystem(systemId, values);
      console.log("=== API 调用成功 ===");
      console.log("返回结果:", result);

      message.success("保存成功");
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("=== API 调用失败 ===");
      console.error("错误对象:", error);
      console.error("错误响应:", error.response);
      console.error("错误消息:", error.message);
      message.error("保存失败: " + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!system) return;

    // 使用输入框让用户输入系统名称进行确认
    let inputValue = "";

    const confirmModal = modal.confirm({
      title: "删除系统",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: (
        <div>
          <Alert
            message="警告：此操作不可恢复！"
            description={
              <div>
                <p>删除系统将会：</p>
                <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                  <li>永久删除系统及其所有配置</li>
                  <li>删除所有关联的用户账号</li>
                  <li>删除所有关联的角色</li>
                  <li>删除所有业务数据（工单、报工、质检等）</li>
                </ul>
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <p style={{ marginBottom: 8 }}>
            请输入系统名称 <strong style={{ color: "#ff4d4f" }}>{system.name}</strong> 以确认删除：
          </p>
          <Input
            placeholder="请输入系统名称"
            onChange={(e) => {
              inputValue = e.target.value;
            }}
            onPressEnter={(e) => {
              // 阻止默认的确认行为，因为我们需要先验证输入
              e.preventDefault();
            }}
          />
        </div>
      ),
      okText: "确认删除",
      okType: "danger",
      cancelText: "取消",
      width: 600,
      onOk: async () => {
        if (inputValue !== system.name) {
          message.error("系统名称不匹配，删除已取消");
          return Promise.reject(new Error("系统名称不匹配")); // 阻止对话框关闭
        }

        setDeleting(true);
        try {
          await systemService.deleteSystem(systemId);
          message.success("系统已成功删除");
          setDeleting(false);
          // 手动销毁弹窗
          confirmModal.destroy();
          // 调用删除回调，通常是返回系统列表
          setTimeout(() => {
            onDelete?.();
          }, 100);
        } catch (error: any) {
          setDeleting(false);
          console.error("删除系统失败:", error);
          const errorMsg = error.response?.data?.error || error.message || "删除失败";
          message.error(errorMsg);
          return Promise.reject(error); // 返回 rejected Promise，保持对话框打开
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin>
          <div style={{ padding: 50 }}>加载中...</div>
        </Spin>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title="系统设置" style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
        >
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

          <Form.Item
            name="isAuthEnabled"
            label={
              <Space>
                <LockOutlined />
                <span>启用认证</span>
              </Space>
            }
            valuePropName="checked"
            tooltip="开启后，用户需要登录才能访问此系统"
          >
            <Switch
              checkedChildren="已启用"
              unCheckedChildren="未启用"
            />
          </Form.Item>

          <Form.Item
            name="schemaIds"
            label={
              <Space>
                <AppstoreOutlined />
                <span>系统应用</span>
              </Space>
            }
            tooltip="选择此系统包含的应用配置"
          >
            <Select
              mode="multiple"
              placeholder="选择应用配置"
              optionFilterProp="label"
              options={allSchemas.map(schema => ({
                label: schema.name,
                value: schema.id,
                desc: schema.entity,
              }))}
              optionRender={(option) => (
                <Space>
                  <span>{option.label}</span>
                  <Tag color={option.data.desc === 'WorkOrder' ? 'blue' : 'default'}>
                    {option.data.desc}
                  </Tag>
                </Space>
              )}
            />
          </Form.Item>

          {form.getFieldValue("isAuthEnabled") && (
            <Alert
              message="认证说明"
              description={
                <div>
                  <p>启用认证后：</p>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    <li>用户需要输入账号密码才能访问此系统</li>
                    <li>不同的用户角色将有不同的权限限制</li>
                    <li>您可以在用户管理和角色管理中配置权限</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Form.Item>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              保存设置
            </Button>
          </Form.Item>
        </Form>

        {/* 危险区域 - 删除系统 */}
        <Divider />
        <Card
          title="危险区域"
          size="small"
          style={{
            borderColor: "#ff4d4f",
            backgroundColor: "#fff1f0",
          }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Alert
              message="删除系统"
              description="删除此系统将永久删除所有相关数据，包括用户、角色和业务数据。此操作不可恢复。"
              type="error"
              showIcon
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              loading={deleting}
            >
              删除系统
            </Button>
          </Space>
        </Card>
      </Card>
    </div>
  );
}
