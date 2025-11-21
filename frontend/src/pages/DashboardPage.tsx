import { useState, useEffect, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Spin,
  message,
  Space,
  Button,
  Tabs,
} from "antd";
import {
  FileTextOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Column, Pie, Line } from "@ant-design/charts";
import { io, Socket } from "socket.io-client";
import { dashboardService, type DashboardStats, type TrendsData } from "../services/dashboardService";
import GanttPage from "./GanttPage";

interface DashboardPageProps {
  systemId: string;
}

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  pending: { text: "待处理", color: "default" },
  in_progress: { text: "进行中", color: "processing" },
  completed: { text: "已完成", color: "success" },
};

const PRIORITY_MAP: Record<string, { text: string; color: string }> = {
  low: { text: "低", color: "default" },
  normal: { text: "普通", color: "blue" },
  high: { text: "高", color: "orange" },
  urgent: { text: "紧急", color: "red" },
};

export default function DashboardPage({ systemId }: DashboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const socketRef = useRef<Socket | null>(null);

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, trendsData] = await Promise.all([
        dashboardService.getStats(systemId),
        dashboardService.getTrends(systemId),
      ]);
      setStats(statsData);
      setTrends(trendsData);
    } catch (error: any) {
      message.error("加载看板数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始化 WebSocket
  useEffect(() => {
    loadData();

    // 连接 WebSocket
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Dashboard connected to WebSocket");
      socket.emit("join-system", systemId);
    });

    // 监听数据更新事件
    socket.on("data-updated", () => {
      console.log("Received data update, refreshing...");
      loadData();
    });

    return () => {
      socket.emit("leave-system", systemId);
      socket.disconnect();
    };
  }, [systemId]);

  // 工单状态分布饼图配置
  const orderStatusPieConfig = {
    data: stats
      ? [
          { type: "待处理", value: stats.workOrders.pending },
          { type: "进行中", value: stats.workOrders.inProgress },
          { type: "已完成", value: stats.workOrders.completed },
        ]
      : [],
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      text: "value",
      style: { fontWeight: "bold" },
    },
    legend: { position: "bottom" as const },
    statistic: {
      title: { content: "工单总数" },
      content: { content: stats?.workOrders.total.toString() || "0" },
    },
  };

  // 设备状态分布饼图配置
  const equipmentStatusPieConfig = {
    data: stats
      ? [
          { type: "运行中", value: stats.equipment.running },
          { type: "空闲", value: stats.equipment.idle },
          { type: "维护中", value: stats.equipment.maintenance },
          { type: "故障", value: stats.equipment.fault },
        ]
      : [],
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      text: "value",
      style: { fontWeight: "bold" },
    },
    legend: { position: "bottom" as const },
    color: ["#52c41a", "#1890ff", "#faad14", "#ff4d4f"],
    statistic: {
      title: { content: "设备总数" },
      content: { content: stats?.equipment.total.toString() || "0" },
    },
  };

  // 报工趋势图配置
  const reportTrendConfig = {
    data: trends?.reportTrends || [],
    xField: "date",
    yField: "quantity",
    smooth: true,
    point: { size: 4, shape: "circle" },
    label: {},
    xAxis: {
      label: {
        formatter: (v: string) => v.substring(5), // 只显示月-日
      },
    },
  };

  // 质检合格率趋势图配置
  const qualityTrendConfig = {
    data: trends?.qualityTrends || [],
    xField: "date",
    yField: "passRate",
    smooth: true,
    point: { size: 4, shape: "circle" },
    yAxis: {
      max: 100,
      label: { formatter: (v: string) => `${v}%` },
    },
    xAxis: {
      label: {
        formatter: (v: string) => v.substring(5),
      },
    },
    areaStyle: { fillOpacity: 0.2 },
  };

  // 近7天工时柱状图配置
  const workHoursBarConfig = {
    data: trends?.reportTrends || [],
    xField: "date",
    yField: "workHours",
    label: {
      text: (d: { workHours: number }) => `${d.workHours}h`,
      textBaseline: "bottom" as const,
    },
    xAxis: {
      label: {
        formatter: (v: string) => v.substring(5),
      },
    },
  };

  // 最近工单表格列
  const recentOrderColumns = [
    {
      title: "工单编号",
      dataIndex: "orderNo",
      key: "orderNo",
      width: 140,
    },
    {
      title: "产品名称",
      dataIndex: "productName",
      key: "productName",
      ellipsis: true,
    },
    {
      title: "数量",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (status: string) => (
        <Tag color={STATUS_MAP[status]?.color}>{STATUS_MAP[status]?.text}</Tag>
      ),
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
      width: 80,
      render: (priority: string) => (
        <Tag color={PRIORITY_MAP[priority]?.color}>
          {PRIORITY_MAP[priority]?.text}
        </Tag>
      ),
    },
  ];

  if (loading && !stats) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large">
          <div style={{ padding: 50 }}>加载看板数据...</div>
        </Spin>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>生产看板</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "overview",
            label: "数据概览",
            children: (
              <>
                {/* 统计卡片 */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="工单总数"
                        value={stats?.workOrders.total || 0}
                        prefix={<FileTextOutlined />}
                        suffix={
                          <span style={{ fontSize: 14, color: "#52c41a" }}>
                            完成率 {stats?.workOrders.completionRate || 0}%
                          </span>
                        }
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="进行中工单"
                        value={stats?.workOrders.inProgress || 0}
                        prefix={<SyncOutlined spin />}
                        valueStyle={{ color: "#1890ff" }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="设备总数"
                        value={stats?.equipment.total || 0}
                        prefix={<ToolOutlined />}
                        suffix={
                          <span style={{ fontSize: 14, color: "#52c41a" }}>
                            运行 {stats?.equipment.running || 0}
                          </span>
                        }
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="今日报工"
                        value={stats?.today.reports || 0}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: "#52c41a" }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 图表 */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} md={12}>
                    <Card title="工单状态分布">
                      <Pie {...orderStatusPieConfig} height={300} />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="设备状态分布">
                      <Pie {...equipmentStatusPieConfig} height={300} />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} md={12}>
                    <Card title="近7天产量趋势">
                      <Line {...reportTrendConfig} height={250} />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="近7天工时统计">
                      <Column {...workHoursBarConfig} height={250} />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card title="近7天质检合格率">
                      <Line {...qualityTrendConfig} height={250} />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="最近工单">
                      <Table
                        dataSource={stats?.recentWorkOrders || []}
                        columns={recentOrderColumns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: "gantt",
            label: "甘特图排程",
            children: <GanttPage systemId={systemId} />,
          },
        ]}
      />
    </div>
  );
}
