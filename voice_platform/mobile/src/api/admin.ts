import api from './client';
import type { UserListItem, AnalyticsOverview, UsageStat, ActionStat, SystemConfig } from '../types';

export const adminApi = {
  // 用户管理 / User management
  getUsers: (skip = 0, limit = 50, search?: string) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (search) params.set('search', search);
    return api.get<UserListItem[]>(`/admin/users?${params}`);
  },

  getUser: (id: number) => api.get<UserListItem>(`/admin/users/${id}`),

  updateUser: (id: number, data: { role?: string; is_active?: boolean }) =>
    api.put<UserListItem>(`/admin/users/${id}`, data),

  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  // 分析统计 / Analytics
  getOverview: () => api.get<AnalyticsOverview>('/admin/analytics/overview'),

  getUsage: (days = 30) => api.get<UsageStat[]>(`/admin/analytics/usage?days=${days}`),

  getActions: () => api.get<ActionStat[]>('/admin/analytics/actions'),

  // 系统配置 / System config
  getConfig: () => api.get<SystemConfig[]>('/admin/config'),

  updateConfig: (key: string, value: string) =>
    api.put<SystemConfig>(`/admin/config/${key}`, { value }),
};
