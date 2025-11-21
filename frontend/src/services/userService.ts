import axios from "./api";

// 用户类型定义
export interface User {
  id: string;
  username: string;
  realName: string;
  email?: string;
  description?: string;  // 备注（如：组长、王工、李工等）
  roleId: string;
  systemId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role?: Role;
  system?: {
    id: string;
    name: string;
  };
}

// 角色类型定义
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string;
  systemId?: string;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

// 用户服务
export const userService = {
  // 获取用户列表
  async getUsers(params?: {
    systemId?: string;
    roleId?: string;
    isActive?: boolean;
  }): Promise<User[]> {
    const response = await axios.get<User[]>("/api/users", { params });
    return response.data;
  },

  // 获取单个用户
  async getUserById(id: string): Promise<User> {
    const response = await axios.get<User>(`/api/users/${id}`);
    return response.data;
  },

  // 创建用户
  async createUser(data: {
    username: string;
    password: string;
    realName: string;
    email?: string;
    roleId: string;
    systemId?: string;
  }): Promise<User> {
    const response = await axios.post<User>("/api/users", data);
    return response.data;
  },

  // 更新用户
  async updateUser(
    id: string,
    data: {
      username?: string;
      realName?: string;
      email?: string;
      roleId?: string;
      systemId?: string;
      isActive?: boolean;
    }
  ): Promise<User> {
    const response = await axios.put<User>(`/api/users/${id}`, data);
    return response.data;
  },

  // 删除用户
  async deleteUser(id: string): Promise<void> {
    await axios.delete(`/api/users/${id}`);
  },

  // 重置用户密码
  async resetPassword(id: string, newPassword: string): Promise<void> {
    await axios.post(`/api/users/${id}/reset-password`, { newPassword });
  },
};

// 角色服务
export const roleService = {
  // 获取角色列表
  async getRoles(params?: { systemId?: string }): Promise<Role[]> {
    const response = await axios.get<Role[]>("/api/roles", { params });
    return response.data;
  },

  // 获取单个角色
  async getRoleById(id: string): Promise<Role> {
    const response = await axios.get<Role>(`/api/roles/${id}`);
    return response.data;
  },

  // 创建角色
  async createRole(data: {
    name: string;
    description?: string;
    permissions: string[];
    systemId?: string;
  }): Promise<Role> {
    const response = await axios.post<Role>("/api/roles", data);
    return response.data;
  },

  // 更新角色
  async updateRole(
    id: string,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
    }
  ): Promise<Role> {
    const response = await axios.put<Role>(`/api/roles/${id}`, data);
    return response.data;
  },

  // 删除角色
  async deleteRole(id: string): Promise<void> {
    await axios.delete(`/api/roles/${id}`);
  },
};

// 权限常量
export const PERMISSIONS = {
  // 系统权限
  SYSTEM_ALL: "system:*",
  SYSTEM_READ: "system:read",
  SYSTEM_CREATE: "system:create",
  SYSTEM_UPDATE: "system:update",
  SYSTEM_DELETE: "system:delete",

  // 用户权限
  USER_ALL: "user:*",
  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // 角色权限
  ROLE_ALL: "role:*",
  ROLE_READ: "role:read",
  ROLE_CREATE: "role:create",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",

  // Schema权限
  SCHEMA_ALL: "schema:*",
  SCHEMA_READ: "schema:read",
  SCHEMA_CREATE: "schema:create",
  SCHEMA_UPDATE: "schema:update",
  SCHEMA_DELETE: "schema:delete",

  // 数据权限
  DATA_ALL: "data:*",
  DATA_READ: "data:read",
  DATA_CREATE: "data:create",
  DATA_UPDATE: "data:update",
  DATA_DELETE: "data:delete",
};

// 权限分组（用于UI展示）
export const PERMISSION_GROUPS = [
  {
    label: "系统管理",
    permissions: [
      { value: "system:read", label: "查看系统" },
      { value: "system:create", label: "创建系统" },
      { value: "system:update", label: "更新系统" },
      { value: "system:delete", label: "删除系统" },
      { value: "system:*", label: "系统所有权限" },
    ],
  },
  {
    label: "用户管理",
    permissions: [
      { value: "user:read", label: "查看用户" },
      { value: "user:create", label: "创建用户" },
      { value: "user:update", label: "更新用户" },
      { value: "user:delete", label: "删除用户" },
      { value: "user:*", label: "用户所有权限" },
    ],
  },
  {
    label: "角色管理",
    permissions: [
      { value: "role:read", label: "查看角色" },
      { value: "role:create", label: "创建角色" },
      { value: "role:update", label: "更新角色" },
      { value: "role:delete", label: "删除角色" },
      { value: "role:*", label: "角色所有权限" },
    ],
  },
  {
    label: "配置管理",
    permissions: [
      { value: "schema:read", label: "查看配置" },
      { value: "schema:create", label: "创建配置" },
      { value: "schema:update", label: "更新配置" },
      { value: "schema:delete", label: "删除配置" },
      { value: "schema:*", label: "配置所有权限" },
    ],
  },
  {
    label: "数据管理",
    permissions: [
      { value: "data:read", label: "查看数据" },
      { value: "data:create", label: "创建数据" },
      { value: "data:update", label: "更新数据" },
      { value: "data:delete", label: "删除数据" },
      { value: "data:*", label: "数据所有权限" },
    ],
  },
];
