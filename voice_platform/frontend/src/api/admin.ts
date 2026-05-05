import api from './client';

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  conversation_count: number;
  usage_count: number;
}

export interface AnalyticsOverview {
  total_users: number;
  active_users: number;
  total_conversations: number;
  total_messages: number;
  total_api_calls: number;
  calls_today: number;
}

export interface UsageByDay {
  date: string;
  count: number;
}

export interface UsageByAction {
  action: string;
  count: number;
}

export interface ConfigItem {
  key: string;
  value: string;
  description: string | null;
}

export const adminApi = {
  getUsers: (skip = 0, limit = 50, search = '') =>
    api.get<UserListItem[]>(`/admin/users?skip=${skip}&limit=${limit}&search=${search}`),

  getUser: (id: number) => api.get<UserListItem>(`/admin/users/${id}`),

  updateUser: (id: number, data: { role?: string; is_active?: boolean }) =>
    api.put<UserListItem>(`/admin/users/${id}`, data),

  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  getOverview: () => api.get<AnalyticsOverview>('/admin/analytics/overview'),

  getUsageByDay: (days = 30) => api.get<UsageByDay[]>(`/admin/analytics/usage?days=${days}`),

  getUsageByAction: () => api.get<UsageByAction[]>('/admin/analytics/actions'),

  getConfig: () => api.get<ConfigItem[]>('/admin/config'),

  updateConfig: (key: string, value: string) =>
    api.put<ConfigItem>(`/admin/config/${key}`, { value }),
};
