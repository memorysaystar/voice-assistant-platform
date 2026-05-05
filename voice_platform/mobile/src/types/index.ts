// 用户 / User
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  mimo_api_key: string | null;
  created_at: string;
}

// 认证响应 / Token response
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// 对话 / Conversation
export interface Conversation {
  id: number;
  title: string;
  model: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

// 消息 / Message
export interface Message {
  id: number;
  role: string;
  content: string | null;
  tool_calls: any[] | null;
  audio_url: string | null;
  created_at: string;
}

// 聊天响应 / Chat response
export interface ChatResponse {
  response: string;
  conversation_id: number;
  message_id: number;
}

// 语音信息 / Voice info
export interface VoiceInfo {
  name: string;
  type: string;
  description: string;
}

// WebSocket 消息类型 / WebSocket message types
export type WsMessage =
  | { type: 'token'; content: string }
  | { type: 'done'; full_content: string; message_id: number; conversation_id: number }
  | { type: 'conversation_id'; id: number }
  | { type: 'error'; message: string };

// 管理员：用户列表项 / Admin: user list item
export interface UserListItem {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

// 管理员：分析概览 / Admin: analytics overview
export interface AnalyticsOverview {
  total_users: number;
  active_users: number;
  total_conversations: number;
  total_messages: number;
  total_api_calls: number;
  calls_today: number;
}

// 管理员：使用统计 / Admin: usage stat
export interface UsageStat {
  date: string;
  count: number;
}

// 管理员：操作统计 / Admin: action stat
export interface ActionStat {
  action: string;
  count: number;
}

// 管理员：系统配置 / Admin: system config
export interface SystemConfig {
  key: string;
  value: string;
  description: string;
}
