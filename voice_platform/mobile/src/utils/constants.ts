// API 基础地址 — 开发时用局域网 IP，生产时用域名
// API base URL — use LAN IP for dev, domain for prod
// TODO: 替换为你开发机的局域网 IP / Replace with your dev machine's LAN IP
export const API_BASE_URL = 'http://192.168.41.83:8000';

// 内置音色列表 / Built-in voices
export const TTS_VOICES = [
  { name: '冰糖', desc: '甜美女声' },
  { name: '茉莉', desc: '温柔女声' },
  { name: '苏打', desc: '活泼女声' },
  { name: '白桦', desc: '沉稳男声' },
  { name: 'Mia', desc: 'EN female' },
  { name: 'Chloe', desc: 'EN female' },
  { name: 'Milo', desc: 'EN male' },
  { name: 'Dean', desc: 'EN male' },
];

// WebSocket 重连配置 / WebSocket reconnect config
export const WS_MAX_RECONNECT_ATTEMPTS = 10;
export const WS_BASE_RECONNECT_DELAY = 1000;
