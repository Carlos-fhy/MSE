import { useState, useEffect } from "react";
import { Button, Modal, Form, message, Popconfirm, Spin, Upload, Space, Alert, App } from "antd";
import { PlusOutlined, DownloadOutlined, UploadOutlined, FileExcelOutlined } from "@ant-design/icons";
import DynamicForm from "../components/DynamicForm";
import DynamicTable from "../components/DynamicTable";
import { schemaService } from "../services/schemaService";
import { dataService } from "../services/dataService";
import { exportToExcel, downloadTemplate, importFromExcel } from "../utils/excelUtils";
import type { Schema } from "../types/schema";
import dayjs from "dayjs";
import type { UploadFile } from "antd";

interface SchemaRuntimePageProps {
  schemaName: string;
}

export default function SchemaRuntimePage({ schemaName }: SchemaRuntimePageProps) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // 使用 App.useApp() 获取 modal 实例
  const { modal } = App.useApp();

  // 统一的错误处理函数 - 显示弹窗
  const showErrorModal = (error: any, operation: string) => {
    console.log("=== showErrorModal 被调用 ===");
    console.log("operation:", operation);

    let errorMessage = "";

    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      console.log("检测到 403 错误，errorData:", errorData);
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = "您没有执行此操作的权限";
      }

      console.log("准备显示 modal.error，title: 权限不足, content:", errorMessage);
      modal.error({
        title: "权限不足",
        content: errorMessage,
      });
      return;
    }

    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else {
      errorMessage = error.message || "操作失败";
    }

    modal.error({
      title: `${operation}失败`,
      content: errorMessage,
    });
  };

  // 获取错误消息文本（用于收集错误信息）
  const getErrorMessage = (error: any): string => {
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      if (errorData?.message) {
        return `权限不足：${errorData.message}`;
      }
      return "权限不足";
    }

    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    return error.message || "操作失败";
  };

  // 加载配置
  const loadSchema = async () => {
    try {
      const schemaData = await schemaService.getSchemaByName(schemaName);
      setSchema(schemaData);
    } catch (error: any) {
      message.error("加载配置失败: " + error.message);
    }
  };

  // 加载数据列表
  const loadData = async (page = 1, pageSize = 10) => {
    if (!schema) return;

    setLoading(true);
    try {
      const result = await dataService.getAll(schema.entity, page, pageSize);
      setDataList(result.data);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
      });
    } catch (error: any) {
      showErrorModal(error, "加载数据");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, [schemaName]);

  useEffect(() => {
    if (schema) {
      loadData();
    }
  }, [schema]);

  // 分页变化
  const handlePageChange = (page: number, pageSize: number) => {
    loadData(page, pageSize);
  };

  // 打开新建弹窗
  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: any) => {
    setEditingRecord(record);
    const formValues = { ...record };
    schema?.fields.forEach((field) => {
      if (field.type === "date" && formValues[field.key]) {
        formValues[field.key] = dayjs(formValues[field.key]);
      }
    });
    form.setFieldsValue(formValues);
    setModalVisible(true);
  };

  // 删除记录
  const handleDelete = async (record: any) => {
    if (!schema) return;

    try {
      await dataService.delete(schema.entity, record.id);
      message.success("删除成功");
      loadData(pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.log("=== handleDelete catch 被执行 ===");
      console.log("error:", error);
      console.log("error.response:", error.response);
      console.log("error.response?.status:", error.response?.status);
      showErrorModal(error, "删除");
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!schema) return;

    try {
      const values = await form.validateFields();

      // 转换日期格式
      const processedValues = { ...values };
      schema.fields.forEach((field) => {
        if (field.type === "date" && processedValues[field.key]) {
          processedValues[field.key] = dayjs(processedValues[field.key]).toISOString();
        }
      });

      if (editingRecord) {
        // 更新
        await dataService.update(schema.entity, editingRecord.id, processedValues);
        message.success("更新成功");
      } else {
        // 创建
        await dataService.create(schema.entity, processedValues);
        message.success("创建成功");
      }

      setModalVisible(false);
      loadData(pagination.current, pagination.pageSize);
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      showErrorModal(error, editingRecord ? "更新" : "创建");
    }
  };

  // 导出数据
  const handleExport = async () => {
    if (!schema) {
      message.warning("Schema 未加载");
      return;
    }

    try {
      message.loading({ content: "正在导出数据...", key: "export" });

      // 获取所有数据（不分页）
      const result = await dataService.getAll(schema.entity, 1, 999999);

      if (!result.data || result.data.length === 0) {
        message.warning({ content: "没有数据可导出", key: "export" });
        return;
      }

      exportToExcel(result.data, schema.fields, schema.name);
      message.success({ content: `成功导出 ${result.data.length} 条数据`, key: "export" });
    } catch (error: any) {
      message.error({ content: "导出失败: " + error.message, key: "export" });
    }
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    if (!schema) return;
    try {
      downloadTemplate(schema.fields, schema.name);
      message.success("模板下载成功");
    } catch (error: any) {
      message.error("下载模板失败: " + error.message);
    }
  };

  // 打开导入弹窗
  const handleOpenImport = () => {
    setFileList([]);
    setImportErrors([]);
    setImportModalVisible(true);
  };

  // 处理文件上传
  const handleImportFile = async () => {
    console.log("===== handleImportFile 被调用了 =====");
    console.log("schema:", schema);
    console.log("fileList:", fileList);
    console.log("fileList.length:", fileList.length);

    if (!schema || fileList.length === 0) {
      console.warn("条件不满足: schema=", schema, "fileList.length=", fileList.length);
      message.warning("请选择要导入的文件");
      return;
    }

    // 获取文件对象 - 可能是 File 对象本身，也可能在 originFileObj 中
    const fileItem = fileList[0];
    const file = (fileItem as any).originFileObj || fileItem;

    console.log("fileItem:", fileItem);
    console.log("file:", file);
    console.log("file 是否为 File 对象:", file instanceof File);

    if (!file || !(file instanceof File)) {
      console.error("无法获取有效的文件对象");
      message.error("无法读取文件，请重新选择");
      return;
    }

    try {
      setLoading(true);
      console.log("开始解析 Excel 文件...");
      const { data, errors } = await importFromExcel(file, schema.fields);

      console.log("解析结果:", { 数据条数: data.length, 错误数: errors.length });
      console.log("解析的数据:", data);

      if (errors.length > 0) {
        console.error("解析错误:", errors);
        setImportErrors(errors);
        if (data.length === 0) {
          message.error("Excel 解析失败，请修正错误后重试");
          setLoading(false);
          return;
        }
      }

      // 批量创建数据
      let successCount = 0;
      let failCount = 0;
      const createErrors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        try {
          console.log(`创建第 ${i + 1} 条数据:`, item);
          await dataService.create(schema.entity, item);
          successCount++;
        } catch (error: any) {
          failCount++;
          const errorMsg = getErrorMessage(error);
          const detailMsg = `第 ${i + 1} 条数据创建失败: ${errorMsg}`;
          console.error(detailMsg, error);
          createErrors.push(detailMsg);
        }
      }

      // 合并所有错误信息
      const allErrors = [...errors, ...createErrors];
      if (allErrors.length > 0) {
        setImportErrors(allErrors);
      }

      if (successCount > 0) {
        message.success(`成功导入 ${successCount} 条数据${failCount > 0 ? `，失败 ${failCount} 条` : ""}`);
        loadData(pagination.current, pagination.pageSize);
        if (failCount === 0 && errors.length === 0) {
          setImportModalVisible(false);
          setFileList([]);
          setImportErrors([]);
        }
      } else {
        message.error(`导入失败：所有数据都未能成功导入（共 ${data.length} 条）`);
      }
    } catch (error: any) {
      console.error("导入过程出错:", error);
      showErrorModal(error, "导入");
      const errorMsg = getErrorMessage(error);
      setImportErrors([`系统错误: ${errorMsg}`]);
    } finally {
      setLoading(false);
    }
  };

  if (!schema) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, width: "100%", boxSizing: "border-box" }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ margin: 0 }}>{schema.name}</h1>
        <Space>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleDownloadTemplate}
          >
            下载模板
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={handleOpenImport}
          >
            导入数据
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出数据
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建
          </Button>
        </Space>
      </div>

      <DynamicTable
        fields={schema.fields}
        dataSource={dataList}
        loading={loading}
        onEdit={handleEdit}
        onDelete={(record) => handleDelete(record)}
        pagination={{
          ...pagination,
          onChange: handlePageChange,
        }}
      />

      <Modal
        title={editingRecord ? "编辑数据" : "新建数据"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingRecord ? "更新" : "创建"}
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <DynamicForm fields={schema.fields} />
        </Form>
      </Modal>

      {/* 导入数据弹窗 */}
      <Modal
        title="导入数据"
        open={importModalVisible}
        onOk={handleImportFile}
        onCancel={() => setImportModalVisible(false)}
        okText="开始导入"
        cancelText="取消"
        width={600}
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Alert
            message="导入说明"
            description={
              <div>
                <p>1. 请先下载 Excel 模板，按照模板格式填写数据</p>
                <p>2. 必填字段不能为空</p>
                <p>3. 选择框字段请使用模板中提供的选项</p>
                <p>4. 日期格式: YYYY-MM-DD（例如: 2024-01-01）</p>
              </div>
            }
            type="info"
            showIcon
          />

          <Upload
            accept=".xlsx,.xls"
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([file as any]);
              return false;
            }}
            onRemove={() => {
              setFileList([]);
            }}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>选择 Excel 文件</Button>
          </Upload>

          {importErrors.length > 0 && (
            <Alert
              message="导入错误"
              description={
                <div style={{ maxHeight: 200, overflow: "auto" }}>
                  {importErrors.map((error, index) => (
                    <div key={index} style={{ color: "red" }}>
                      {error}
                    </div>
                  ))}
                </div>
              }
              type="error"
              showIcon
            />
          )}
        </Space>
      </Modal>
    </div>
  );
}

