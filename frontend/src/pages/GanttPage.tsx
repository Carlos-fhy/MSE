import { useState, useEffect } from "react";
import { Card, Spin, message, Tag, Empty, Select, Space } from "antd";
import { Gantt, ViewMode } from "gantt-task-react";
import type { Task } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { dashboardService, type GanttTask } from "../services/dashboardService";

interface GanttPageProps {
  systemId: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#d9d9d9",
  in_progress: "#1890ff",
  completed: "#52c41a",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#d9d9d9",
  normal: "#1890ff",
  high: "#faad14",
  urgent: "#ff4d4f",
};

export default function GanttPage({ systemId }: GanttPageProps) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
  const [rawData, setRawData] = useState<GanttTask[]>([]);

  useEffect(() => {
    loadData();
  }, [systemId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getGanttData(systemId);
      setRawData(data);

      // 转换为 gantt-task-react 格式
      const ganttTasks: Task[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        start: new Date(item.start),
        end: new Date(item.end),
        progress: item.progress,
        type: "task",
        styles: {
          backgroundColor: STATUS_COLORS[item.status] || "#1890ff",
          progressColor: PRIORITY_COLORS[item.priority] || "#1890ff",
          progressSelectedColor: PRIORITY_COLORS[item.priority] || "#1890ff",
        },
      }));

      setTasks(ganttTasks);
    } catch (error: any) {
      message.error("加载甘特图数据失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 自定义任务列表组件
  const TaskListHeader: React.FC<{
    headerHeight: number;
    rowWidth: string;
  }> = ({ headerHeight, rowWidth }) => {
    return (
      <div
        style={{
          height: headerHeight,
          width: rowWidth,
          display: "flex",
          alignItems: "center",
          fontWeight: "bold",
          borderBottom: "1px solid #e8e8e8",
          padding: "0 12px",
          backgroundColor: "#fafafa",
        }}
      >
        工单信息
      </div>
    );
  };

  const TaskListTable: React.FC<{
    rowHeight: number;
    rowWidth: string;
    tasks: Task[];
  }> = ({ rowHeight, rowWidth, tasks: displayTasks }) => {
    return (
      <div style={{ width: rowWidth }}>
        {displayTasks.map((task, index) => {
          const rawTask = rawData.find((r) => r.id === task.id);
          return (
            <div
              key={task.id}
              style={{
                height: rowHeight,
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #e8e8e8",
                padding: "0 12px",
                backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
              }}
            >
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {task.name}
                </div>
                <div style={{ fontSize: 11, color: "#999" }}>
                  {rawTask?.equipment} | 数量: {rawTask?.quantity}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin>
          <div style={{ padding: 50 }}>加载甘特图...</div>
        </Spin>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <Empty description="暂无排程数据" />
      </Card>
    );
  }

  return (
    <Card
      title="工单排程甘特图"
      extra={
        <Space>
          <span>视图模式:</span>
          <Select
            value={viewMode}
            onChange={setViewMode}
            style={{ width: 100 }}
            options={[
              { label: "日", value: ViewMode.Day },
              { label: "周", value: ViewMode.Week },
              { label: "月", value: ViewMode.Month },
            ]}
          />
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>图例:</span>
          <Tag color="#d9d9d9">待处理</Tag>
          <Tag color="#1890ff">进行中</Tag>
          <Tag color="#52c41a">已完成</Tag>
          <span style={{ marginLeft: 16 }}>优先级:</span>
          <Tag color="#d9d9d9">低</Tag>
          <Tag color="#1890ff">普通</Tag>
          <Tag color="#faad14">高</Tag>
          <Tag color="#ff4d4f">紧急</Tag>
        </Space>
      </div>

      <div style={{ overflow: "auto" }}>
        <Gantt
          tasks={tasks}
          viewMode={viewMode}
          locale="zh-CN"
          listCellWidth="200px"
          columnWidth={viewMode === ViewMode.Month ? 200 : viewMode === ViewMode.Week ? 100 : 50}
          ganttHeight={400}
          TaskListHeader={TaskListHeader}
          TaskListTable={TaskListTable}
          todayColor="rgba(24, 144, 255, 0.1)"
          barCornerRadius={3}
          barFill={60}
        />
      </div>
    </Card>
  );
}
