import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/admin';
import type { UsageStat, ActionStat } from '../../types';

// 简单柱状图组件 / Simple bar chart component
function BarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal: number }) {
  return (
    <View style={chartStyles.container}>
      {data.slice(-14).map((item, i) => (
        <View key={i} style={chartStyles.barGroup}>
          <Text style={chartStyles.barValue}>{item.value}</Text>
          <View style={[chartStyles.bar, { height: Math.max(4, (item.value / maxVal) * 120) }]} />
          <Text style={chartStyles.barLabel}>{item.label.slice(5)}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingVertical: 8 },
  barGroup: { alignItems: 'center', flex: 1 },
  bar: { width: '80%', backgroundColor: '#2563eb', borderRadius: 4, minHeight: 4 },
  barValue: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  barLabel: { fontSize: 8, color: '#9ca3af', marginTop: 2 },
});

export default function UsageAnalyticsScreen() {
  const [usage, setUsage] = useState<UsageStat[]>([]);
  const [actions, setActions] = useState<ActionStat[]>([]);

  useEffect(() => {
    adminApi.getUsage(30).then((r) => setUsage(r.data)).catch(() => {});
    adminApi.getActions().then((r) => setActions(r.data)).catch(() => {});
  }, []);

  const maxUsage = Math.max(1, ...usage.map((u) => u.count));
  const maxAction = Math.max(1, ...actions.map((a) => a.count));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>每日使用量 / Daily Usage</Text>
        <View style={styles.chartCard}>
          <BarChart data={usage.map((u) => ({ label: u.date, value: u.count }))} maxVal={maxUsage} />
        </View>

        <Text style={styles.title}>按操作类型 / By Action</Text>
        <View style={styles.chartCard}>
          {actions.map((a) => (
            <View key={a.action} style={styles.actionRow}>
              <Text style={styles.actionName}>{a.action}</Text>
              <View style={styles.actionBarBg}>
                <View style={[styles.actionBar, { width: `${(a.count / maxAction) * 100}%` }]} />
              </View>
              <Text style={styles.actionCount}>{a.count}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, gap: 16 },
  title: { fontSize: 16, fontWeight: '600', color: '#374151' },
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  actionName: { width: 100, fontSize: 13, color: '#374151' },
  actionBarBg: { flex: 1, height: 16, backgroundColor: '#f3f4f6', borderRadius: 8, overflow: 'hidden' },
  actionBar: { height: '100%', backgroundColor: '#9333ea', borderRadius: 8 },
  actionCount: { width: 40, textAlign: 'right', fontSize: 13, color: '#6b7280' },
});
