import api from './client';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  mimo_api_key: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { email, password }),

  register: (username: string, email: string, password: string) =>
    api.post<TokenResponse>('/auth/register', { username, email, password }),

  getMe: () => api.get<User>('/auth/me'),

  updateMe: (data: { username?: string; email?: string; mimo_api_key?: string }) =>
    api.put<User>('/auth/me', data),
};
