const { authApi } = require('../../utils/api');

Page({
  data: {
    username: '',
    email: '',
    password: '',
    loading: false,
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }); },
  onEmailInput(e) { this.setData({ email: e.detail.value }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },

  async onRegister() {
    const { username, email, password } = this.data;
    if (!username.trim() || !email.trim() || !password) {
      wx.showToast({ title: '请填写所有字段', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const res = await authApi.register(username.trim(), email.trim(), password);
      const { access_token, user } = res.data;
      const app = getApp();
      app.setAuth(access_token, user);
      wx.switchTab({ url: '/pages/conversation/conversation' });
    } catch (err) {
      wx.showToast({ title: err.message || '注册失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goLogin() {
    wx.navigateBack();
  },
});
