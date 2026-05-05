import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  onToggleTts: () => void;
  ttsOpen: boolean;
  disabled: boolean;
}

export default function ChatInput({ onSend, onToggleTts, ttsOpen, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    setText('');
    onSend(trimmed);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onToggleTts} style={[styles.iconBtn, ttsOpen && styles.iconBtnActive]}>
        <Ionicons name="volume-high" size={22} color={ttsOpen ? '#16a34a' : '#9ca3af'} />
      </Pressable>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="输入消息... / Type message..."
        multiline
        maxLength={4000}
        editable={!disabled}
        onSubmitEditing={handleSend}
        returnKeyType="send"
      />
      <Pressable
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        style={[styles.sendBtn, { opacity: !text.trim() || disabled ? 0.4 : 1 }]}
      >
        <Ionicons name="send" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  iconBtn: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  iconBtnActive: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#1f2937',
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 10,
  },
});
