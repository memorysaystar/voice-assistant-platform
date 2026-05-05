import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: string;
}

export default function StatCard({ icon, label, value, color = '#2563eb' }: StatCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    width: '48%',
  },
  value: { fontSize: 22, fontWeight: '700', color: '#1f2937' },
  label: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
