import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { chatApi } from '../api/chat';
import { API_BASE_URL, WS_MAX_RECONNECT_ATTEMPTS, WS_BASE_RECONNECT_DELAY } from '../utils/constants';

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
    if (!token) return;
    if (connectingRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    connectingRef.current = true;
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/chat/ws?token=${token}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (err) {
      connectingRef.current = false;
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      connectingRef.current = false;
      reconnectAttempts.current = 0;
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
            if (data.full_content) {
              const msgs = useChatStore.getState().messages;
              if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
                const updated = { ...msgs[msgs.length - 1], content: data.full_content };
                const newMsgs = msgs.slice(0, -1);
                newMsgs.push(updated);
                useChatStore.getState().setMessages(newMsgs);
              }
            }
            setIsStreaming(false);
            break;
          case 'conversation_id':
            chatApi.getConversation(data.id).then((r) => setCurrentConversation(r.data)).catch(() => {});
            chatApi.getConversations().then((r) => setConversations(r.data)).catch(() => {});
            break;
          case 'error':
            setIsStreaming(false);
            break;
        }
      } catch {}
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      connectingRef.current = false;
      setIsConnected(false);
      if (mountedRef.current && event.code !== 1000) {
        scheduleReconnect();
      }
    };

    ws.onerror = () => {
      connectingRef.current = false;
    };

    wsRef.current = ws;
  }, [token, updateLastMessage, setIsStreaming, setCurrentConversation, setConversations]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= WS_MAX_RECONNECT_ATTEMPTS) return;
    const delay = Math.min(WS_BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current), 16000);
    reconnectAttempts.current++;
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
        wsRef.current.close(1000);
        wsRef.current = null;
      }
      connectingRef.current = false;
    };
  }, [connect]);

  // 前后台切换时重连 / Reconnect when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && mountedRef.current) {
        connect();
      }
    });
    return () => sub.remove();
  }, [connect]);

  const waitForConnection = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        connect();
      }
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

    const connected = await waitForConnection();
    if (!connected) {
      updateLastMessage('连接失败，请重试 / Connection failed, please retry');
      setIsStreaming(false);
      return;
    }
    wsRef.current!.send(JSON.stringify({ content, conversation_id: conversationId }));
  }, [addMessage, setIsStreaming, waitForConnection, updateLastMessage]);

  return { sendMessage, isConnected };
}
