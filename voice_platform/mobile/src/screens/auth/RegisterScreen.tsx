import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth';
import LoadingButton from '../../components/common/LoadingButton';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('提示', '请填写所有字段');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(username.trim(), email.trim(), password);
      setAuth(res.data.access_token, res.data.user);
    } catch (err: any) {
      Alert.alert('注册失败', err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>创建账号</Text>
        <Text style={styles.subtitle}>Register</Text>

        <TextInput style={styles.input} placeholder="用户名 / Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="邮箱 / Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="密码 / Password" value={password} onChangeText={setPassword} secureTextEntry />

        <LoadingButton loading={loading} icon="person-add" onPress={handleRegister}>
          注册
        </LoadingButton>

        <Pressable onPress={() => navigation.goBack()} style={styles.link}>
          <Text style={styles.linkText}>已有账号？登录 / Have account? Sign in</Text>
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
