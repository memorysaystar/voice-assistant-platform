import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

interface AudioPlayerProps {
  audioUri: string | null;
  onClose?: () => void;
}

export default function AudioPlayer({ audioUri, onClose }: AudioPlayerProps) {
  const { shareAudio, cleanup } = useAudioPlayer();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => { cleanup(); };
  }, []);

  if (!audioUri) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="volume-high" size={20} color="#16a34a" />
      <Text style={styles.label} numberOfLines={1}>音频已就绪 / Audio ready</Text>
      <Pressable onPress={shareAudio} style={styles.iconBtn}>
        <Ionicons name="share-outline" size={20} color="#6b7280" />
      </Pressable>
      {onClose && (
        <Pressable onPress={onClose} style={styles.iconBtn}>
          <Ionicons name="close" size={20} color="#9ca3af" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  label: { flex: 1, fontSize: 14, color: '#16a34a' },
  iconBtn: { padding: 4 },
});
