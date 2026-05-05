import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ttsApi } from '../../api/tts';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import LoadingButton from '../../components/common/LoadingButton';
import AudioPlayer from '../../components/common/AudioPlayer';

const EXAMPLE_PROMPTS = [
  '温柔甜美的女声',
  '沉稳大气的男声',
  '活泼开朗的少女',
  '低沉磁性的嗓音',
];

export default function VoiceDesignScreen() {
  const [voicePrompt, setVoicePrompt] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const { playAudio, cleanup } = useAudioPlayer();

  const handleDesign = async () => {
    if (!voicePrompt.trim() || !text.trim()) {
      Alert.alert('提示', '请填写音色描述和合成文字');
      return;
    }
    setLoading(true);
    try {
      const res = await ttsApi.design(voicePrompt.trim(), text.trim());
      const uri = await playAudio(res.data);
      setAudioUri(uri);
    } catch (err: any) {
      Alert.alert('设计失败', err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>音色描述 / Voice Description</Text>
        <TextInput
          style={styles.textInput}
          value={voicePrompt}
          onChangeText={setVoicePrompt}
          placeholder="描述你想要的音色，例如：温柔甜美的女声..."
          multiline
          maxLength={500}
        />
        <View style={styles.tags}>
          {EXAMPLE_PROMPTS.map((p) => (
            <Pressable key={p} onPress={() => setVoicePrompt(p)} style={styles.tag}>
              <Text style={styles.tagText}>{p}</Text>
            </Pressable>
          ))}
        </View>

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
          icon="color-wand"
          onPress={handleDesign}
          disabled={!voicePrompt.trim() || !text.trim()}
          color="#9333ea"
        >
          设计音色
        </LoadingButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  textInput: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: 'top', color: '#1f2937',
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#f3e8ff', borderWidth: 1, borderColor: '#d8b4fe',
  },
  tagText: { fontSize: 13, color: '#7c3aed' },
});
