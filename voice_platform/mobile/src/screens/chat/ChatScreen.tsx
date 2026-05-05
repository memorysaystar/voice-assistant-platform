import { useEffect, useRef, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useChatStore } from '../../stores/chatStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { ttsApi } from '../../api/tts';
import MessageBubble from '../../components/chat/MessageBubble';
import ChatInput from '../../components/chat/ChatInput';
import TtsPanel from '../../components/chat/TtsPanel';
import AudioPlayer from '../../components/common/AudioPlayer';

export default function ChatScreen() {
  const { messages, isStreaming, currentConversation } = useChatStore();
  const { sendMessage, isConnected } = useWebSocket();
  const { playAudio, cleanup } = useAudioPlayer();
  const flatListRef = useRef<FlatList>(null);
  const scrollRaf = useRef<number>(0);

  // TTS 状态 / TTS state
  const [ttsOpen, setTtsOpen] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  useEffect(() => {
    return () => { cleanup(); };
  }, []);

  // 流式更新自动滚动 / Auto-scroll during streaming
  useEffect(() => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

  const handleSend = useCallback((text: string) => {
    sendMessage(text, currentConversation?.id);
  }, [sendMessage, currentConversation]);

  const handleTtsSynthesize = useCallback(async (text: string, voice: string) => {
    setTtsLoading(true);
    try {
      const res = await ttsApi.synthesize(text, voice);
      const uri = await playAudio(res.data);
      setAudioUri(uri);
    } catch (err: any) {
      console.error('[TTS] 合成失败 / Synthesis failed:', err);
    } finally {
      setTtsLoading(false);
    }
  }, [playAudio]);

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MessageBubble msg={item} isLast={index === messages.length - 1} isStreaming={isStreaming} />
  );

  return (
    <View style={styles.container}>
      {/* 连接状态 / Connection status */}
      {!isConnected && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>正在连接服务器... / Connecting...</Text>
        </View>
      )}

      {/* 音频播放器 / Audio player */}
      {audioUri && <AudioPlayer audioUri={audioUri} onClose={() => setAudioUri(null)} />}

      {/* 消息列表 / Message list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* TTS 面板 / TTS panel */}
      {ttsOpen && <TtsPanel onSynthesize={handleTtsSynthesize} loading={ttsLoading} />}

      {/* 输入区 / Input area */}
      <ChatInput
        onSend={handleSend}
        onToggleTts={() => setTtsOpen(!ttsOpen)}
        ttsOpen={ttsOpen}
        disabled={isStreaming}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  statusBar: { backgroundColor: '#fefce8', paddingVertical: 8, alignItems: 'center', borderBottomWidth: 1, borderColor: '#fde68a' },
  statusText: { fontSize: 13, color: '#a16207' },
  messageList: { paddingVertical: 12 },
});
