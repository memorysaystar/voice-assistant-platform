import { ActivityIndicator, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingButtonProps {
  loading: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  children: string;
  onPress?: () => void;
  disabled?: boolean;
  color?: string;
  style?: any;
}

export default function LoadingButton({ loading, icon, children, onPress, disabled, color = '#2563eb', style }: LoadingButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, { backgroundColor: color, opacity: disabled && !loading ? 0.5 : 1 }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Ionicons name={icon} size={18} color="#fff" />
      )}
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
