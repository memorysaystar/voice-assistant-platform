import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/admin';
import type { AnalyticsOverview } from '../../types';
import StatCard from '../../components/admin/StatCard';

export default function AdminDashboardScreen({ navigation }: any) {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    adminApi.getOverview().then((r) => setOverview(r.data)).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>管理后台 / Admin Dashboard</Text>

        <View style={styles.grid}>
          <StatCard icon="people" label="总用户" value={overview?.total_users ?? '-'} color="#2563eb" />
          <StatCard icon="person" label="活跃用户" value={overview?.active_users ?? '-'} color="#16a34a" />
          <StatCard icon="chatbubbles" label="总对话" value={overview?.total_conversations ?? '-'} color="#9333ea" />
          <StatCard icon="document-text" label="总消息" value={overview?.total_messages ?? '-'} color="#ea580c" />
          <StatCard icon="code-slash" label="API 调用" value={overview?.total_api_calls ?? '-'} color="#0891b2" />
          <StatCard icon="today" label="今日调用" value={overview?.calls_today ?? '-'} color="#dc2626" />
        </View>

        <View style={styles.links}>
          <Pressable style={styles.link} onPress={() => navigation.navigate('UserManagement')}>
            <Ionicons name="people" size={20} color="#2563eb" />
            <Text style={styles.linkText}>用户管理 / Users</Text>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </Pressable>
          <Pressable style={styles.link} onPress={() => navigation.navigate('SystemConfig')}>
            <Ionicons name="settings" size={20} color="#2563eb" />
            <Text style={styles.linkText}>系统配置 / Config</Text>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </Pressable>
          <Pressable style={styles.link} onPress={() => navigation.navigate('UsageAnalytics')}>
            <Ionicons name="bar-chart" size={20} color="#2563eb" />
            <Text style={styles.linkText}>使用统计 / Analytics</Text>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  links: { gap: 2 },
  link: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', padding: 16, borderRadius: 12,
  },
  linkText: { flex: 1, fontSize: 15, color: '#374151' },
});
