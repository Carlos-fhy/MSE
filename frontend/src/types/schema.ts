// Schema field type
export interface SchemaField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  defaultValue?: any;
}

// System interface
export interface System {
  id: string;
  name: string;
  description?: string;
  isAuthEnabled?: boolean;  // 是否启用认证
  schemas: Schema[];
  createdAt: string;
  updatedAt: string;
}

// Schema interface
export interface Schema {
  id: string;
  name: string;
  entity: string;
  fields: SchemaField[];
  category: "mes" | "custom";
  systemId?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create/Update Schema DTO
export interface CreateSchemaDto {
  name: string;
  entity: string;
  fields: SchemaField[];
  category?: "mes" | "custom";
  systemId?: string;
}

export interface UpdateSchemaDto {
  name?: string;
  entity?: string;
  fields?: SchemaField[];
  category?: "mes" | "custom";
  systemId?: string;
}

// Create/Update System DTO
export interface CreateSystemDto {
  name: string;
  description?: string;
  isAuthEnabled?: boolean;
  schemaIds?: string[];
}

export interface UpdateSystemDto {
  name?: string;
  description?: string;
  isAuthEnabled?: boolean;
  schemaIds?: string[];
}
