import apiClient from "./api";
import type {
  Schema,
  CreateSchemaDto,
  UpdateSchemaDto,
  ApiResponse,
} from "../types/schema";

export const schemaService = {
  // Get all schemas
  async getAllSchemas(): Promise<Schema[]> {
    const response = await apiClient.get<ApiResponse<Schema[]>>("/api/schemas");
    return response.data.data || [];
  },

  // Alias for getAllSchemas (for compatibility)
  async getSchemas(): Promise<Schema[]> {
    return this.getAllSchemas();
  },

  // Get schema by ID
  async getSchemaById(id: string): Promise<Schema> {
    const response = await apiClient.get<ApiResponse<Schema>>(
      `/api/schemas/${id}`
    );
    if (!response.data.data) {
      throw new Error("Schema not found");
    }
    return response.data.data;
  },

  // Get schema by name
  async getSchemaByName(name: string): Promise<Schema> {
    const response = await apiClient.get<ApiResponse<Schema>>(
      `/api/schemas/name/${name}`
    );
    if (!response.data.data) {
      throw new Error("Schema not found");
    }
    return response.data.data;
  },

  // Create schema
  async createSchema(data: CreateSchemaDto): Promise<Schema> {
    const response = await apiClient.post<ApiResponse<Schema>>(
      "/api/schemas",
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.error || "Failed to create schema");
    }
    return response.data.data;
  },

  // Update schema
  async updateSchema(id: string, data: UpdateSchemaDto): Promise<Schema> {
    const response = await apiClient.put<ApiResponse<Schema>>(
      `/api/schemas/${id}`,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.error || "Failed to update schema");
    }
    return response.data.data;
  },

  // Delete schema
  async deleteSchema(id: string): Promise<void> {
    await apiClient.delete(`/api/schemas/${id}`);
  },
};
