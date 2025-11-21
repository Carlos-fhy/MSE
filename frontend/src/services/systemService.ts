import api from "./api";
import type {
  System,
  ApiResponse,
  CreateSystemDto,
  UpdateSystemDto,
} from "../types/schema";

export const systemService = {
  // 获取所有系统
  async getAllSystems(): Promise<System[]> {
    const response = await api.get<ApiResponse<System[]>>("/api/systems");
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to fetch systems");
  },

  // 获取单个系统
  async getSystemById(id: string): Promise<System> {
    const response = await api.get<ApiResponse<System>>(`/api/systems/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to fetch system");
  },

  // 创建系统
  async createSystem(data: CreateSystemDto): Promise<System> {
    const response = await api.post<ApiResponse<System>>("/api/systems", data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to create system");
  },

  // 更新系统
  async updateSystem(id: string, data: UpdateSystemDto): Promise<System> {
    const response = await api.put<ApiResponse<System>>(`/api/systems/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to update system");
  },

  // 删除系统
  async deleteSystem(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/api/systems/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to delete system");
    }
  },
};
