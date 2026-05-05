// API 基础地址 — 与后端通信
const DEFAULT_BASE_URL = 'http://127.0.0.1:8000';

function getBaseUrl() {
  const app = getApp();
  return (app && app.getServerUrl()) || DEFAULT_BASE_URL;
}

function getToken() {
  const app = getApp();
  return app ? app.getToken() : null;
}

// 通用请求封装
function request(method, path, data, options = {}) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const header = { 'Content-Type': 'application/json' };
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: getBaseUrl() + path,
      method,
      data,
      header,
      responseType: options.responseType || 'json',
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(res);
        } else if (res.statusCode === 401) {
          const app = getApp();
          if (app) app.logout();
          wx.redirectTo({ url: '/pages/login/login' });
          reject(new Error('登录已过期'));
        } else {
          const msg = (res.data && res.data.detail) || `请求失败 (${res.statusCode})`;
          reject(new Error(msg));
        }
      },
      fail() {
        reject(new Error('网络连接失败'));
      },
    });
  });
}

// 文件上传（语音克隆用）
function uploadFile(path, filePath, formData) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const header = {};
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.uploadFile({
      url: getBaseUrl() + path,
      filePath,
      name: 'audio_file',
      formData,
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(res);
        } else {
          let msg = '上传失败';
          try { msg = JSON.parse(res.data).detail || msg; } catch {}
          reject(new Error(msg));
        }
      },
      fail() {
        reject(new Error('上传失败'));
      },
    });
  });
}

// Auth API
const authApi = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (username, email, password) => request('POST', '/auth/register', { username, email, password }),
  getMe: () => request('GET', '/auth/me'),
  updateMe: (data) => request('PUT', '/auth/me', data),
};

// Chat API
const chatApi = {
  getConversations: () => request('GET', '/conversations'),
  getConversation: (id) => request('GET', `/conversations/${id}`),
  createConversation: (data) => request('POST', '/conversations', data),
  deleteConversation: (id) => request('DELETE', `/conversations/${id}`),
};

// TTS API
const ttsApi = {
  synthesize: (text, voice, style) =>
    request('POST', '/tts/synthesize', { text, voice, style }, { responseType: 'arraybuffer' }),
  clone: (filePath, text) =>
    uploadFile('/tts/clone', filePath, { text }),
  design: (voice_prompt, text) =>
    request('POST', '/tts/design', { voice_prompt, text }, { responseType: 'arraybuffer' }),
  getVoices: () => request('GET', '/tts/voices'),
};

module.exports = { request, uploadFile, authApi, chatApi, ttsApi, getBaseUrl };
