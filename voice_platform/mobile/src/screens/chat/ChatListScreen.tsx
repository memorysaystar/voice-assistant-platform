import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../stores/chatStore';
import { chatApi } from '../../api/chat';
import EmptyState from '../../components/common/EmptyState';

export default function ChatListScreen({ navigation }: any) {
  const { conversations, setConversations, setCurrentConversation, setMessages, removeConversation } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data);
    } catch {}
  }, [setConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleSelect = async (conv: any) => {
    try {
      const res = await chatApi.getConversation(conv.id);
      setCurrentConversation(res.data);
      setMessages(res.data.messages);
      navigation.navigate('Chat', { id: conv.id });
    } catch {}
  };

  const handleNew = () => {
    setCurrentConversation(null);
    setMessages([]);
    navigation.navigate('Chat', {});
  };

  const handleDelete = (id: number) => {
    Alert.alert('删除对话', '确定要删除这个对话吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive', onPress: async () => {
          try {
            await chatApi.deleteConversation(id);
            removeConversation(id);
          } catch {}
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable style={styles.item} onPress={() => handleSelect(item)} onLongPress={() => handleDelete(item.id)}>
      <View style={styles.itemContent}>
        <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
        <View style={styles.itemText}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.itemMeta}>{item.message_count} 条消息</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="暂无对话" subtitle="点击右下角开始新对话" />}
      />
      <Pressable style={styles.fab} onPress={handleNew}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  item: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '500', color: '#1f2937' },
  itemMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
