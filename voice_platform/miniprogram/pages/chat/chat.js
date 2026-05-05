const { chatApi, ttsApi } = require('../../utils/api');
const { ChatSocket } = require('../../utils/ws');
const { playAudioBuffer, TTS_VOICES } = require('../../utils/audio');

Page({
  data: {
    conversationId: null,
    messages: [],
    inputText: '',
    isStreaming: false,
    streamingContent: '',
    scrollToId: '',
    // TTS
    showTts: false,
    voices: TTS_VOICES,
    selectedVoice: '冰糖',
    ttsLoading: false,
  },

  ws: null,
  fullContent: '',

  onLoad(options) {
    const convId = options.conversationId ? Number(options.conversationId) : null;
    this.setData({ conversationId: convId });

    // 初始化 WebSocket
    this.ws = new ChatSocket();
    this.ws.onMessage = this.onWsMessage.bind(this);
    this.ws.onStateChange = (connected) => {
      if (!connected && this.data.isStreaming) {
        this.setData({ isStreaming: false });
      }
    };
    this.ws.connect();

    // 加载已有对话的消息
    if (convId) {
      this.loadMessages(convId);
    }
  },

  onUnload() {
    if (this.ws) this.ws.close();
  },

  async loadMessages(convId) {
    try {
      const res = await chatApi.getConversation(convId);
      this.setData({
        messages: res.data.messages || [],
        conversationId: convId,
      });
      this.scrollToBottom();
    } catch {}
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  onSend() {
    const text = this.data.inputText.trim();
    if (!text || this.data.isStreaming) return;

    // 添加用户消息到列表
    const userMsg = { id: Date.now(), role: 'user', content: text };
    this.setData({
      messages: [...this.data.messages, userMsg],
      inputText: '',
      isStreaming: true,
      streamingContent: '',
    });
    this.fullContent = '';
    this.scrollToBottom();

    // 通过 WebSocket 发送
    this.ws.send(text, this.data.conversationId);
  },

  onWsMessage(data) {
    switch (data.type) {
      case 'token':
        this.fullContent += data.content;
        this.setData({ streamingContent: this.fullContent });
        this.scrollToBottom();
        break;

      case 'conversation_id':
        if (!this.data.conversationId) {
          this.setData({ conversationId: data.id });
        }
        break;

      case 'done':
        // 校准最终内容
        const finalContent = data.full_content || this.fullContent;
        const assistantMsg = {
          id: data.message_id || Date.now(),
          role: 'assistant',
          content: finalContent,
        };
        this.setData({
          messages: [...this.data.messages, assistantMsg],
          isStreaming: false,
          streamingContent: '',
        });
        this.scrollToBottom();
        break;

      case 'error':
        wx.showToast({ title: data.message || '发生错误', icon: 'none' });
        this.setData({ isStreaming: false, streamingContent: '' });
        break;
    }
  },

  scrollToBottom() {
    this.setData({ scrollToId: 'msg-bottom' });
  },

  // TTS 相关
  toggleTts() {
    this.setData({ showTts: !this.data.showTts });
  },

  onSelectVoice(e) {
    this.setData({ selectedVoice: e.currentTarget.dataset.name });
  },

  async onTtsSynthesize() {
    // 取最后一条 assistant 消息的文本
    const msgs = this.data.messages;
    const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant');
    const text = lastAssistant ? lastAssistant.content : '';
    if (!text) {
      wx.showToast({ title: '没有可合成的文字', icon: 'none' });
      return;
    }

    this.setData({ ttsLoading: true });
    try {
      const res = await ttsApi.synthesize(text, this.data.selectedVoice);
      // res.data 是 ArrayBuffer
      await playAudioBuffer(res.data);
    } catch (err) {
      wx.showToast({ title: '合成失败', icon: 'none' });
    } finally {
      this.setData({ ttsLoading: false });
    }
  },
});
