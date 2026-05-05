import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth';
import LoadingButton from '../../components/common/LoadingButton';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('提示', '请填写邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      setAuth(res.data.access_token, res.data.user);
    } catch (err: any) {
      Alert.alert('登录失败', err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Voice Assistant</Text>
        <Text style={styles.subtitle}>登录 / Sign In</Text>

        <TextInput
          style={styles.input}
          placeholder="邮箱 / Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="密码 / Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <LoadingButton loading={loading} icon="log-in" onPress={handleLogin}>
          登录
        </LoadingButton>

        <Pressable onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={styles.linkText}>没有账号？注册 / No account? Register</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1f2937', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1f2937',
  },
  link: { alignItems: 'center', marginTop: 8 },
  linkText: { color: '#2563eb', fontSize: 14 },
});
