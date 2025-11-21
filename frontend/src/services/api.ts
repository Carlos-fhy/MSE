import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 自动添加当前系统ID到POST和PUT请求
    if ((config.method === 'post' || config.method === 'put') && config.data) {
      const currentSystemStr = localStorage.getItem('currentSystem');
      if (currentSystemStr) {
        try {
          const currentSystem = JSON.parse(currentSystemStr);
          // 如果请求数据中没有systemId，且当前系统有ID（不是config），则自动添加
          if (!config.data.systemId && currentSystem.id && currentSystem.id !== 'config') {
            config.data.systemId = currentSystem.id;
          }
        } catch (e) {
          console.error('Failed to parse currentSystem:', e);
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      console.error("API Error:", error.response.data);
    } else if (error.request) {
      console.error("Network Error:", error.message);
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
