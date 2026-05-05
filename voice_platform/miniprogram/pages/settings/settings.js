const { authApi, getBaseUrl } = require('../../utils/api');

Page({
  data: {
    serverUrl: '',
    username: '',
    email: '',
    apiKey: '',
    userEmail: '',
    userRole: '',
    loading: false,
  },

  onShow() {
    const app = getApp();
    const user = app.getUser();
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.setData({
      serverUrl: app.getServerUrl() || getBaseUrl(),
      username: user.username || '',
      email: user.email || '',
      apiKey: user.mimo_api_key || '',
      userEmail: user.email || '',
      userRole: user.role || '',
    });
  },

  onServerInput(e) { this.setData({ serverUrl: e.detail.value }); },
  onUsernameInput(e) { this.setData({ username: e.detail.value }); },
  onEmailInput(e) { this.setData({ email: e.detail.value }); },
  onApiKeyInput(e) { this.setData({ apiKey: e.detail.value }); },

  onApplyServer() {
    const url = this.data.serverUrl.trim().replace(/\/+$/, '');
    if (!url) {
      wx.showToast({ title: '请输入服务器地址', icon: 'none' });
      return;
    }
    getApp().setServerUrl(url);
    wx.showToast({ title: '已更新', icon: 'success' });
  },

  async onSave() {
    this.setData({ loading: true });
    try {
      const res = await authApi.updateMe({
        username: this.data.username.trim() || undefined,
        email: this.data.email.trim() || undefined,
        mimo_api_key: this.data.apiKey.trim() || undefined,
      });
      const app = getApp();
      app.globalData.user = res.data;
      wx.setStorageSync('user', res.data);
      this.setData({
        userEmail: res.data.email,
        userRole: res.data.role,
      });
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          getApp().logout();
          wx.redirectTo({ url: '/pages/login/login' });
        }
      },
    });
  },
});
