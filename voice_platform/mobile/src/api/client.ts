import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// 请求拦截器：动态设置 baseURL + token
// Request interceptor: dynamic baseURL + token
api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  // 优先使用用户设置的服务器地址 / Use user-configured server URL
  config.baseURL = state.serverUrl || API_BASE_URL;
  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }
  return config;
});

// 响应拦截器：401 清除 token
// Response interceptor: clear token on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
