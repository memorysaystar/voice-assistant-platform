import { useEffect, useState, useCallback } from 'react';
import { View, TextInput, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/admin';
import type { UserListItem } from '../../types';
import UserRow from '../../components/admin/UserRow';

export default function UserManagementScreen() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      const res = await adminApi.getUsers(0, 100, search || undefined);
      setUsers(res.data);
    } catch {}
  }, [search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleToggleActive = async (id: number, active: boolean) => {
    try {
      await adminApi.updateUser(id, { is_active: active });
      loadUsers();
    } catch {}
  };

  const handleChangeRole = async (id: number, role: string) => {
    try {
      await adminApi.updateUser(id, { role });
      loadUsers();
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="搜索用户名或邮箱..."
        onSubmitEditing={loadUsers}
      />
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <UserRow user={item} onToggleActive={handleToggleActive} onChangeRole={handleChangeRole} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  search: {
    margin: 16, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1f2937',
  },
});
