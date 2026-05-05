import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ttsApi } from '../../api/tts';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { TTS_VOICES } from '../../utils/constants';
import LoadingButton from '../../components/common/LoadingButton';
import AudioPlayer from '../../components/common/AudioPlayer';

export default function TTSScreen({ navigation }: any) {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('冰糖');
  const [style, setStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const { playAudio, shareAudio, cleanup } = useAudioPlayer();

  const handleSynthesize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await ttsApi.synthesize(text.trim(), voice, style || undefined);
      const uri = await playAudio(res.data);
      setAudioUri(uri);
    } catch (err: any) {
      Alert.alert('合成失败', err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>选择音色 / Select Voice</Text>
        <View style={styles.voiceGrid}>
          {TTS_VOICES.map((v) => (
            <Pressable
              key={v.name}
              onPress={() => setVoice(v.name)}
              style={[styles.voiceBtn, voice === v.name && styles.voiceBtnActive]}
            >
              <Text style={[styles.voiceName, voice === v.name && styles.voiceNameActive]}>{v.name}</Text>
              <Text style={styles.voiceDesc}>{v.desc}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>输入文字 / Enter Text</Text>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="输入要合成的文字..."
          multiline
          maxLength={2000}
        />

        <Text style={styles.sectionTitle}>风格（可选）/ Style (optional)</Text>
        <TextInput
          style={styles.styleInput}
          value={style}
          onChangeText={setStyle}
          placeholder="例如：温柔、活泼、低沉..."
        />

        {audioUri && <AudioPlayer audioUri={audioUri} onClose={() => setAudioUri(null)} />}

        <View style={styles.actions}>
          <LoadingButton loading={loading} icon="volume-high" onPress={handleSynthesize} disabled={!text.trim()}>
            合成语音
          </LoadingButton>
          <Pressable onPress={() => navigation.navigate('VoiceClone')} style={styles.navLink}>
            <Ionicons name="mic" size={16} color="#2563eb" />
            <Text style={styles.navLinkText}>语音克隆 / Clone</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('VoiceDesign')} style={styles.navLink}>
            <Ionicons name="color-wand" size={16} color="#2563eb" />
            <Text style={styles.navLinkText}>音色设计 / Design</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginTop: 4 },
  voiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  voiceBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', width: '23%', alignItems: 'center',
  },
  voiceBtnActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  voiceName: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  voiceNameActive: { color: '#16a34a' },
  voiceDesc: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  textInput: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: 'top', color: '#1f2937',
  },
  styleInput: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#1f2937',
  },
  actions: { gap: 12, marginTop: 8 },
  navLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  navLinkText: { color: '#2563eb', fontSize: 14 },
});
