import { useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { arrayBufferToBase64 } from '../utils/audioHelpers';

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const fileUriRef = useRef<string | null>(null);

  // 播放 ArrayBuffer 音频 / Play ArrayBuffer audio
  const playAudio = useCallback(async (arrayBuffer: ArrayBuffer): Promise<string | null> => {
    try {
      // 停止之前的播放 / Stop previous playback
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // 写入临时文件 / Write to temp file
      const fileUri = (FileSystem.cacheDirectory || '') + `tts_${Date.now()}.wav`;
      const base64 = arrayBufferToBase64(arrayBuffer);
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      fileUriRef.current = fileUri;

      // 设置音频模式 / Set audio mode
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      // 播放 / Play
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      soundRef.current = sound;
      await sound.playAsync();

      return fileUri;
    } catch (err) {
      console.error('[Audio] 播放失败 / Playback failed:', err);
      return null;
    }
  }, []);

  // 停止播放 / Stop playback
  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }, []);

  // 分享音频文件 / Share audio file
  const shareAudio = useCallback(async () => {
    if (fileUriRef.current && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUriRef.current, { mimeType: 'audio/wav' });
    }
  }, []);

  // 清理 / Cleanup
  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (fileUriRef.current) {
      try { await FileSystem.deleteAsync(fileUriRef.current, { idempotent: true }); } catch {}
      fileUriRef.current = null;
    }
  }, []);

  return { playAudio, stopAudio, shareAudio, cleanup };
}
