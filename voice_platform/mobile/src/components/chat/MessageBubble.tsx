import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Message } from '../../types';

interface MessageBubbleProps {
  msg: Message;
  isLast: boolean;
  isStreaming: boolean;
}

const MessageBubble = memo(function MessageBubble({ msg, isLast, isStreaming }: MessageBubbleProps) {
  const isUser = msg.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
          {msg.content || (isStreaming && isLast ? '' : null)}
        </Text>
        {isStreaming && isLast && !msg.content && (
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { marginVertical: 4, paddingHorizontal: 16 },
  rowUser: { alignItems: 'flex-end' },
  rowAssistant: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  bubbleUser: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 22 },
  textUser: { color: '#fff' },
  textAssistant: { color: '#1f2937' },
  dots: { flexDirection: 'row', gap: 5, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9ca3af' },
  dot1: {},
  dot2: {},
  dot3: {},
});

export default MessageBubble;
