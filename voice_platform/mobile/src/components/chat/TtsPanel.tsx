import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TTS_VOICES } from '../../utils/constants';

interface TtsPanelProps {
  onSynthesize: (text: string, voice: string) => void;
  loading: boolean;
}

export default function TtsPanel({ onSynthesize, loading }: TtsPanelProps) {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('冰糖');

  const handleSynthesize = () => {
    if (!text.trim() || loading) return;
    onSynthesize(text.trim(), voice);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>语音合成 / Text to Speech</Text>
      {/* 音色选择 / Voice selection */}
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
      {/* 输入 + 合成按钮 / Input + synthesize */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="输入要合成的文字 / Enter text..."
          onSubmitEditing={handleSynthesize}
        />
        <Pressable
          onPress={handleSynthesize}
          disabled={!text.trim() || loading}
          style={[styles.synthBtn, { opacity: !text.trim() || loading ? 0.5 : 1 }]}
        >
          {loading ? (
            <Ionicons name="hourglass" size={16} color="#fff" />
          ) : (
            <Ionicons name="play" size={16} color="#fff" />
          )}
          <Text style={styles.synthText}>{loading ? '合成中...' : '合成'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 10,
  },
  title: { fontSize: 14, fontWeight: '600', color: '#374151' },
  voiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  voiceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '23%',
    alignItems: 'center',
  },
  voiceBtnActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  voiceName: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  voiceNameActive: { color: '#16a34a' },
  voiceDesc: { fontSize: 10, color: '#9ca3af', marginTop: 1 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  synthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  synthText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
