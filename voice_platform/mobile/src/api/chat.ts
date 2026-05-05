import api from './client';
import type { Conversation, Message, ChatResponse } from '../types';

export const chatApi = {
  sendMessage: (message: string, conversation_id?: number, model?: string) =>
    api.post<ChatResponse>('/chat', { message, conversation_id, model }),

  sendFunctionMessage: (message: string, conversation_id?: number) =>
    api.post('/chat/functions', { message, conversation_id }),

  getConversations: (skip = 0, limit = 50) =>
    api.get<Conversation[]>(`/conversations?skip=${skip}&limit=${limit}`),

  getConversation: (id: number) =>
    api.get<Conversation & { messages: Message[] }>(`/conversations/${id}`),

  createConversation: (title?: string, system_prompt?: string) =>
    api.post<Conversation>('/conversations', { title, system_prompt }),

  deleteConversation: (id: number) =>
    api.delete(`/conversations/${id}`),

  updateConversation: (id: number, data: { title?: string; system_prompt?: string }) =>
    api.put<Conversation>(`/conversations/${id}`, data),
};
