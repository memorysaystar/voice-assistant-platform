const { getBaseUrl } = require('./api');

// WebSocket 流式聊天封装
class ChatSocket {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnect = 10;
    this.baseDelay = 1000;
    this.onMessage = null;
    this.onStateChange = null;
  }

  connect() {
    const app = getApp();
    const token = app ? app.getToken() : null;
    if (!token) return;

    // 将 http/https 替换为 ws/wss
    const baseUrl = getBaseUrl().replace(/^http/, 'ws');
    const url = `${baseUrl}/chat/ws?token=${token}`;

    this.socket = wx.connectSocket({ url });

    wx.onSocketOpen(() => {
      console.log('[WS] 已连接 / Connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      if (this.onStateChange) this.onStateChange(true);
    });

    wx.onSocketMessage((event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessage) this.onMessage(data);
      } catch (e) {
        console.error('[WS] 解析消息失败 / Parse error:', e);
      }
    });

    wx.onSocketClose((event) => {
      console.log('[WS] 连接关闭 / Closed:', event.code);
      this.connected = false;
      if (this.onStateChange) this.onStateChange(false);
      // 非正常关闭时重连
      if (event.code !== 1000) {
        this._reconnect();
      }
    });

    wx.onSocketError((err) => {
      console.error('[WS] 连接错误 / Error:', err);
      this.connected = false;
    });
  }

  _reconnect() {
    if (this.reconnectAttempts >= this.maxReconnect) {
      console.log('[WS] 重连次数超限 / Max reconnect attempts reached');
      return;
    }
    const delay = Math.min(this.baseDelay * Math.pow(2, this.reconnectAttempts), 16000);
    this.reconnectAttempts++;
    console.log('[WS] %dms 后重连 (%d/%d) / Reconnecting in %dms (%d/%d)',
      delay, this.reconnectAttempts, this.maxReconnect,
      delay, this.reconnectAttempts, this.maxReconnect);
    setTimeout(() => this.connect(), delay);
  }

  send(content, conversationId) {
    if (!this.connected) {
      wx.showToast({ title: '未连接服务器', icon: 'none' });
      return false;
    }
    const msg = { content };
    if (conversationId) msg.conversation_id = conversationId;
    wx.sendSocketMessage({ data: JSON.stringify(msg) });
    return true;
  }

  close() {
    if (this.socket) {
      wx.closeSocket();
      this.socket = null;
    }
    this.connected = false;
  }
}

module.exports = { ChatSocket };
