import { create } from 'zustand';
import type { Conversation, Message } from '../types';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  setConversations: (convs: Conversation[]) => void;
  setCurrentConversation: (conv: Conversation | null) => void;
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  updateLastMessage: (content: string) => void;
  setIsStreaming: (v: boolean) => void;
  addConversation: (conv: Conversation) => void;
  removeConversation: (id: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isStreaming: false,
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (currentConversation) => set({ currentConversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  // 追加 token 到最后一条助手消息（与 web 版一致的优化）
  // Append token to last assistant message (same optimization as web)
  updateLastMessage: (content) => set((s) => {
    const msgs = s.messages;
    if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
      const last = msgs[msgs.length - 1];
      const updated = { ...last, content: last.content + content };
      const newMsgs = msgs.slice(0, -1);
      newMsgs.push(updated);
      return { messages: newMsgs };
    }
    return {
      messages: [...msgs, {
        id: Date.now(),
        role: 'assistant',
        content,
        tool_calls: null,
        audio_url: null,
        created_at: new Date().toISOString(),
      }],
    };
  }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  addConversation: (conv) => set((s) => ({ conversations: [conv, ...s.conversations] })),
  removeConversation: (id) => set((s) => ({
    conversations: s.conversations.filter((c) => c.id !== id),
    currentConversation: s.currentConversation?.id === id ? null : s.currentConversation,
  })),
}));
