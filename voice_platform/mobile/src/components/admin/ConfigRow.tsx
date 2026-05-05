import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SystemConfig } from '../../types';

interface ConfigRowProps {
  config: SystemConfig;
  onSave: (key: string, value: string) => void;
}

export default function ConfigRow({ config, onSave }: ConfigRowProps) {
  const [value, setValue] = useState(config.value);

  return (
    <View style={styles.row}>
      <Text style={styles.key}>{config.key}</Text>
      {config.description && <Text style={styles.desc}>{config.description}</Text>}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder={config.value}
        />
        <Pressable
          onPress={() => onSave(config.key, value)}
          disabled={value === config.value}
          style={[styles.saveBtn, { opacity: value === config.value ? 0.4 : 1 }]}
        >
          <Ionicons name="save" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 6 },
  key: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  desc: { fontSize: 12, color: '#9ca3af' },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1f2937',
  },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 8, padding: 8, justifyContent: 'center' },
});
