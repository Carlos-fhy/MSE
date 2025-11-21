import api from "./api";

export interface DashboardStats {
  workOrders: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    completionRate: number;
  };
  equipment: {
    total: number;
    running: number;
    maintenance: number;
    fault: number;
    idle: number;
  };
  today: {
    reports: number;
    qualityChecks: number;
  };
  recentWorkOrders: Array<{
    id: string;
    orderNo: string;
    productName: string;
    status: string;
    priority: string;
    quantity: number;
    equipment?: { equipmentName: string };
  }>;
}

export interface ReportTrend {
  date: string;
  count: number;
  workHours: number;
  quantity: number;
}

export interface QualityTrend {
  date: string;
  count: number;
  totalQty: number;
  passQty: number;
  failQty: number;
  passRate: number;
}

export interface TrendsData {
  reportTrends: ReportTrend[];
  qualityTrends: QualityTrend[];
}

export interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  type: "task";
  status: string;
  priority: string;
  equipment: string;
  quantity: number;
}

export const dashboardService = {
  // 获取统计数据
  getStats: async (systemId: string): Promise<DashboardStats> => {
    const response = await api.get(`/api/dashboard/stats?systemId=${systemId}`);
    return response.data.data;
  },

  // 获取趋势数据
  getTrends: async (systemId: string): Promise<TrendsData> => {
    const response = await api.get(`/api/dashboard/trends?systemId=${systemId}`);
    return response.data.data;
  },

  // 获取甘特图数据
  getGanttData: async (systemId: string): Promise<GanttTask[]> => {
    const response = await api.get(`/api/dashboard/gantt?systemId=${systemId}`);
    return response.data.data;
  },
};
