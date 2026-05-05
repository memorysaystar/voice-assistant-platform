import { create } from 'zustand';
import type { VoiceInfo } from '../types';

interface TtsState {
  voices: VoiceInfo[];
  loading: boolean;
  audioUri: string | null;
  setVoices: (voices: VoiceInfo[]) => void;
  setLoading: (v: boolean) => void;
  setAudioUri: (uri: string | null) => void;
}

export const useTtsStore = create<TtsState>((set) => ({
  voices: [],
  loading: false,
  audioUri: null,
  setVoices: (voices) => set({ voices }),
  setLoading: (loading) => set({ loading }),
  setAudioUri: (audioUri) => set({ audioUri }),
}));
