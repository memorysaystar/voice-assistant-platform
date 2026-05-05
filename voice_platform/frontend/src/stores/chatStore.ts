import { create } from 'zustand';
import type { Conversation, Message } from '../api/chat';

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
  updateLastMessage: (content) => set((s) => {
    const msgs = s.messages;
    if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
      const last = msgs[msgs.length - 1];
      const updated = { ...last, content: last.content + content };
      // 只替换最后一条，复用前面的引用 / Only replace last item, reuse preceding refs
      const newMsgs = msgs.slice(0, -1);
      newMsgs.push(updated);
      return { messages: newMsgs };
    }
    return { messages: [...msgs, { id: Date.now(), role: 'assistant', content, tool_calls: null, audio_url: null, created_at: new Date().toISOString() }] };
  }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  addConversation: (conv) => set((s) => ({ conversations: [conv, ...s.conversations] })),
  removeConversation: (id) => set((s) => ({
    conversations: s.conversations.filter((c) => c.id !== id),
    currentConversation: s.currentConversation?.id === id ? null : s.currentConversation,
  })),
}));
