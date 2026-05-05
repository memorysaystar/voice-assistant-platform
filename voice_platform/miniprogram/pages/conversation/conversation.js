const { chatApi } = require('../../utils/api');

Page({
  data: {
    conversations: [],
    loading: true,
  },

  onShow() {
    const app = getApp();
    if (!app.getToken()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.loadConversations();
  },

  async loadConversations() {
    this.setData({ loading: true });
    try {
      const res = await chatApi.getConversations();
      this.setData({ conversations: res.data });
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onNewChat() {
    wx.navigateTo({ url: '/pages/chat/chat' });
  },

  onTapConv(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/chat/chat?conversationId=${id}` });
  },

  onLongPress(e) {
    const id = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['删除对话'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.deleteConversation(id);
        }
      },
    });
  },

  async deleteConversation(id) {
    try {
      await chatApi.deleteConversation(id);
      this.setData({
        conversations: this.data.conversations.filter((c) => c.id !== id),
      });
      wx.showToast({ title: '已删除', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },
});
