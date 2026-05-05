import api from './client';
import type { VoiceInfo } from '../types';

export const ttsApi = {
  // 合成语音，返回 ArrayBuffer / Synthesize speech, returns ArrayBuffer
  synthesize: (text: string, voice?: string, style?: string) =>
    api.post('/tts/synthesize', { text, voice, style }, { responseType: 'arraybuffer' }),

  // 语音克隆（multipart 上传）/ Voice clone (multipart upload)
  clone: (audioUri: string, audioName: string, text: string) => {
    const formData = new FormData();
    // 根据文件扩展名推断 MIME 类型 / Infer MIME type from file extension
    const ext = audioName.split('.').pop()?.toLowerCase() || '';
    const mimeMap: Record<string, string> = {
      wav: 'audio/wav', mp3: 'audio/mpeg', m4a: 'audio/mp4',
      flac: 'audio/flac', ogg: 'audio/ogg',
    };
    const mimeType = mimeMap[ext] || 'audio/wav';
    formData.append('audio_file', {
      uri: audioUri,
      name: audioName,
      type: mimeType,
    } as any);
    formData.append('text', text);
    return api.post('/tts/clone', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'arraybuffer',
    });
  },

  // 音色设计 / Voice design
  design: (voice_prompt: string, text: string) =>
    api.post('/tts/design', { voice_prompt, text }, { responseType: 'arraybuffer' }),

  // 获取可用音色列表 / Get available voices
  getVoices: () => api.get<VoiceInfo[]>('/tts/voices'),
};
