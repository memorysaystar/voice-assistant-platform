import { useEffect, useState } from 'react';
import { FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/admin';
import type { SystemConfig } from '../../types';
import ConfigRow from '../../components/admin/ConfigRow';

export default function SystemConfigScreen() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);

  useEffect(() => {
    adminApi.getConfig().then((r) => setConfigs(r.data)).catch(() => {});
  }, []);

  const handleSave = async (key: string, value: string) => {
    try {
      await adminApi.updateConfig(key, value);
      Alert.alert('成功', `${key} 已更新`);
      adminApi.getConfig().then((r) => setConfigs(r.data)).catch(() => {});
    } catch (err: any) {
      Alert.alert('失败', err.response?.data?.detail || err.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
      <FlatList
        data={configs}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <ConfigRow config={item} onSave={handleSave} />}
      />
    </SafeAreaView>
  );
}
