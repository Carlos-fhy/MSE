import apiClient from "./api";

export const dataService = {
  // Get all records for an entity
  async getAll(
    entity: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ): Promise<{ data: any[]; pagination: any }> {
    const params: any = { page, pageSize };
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const response = await apiClient.get(`/api/data/${entity}`, { params });
    return {
      data: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  // Get single record by ID
  async getById(entity: string, id: string): Promise<any> {
    const response = await apiClient.get(`/api/data/${entity}/${id}`);
    return response.data.data;
  },

  // Create new record
  async create(entity: string, data: any): Promise<any> {
    const response = await apiClient.post(`/api/data/${entity}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to create record");
    }
    return response.data.data;
  },

  // Update record
  async update(entity: string, id: string, data: any): Promise<any> {
    const response = await apiClient.put(`/api/data/${entity}/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to update record");
    }
    return response.data.data;
  },

  // Delete record
  async delete(entity: string, id: string): Promise<void> {
    await apiClient.delete(`/api/data/${entity}/${id}`);
  },
};
