Page({
  data: {
    email: '',
    password: '',
    loading: false,
    debugLog: '',
  },

  onEmailInput(e) { this.setData({ email: e.detail.value }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },

  onLogin() {
    const { email, password } = this.data;
    if (!email.trim() || !password) {
      wx.showToast({ title: '请填写邮箱和密码', icon: 'none' });
      return;
    }
    this.setData({ loading: true, debugLog: '发送请求中...' });

    const that = this;
    const reqTask = wx.request({
      url: 'http://127.0.0.1:8000/auth/login',
      method: 'POST',
      data: { email: email.trim(), password: password },
      header: { 'Content-Type': 'application/json' },
      timeout: 10000,
      success: function (res) {
        that.setData({ debugLog: '成功: ' + res.statusCode });
        if (res.statusCode === 200 && res.data && res.data.access_token) {
          getApp().setAuth(res.data.access_token, res.data.user);
          wx.switchTab({ url: '/pages/conversation/conversation' });
        } else {
          wx.showToast({ title: '登录失败', icon: 'none' });
        }
      },
      fail: function (err) {
        that.setData({ debugLog: '失败: ' + JSON.stringify(err) });
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: function () {
        that.setData({ loading: false });
      },
    });

    // 5秒后检查请求状态
    setTimeout(function () {
      if (that.data.loading) {
        that.setData({ debugLog: '超时! readyState=' + (reqTask ? '存在' : 'null') });
        if (reqTask) {
          reqTask.abort();
          that.setData({ loading: false, debugLog: '已取消请求' });
        }
      }
    }, 5000);
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },
});
