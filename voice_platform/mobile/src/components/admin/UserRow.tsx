import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { UserListItem } from '../../types';

interface UserRowProps {
  user: UserListItem;
  onToggleActive: (id: number, active: boolean) => void;
  onChangeRole: (id: number, role: string) => void;
}

export default function UserRow({ user, onToggleActive, onChangeRole }: UserRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => onChangeRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
          style={[styles.badge, user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser]}
        >
          <Text style={styles.badgeText}>{user.role}</Text>
        </Pressable>
        <Pressable onPress={() => onToggleActive(user.id, !user.is_active)}>
          <Ionicons
            name={user.is_active ? 'checkmark-circle' : 'close-circle'}
            size={24}
            color={user.is_active ? '#16a34a' : '#dc2626'}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500', color: '#1f2937' },
  email: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeAdmin: { backgroundColor: '#dbeafe' },
  badgeUser: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
});
