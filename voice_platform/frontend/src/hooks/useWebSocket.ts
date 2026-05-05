import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { chatApi } from '../api/chat';

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1s

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const reconnectAttempts = useRef(0);
  const connectingRef = useRef(false);
  const token = useAuthStore((s) => s.token);
  const { addMessage, updateLastMessage, setIsStreaming, setCurrentConversation, setConversations, messages } = useChatStore();
  const [isConnected, setIsConnected] = useState(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const connect = useCallback(() => {
    // 防止重复连接 / Prevent duplicate connections
    if (!token) {
      console.log('[WS] 无token，跳过连接 / No token, skipping connection');
      return;
    }
    if (connectingRef.current) {
      console.log('[WS] 正在连接中，跳过 / Already connecting, skipping');
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('[WS] 已连接或正在连接，跳过 / Already connected or connecting, skipping');
      return;
    }

    connectingRef.current = true;

    // 开发环境直连后端，避免Vite代理WebSocket问题
    // Dev: connect directly to backend to avoid Vite proxy WebSocket issues
    const wsUrl = import.meta.env.DEV
      ? `ws://localhost:8000/chat/ws?token=${token}`
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/chat/ws?token=${token}`;

    console.log('[WS] 正在连接... (第%d次尝试) / Connecting... (attempt %d)', reconnectAttempts.current + 1, reconnectAttempts.current + 1);

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      console.error('[WS] 创建WebSocket失败 / Failed to create WebSocket:', err);
      connectingRef.current = false;
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      console.log('[WS] 已连接 / Connected');
      connectingRef.current = false;
      reconnectAttempts.current = 0; // 重置重连计数 / Reset reconnect counter
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'token':
            updateLastMessage(data.content);
            break;
          case 'done':
            // 无条件用 full_content 校准最终内容，防止流式token丢失
            // Always calibrate with full_content to prevent token loss
            if (data.full_content) {
              // 直接从 store 获取最新状态，避免 ref 过期
              // Read directly from store to avoid stale ref
              const msgs = useChatStore.getState().messages;
              if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
                const current = msgs[msgs.length - 1].content;
                if (current !== data.full_content) {
                  console.log('[WS] 内容校准: %d字符 -> %d字符 / Content calibrated: %d -> %d chars', current?.length || 0, data.full_content.length, current?.length || 0, data.full_content.length);
                }
                // 无条件设置 full_content，确保最终内容正确
                // Unconditionally set full_content to ensure correct final content
                const updated = { ...msgs[msgs.length - 1], content: data.full_content };
                const newMsgs = msgs.slice(0, -1);
                newMsgs.push(updated);
                useChatStore.getState().setMessages(newMsgs);
              }
            }
            setIsStreaming(false);
            break;
          case 'conversation_id':
            // 新对话创建，更新当前对话并刷新侧边栏
            // New conversation created, update current and refresh sidebar
            console.log('[WS] 对话已创建: id=%d / Conversation created: id=%d', data.id, data.id);
            chatApi.getConversation(data.id).then((r) => {
              setCurrentConversation(r.data);
            }).catch(() => {});
            chatApi.getConversations().then((r) => {
              setConversations(r.data);
            }).catch(() => {});
            break;
          case 'error':
            console.error('[WS] 服务端错误 / Server error:', data.message);
            setIsStreaming(false);
            break;
        }
      } catch (err) {
        console.error('[WS] 解析消息失败 / Failed to parse message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('[WS] 连接关闭: code=%d / Disconnected: code=%d', event.code, event.code);
      wsRef.current = null;
      connectingRef.current = false;
      setIsConnected(false);

      // 仅在组件挂载状态下自动重连（非正常关闭才重连）
      // Only auto-reconnect while mounted and on abnormal close
      if (mountedRef.current && event.code !== 1000) {
        scheduleReconnect();
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] 连接错误 / Connection error:', err);
      connectingRef.current = false;
    };

    wsRef.current = ws;
  }, [token, updateLastMessage, setIsStreaming, setCurrentConversation, setConversations]);

  // 指数退避重连 / Exponential backoff reconnect
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[WS] 已达最大重连次数%d，停止重连 / Max reconnect attempts (%d) reached, stopping', MAX_RECONNECT_ATTEMPTS, MAX_RECONNECT_ATTEMPTS);
      return;
    }

    const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current), 16000);
    reconnectAttempts.current++;
    console.log('[WS] %dms后重连 (第%d次) / Reconnecting in %dms (attempt %d)', delay, reconnectAttempts.current, delay, reconnectAttempts.current);

    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000); // 正常关闭 / Normal close
        wsRef.current = null;
      }
      connectingRef.current = false;
    };
  }, [connect]);

  // 等待连接就绪 / Wait for connection to be ready
  const waitForConnection = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      // 如果没有连接，先触发连接 / If not connected, trigger connection
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        connect();
      }

      // 等待最多5秒 / Wait up to 5 seconds
      let elapsed = 0;
      const interval = 100;
      const timer = setInterval(() => {
        elapsed += interval;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(timer);
          resolve(true);
        } else if (elapsed >= 5000 || !mountedRef.current) {
          clearInterval(timer);
          resolve(false);
        }
      }, interval);
    });
  }, [connect]);

  const sendMessage = useCallback(async (content: string, conversationId?: number) => {
    // 先添加消息到UI / Add messages to UI first
    addMessage({
      id: Date.now(),
      role: 'user',
      content,
      tool_calls: null,
      audio_url: null,
      created_at: new Date().toISOString(),
    });

    addMessage({
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      tool_calls: null,
      audio_url: null,
      created_at: new Date().toISOString(),
    });

    setIsStreaming(true);

    // 等待连接就绪 / Wait for connection to be ready
    const connected = await waitForConnection();
    if (!connected) {
      console.error('[WS] 连接超时，无法发送消息 / Connection timeout, cannot send message');
      updateLastMessage('连接失败，请刷新页面重试 / Connection failed, please refresh and try again');
      setIsStreaming(false);
      return;
    }

    wsRef.current!.send(JSON.stringify({ content, conversation_id: conversationId }));
  }, [addMessage, setIsStreaming, waitForConnection, updateLastMessage]);

  return { sendMessage, isConnected };
}
