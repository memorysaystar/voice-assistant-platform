import api from './client';

export interface VoiceInfo {
  name: string;
  type: string;
  description: string;
}

export const ttsApi = {
  synthesize: (text: string, voice?: string, style?: string) =>
    api.post('/tts/synthesize', { text, voice, style }, { responseType: 'blob' }),

  clone: (audioFile: File, text: string) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('text', text);
    return api.post('/tts/clone', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
  },

  design: (voice_prompt: string, text: string) =>
    api.post('/tts/design', { voice_prompt, text }, { responseType: 'blob' }),

  getVoices: () => api.get<VoiceInfo[]>('/tts/voices'),
};
