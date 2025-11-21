import axios from "./api";

// Token管理
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const tokenManager = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser(): any {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user: any): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  },

  clear(): void {
    this.removeToken();
    this.removeUser();
  },
};

// 登录
export interface LoginParams {
  username: string;
  password: string;
  systemId?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    realName: string;
    email?: string;
    roleId: string;
    systemId?: string;
    isActive: boolean;
    role: {
      id: string;
      name: string;
      description?: string;
      permissions: string;
    };
    permissions: string[];
  };
}

export const authService = {
  // 登录
  async login(params: LoginParams): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>("/api/auth/login", params);

    // 保存token和用户信息
    tokenManager.setToken(response.data.token);
    tokenManager.setUser(response.data.user);

    return response.data;
  },

  // 登出
  async logout(): Promise<void> {
    try {
      await axios.post("/api/auth/logout");
    } finally {
      tokenManager.clear();
    }
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<LoginResponse["user"]> {
    const response = await axios.get<{ user: LoginResponse["user"] }>("/api/auth/me");

    // 更新本地存储的用户信息
    tokenManager.setUser(response.data.user);

    return response.data.user;
  },

  // 修改密码
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await axios.post("/api/auth/change-password", {
      oldPassword,
      newPassword,
    });
  },

  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!tokenManager.getToken();
  },

  // 检查是否有某个权限
  hasPermission(permission: string): boolean {
    const user = tokenManager.getUser();
    if (!user || !user.permissions) {
      return false;
    }

    const permissions: string[] = user.permissions;

    // 完全匹配
    if (permissions.includes(permission)) {
      return true;
    }

    // 通配符匹配：user:* 匹配 user:create, user:read 等
    const prefix = permission.split(":")[0];
    if (permissions.includes(`${prefix}:*`)) {
      return true;
    }

    // 超级权限：* 匹配所有
    if (permissions.includes("*")) {
      return true;
    }

    return false;
  },

  // 检查是否有所有权限
  hasAllPermissions(...permissions: string[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  },

  // 检查是否有任一权限
  hasAnyPermission(...permissions: string[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  },

  // 检查当前用户是否可以访问指定系统
  canAccessSystem(systemId: string): boolean {
    const user = tokenManager.getUser();
    if (!user) {
      return false;
    }

    // 超级管理员（systemId 为 null）可以访问任何系统
    if (!user.systemId) {
      return true;
    }

    // 普通用户只能访问自己所属的系统
    return user.systemId === systemId;
  },
};

// 配置axios拦截器，自动添加token
axios.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器，处理401错误
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地数据
      tokenManager.clear();
      // 如果不在登录页，跳转到登录页
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
