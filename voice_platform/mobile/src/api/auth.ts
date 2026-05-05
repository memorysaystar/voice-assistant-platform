import api from './client';
import type { User, TokenResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { email, password }),

  register: (username: string, email: string, password: string) =>
    api.post<TokenResponse>('/auth/register', { username, email, password }),

  getMe: () => api.get<User>('/auth/me'),

  updateMe: (data: { username?: string; email?: string; mimo_api_key?: string }) =>
    api.put<User>('/auth/me', data),
};
