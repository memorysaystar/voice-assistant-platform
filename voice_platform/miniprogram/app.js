App({
  globalData: {
    token: null,
    user: null,
    serverUrl: null,
  },

  onLaunch() {
    // 从本地存储恢复登录状态
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('user');
    const serverUrl = wx.getStorageSync('serverUrl');
    if (token) {
      this.globalData.token = token;
      this.globalData.user = user;
    }
    if (serverUrl) {
      this.globalData.serverUrl = serverUrl;
    }
  },

  setAuth(token, user) {
    this.globalData.token = token;
    this.globalData.user = user;
    wx.setStorageSync('token', token);
    wx.setStorageSync('user', user);
  },

  logout() {
    this.globalData.token = null;
    this.globalData.user = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('user');
  },

  getToken() {
    return this.globalData.token;
  },

  getUser() {
    return this.globalData.user;
  },

  getServerUrl() {
    return this.globalData.serverUrl || null;
  },

  setServerUrl(url) {
    this.globalData.serverUrl = url;
    wx.setStorageSync('serverUrl', url);
  },
});
