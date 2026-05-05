import { useRef, useState, useCallback } from 'react';
import { Audio } from 'expo-av';

export function useAudioRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  // 开始录音 / Start recording
  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('需要麦克风权限 / Microphone permission required');
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordedUri(null);
    } catch (err) {
      console.error('[Recorder] 开始录音失败 / Start recording failed:', err);
      throw err;
    }
  }, []);

  // 停止录音 / Stop recording
  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) return null;
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      setRecordedUri(uri);
      return uri;
    } catch (err) {
      console.error('[Recorder] 停止录音失败 / Stop recording failed:', err);
      recordingRef.current = null;
      setIsRecording(false);
      return null;
    }
  }, []);

  // 清理 / Cleanup
  const cleanup = useCallback(async () => {
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
      recordingRef.current = null;
    }
    setIsRecording(false);
  }, []);

  return { isRecording, recordedUri, startRecording, stopRecording, cleanup };
}
