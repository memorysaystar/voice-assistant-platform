import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { ttsApi } from '../../api/tts';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import LoadingButton from '../../components/common/LoadingButton';
import AudioPlayer from '../../components/common/AudioPlayer';

export default function VoiceCloneScreen() {
  const [text, setText] = useState('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const { playAudio, cleanup } = useAudioPlayer();
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setFileUri(result.assets[0].uri);
        setFileName(result.assets[0].name);
      }
    } catch {}
  };

  const handleRecord = async () => {
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) {
        setFileUri(uri);
        // 从 URI 提取实际文件扩展名 / Extract actual file extension from URI
        const ext = uri.split('.').pop()?.split('?')[0] || 'm4a';
        setFileName(`recording.${ext}`);
      }
    } else {
      await startRecording();
    }
  };

  const handleClone = async () => {
    if (!fileUri || !text.trim()) {
      Alert.alert('提示', '请选择音频文件并输入文字');
      return;
    }
    setLoading(true);
    try {
      const res = await ttsApi.clone(fileUri, fileName || 'audio.wav', text.trim());
      const uri = await playAudio(res.data);
      setAudioUri(uri);
    } catch (err: any) {
      Alert.alert('克隆失败', err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>音频来源 / Audio Source</Text>
        <View style={styles.sourceRow}>
          <Pressable onPress={handlePickFile} style={styles.sourceBtn}>
            <Ionicons name="folder-open" size={24} color="#2563eb" />
            <Text style={styles.sourceText}>选择文件</Text>
          </Pressable>
          <Pressable onPress={handleRecord} style={[styles.sourceBtn, isRecording && styles.sourceBtnRecording]}>
            <Ionicons name={isRecording ? 'stop-circle' : 'mic'} size={24} color={isRecording ? '#dc2626' : '#2563eb'} />
            <Text style={[styles.sourceText, isRecording && { color: '#dc2626' }]}>
              {isRecording ? '停止录音' : '录音'}
            </Text>
          </Pressable>
        </View>

        {fileName && (
          <View style={styles.fileInfo}>
            <Ionicons name="musical-note" size={16} color="#16a34a" />
            <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>合成文字 / Text to Synthesize</Text>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="输入要合成的文字..."
          multiline
          maxLength={2000}
        />

        {audioUri && <AudioPlayer audioUri={audioUri} onClose={() => setAudioUri(null)} />}

        <LoadingButton
          loading={loading}
          icon="mic"
          onPress={handleClone}
          disabled={!fileUri || !text.trim()}
          color="#7c3aed"
        >
          语音克隆
        </LoadingButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  sourceRow: { flexDirection: 'row', gap: 12 },
  sourceBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb',
  },
  sourceBtnRecording: { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  sourceText: { fontSize: 14, color: '#374151' },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8 },
  fileName: { fontSize: 13, color: '#16a34a', flex: 1 },
  textInput: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: 'top', color: '#1f2937',
  },
});
