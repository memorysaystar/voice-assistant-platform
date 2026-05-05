import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth';
import { API_BASE_URL } from '../utils/constants';
import LoadingButton from '../components/common/LoadingButton';

export default function SettingsScreen() {
  const { user, updateUser, logout, serverUrl, setServerUrl } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [apiKey, setApiKey] = useState(user?.mimo_api_key || '');
  const [server, setServer] = useState(serverUrl || API_BASE_URL);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setApiKey(user.mimo_api_key || '');
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await authApi.updateMe({
        username: username.trim() || undefined,
        email: email.trim() || undefined,
        mimo_api_key: apiKey.trim() || undefined,
      });
      updateUser(res.data);
      Alert.alert('成功', '资料已更新');
    } catch (err: any) {
      Alert.alert('更新失败', err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServer = () => {
    const url = server.trim().replace(/\/+$/, '');
    if (!url) {
      Alert.alert('提示', '请输入服务器地址');
      return;
    }
    setServerUrl(url);
    Alert.alert('成功', '服务器地址已更新，下次请求生效');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>设置 / Settings</Text>

        <Text style={styles.label}>服务器地址 / Server URL</Text>
        <View style={styles.serverRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={server}
            onChangeText={setServer}
            placeholder="http://192.168.x.x:8000"
            autoCapitalize="none"
            keyboardType="url"
          />
          <LoadingButton loading={false} icon="save" onPress={handleSaveServer} style={styles.serverBtn}>
            应用
          </LoadingButton>
        </View>

        <Text style={styles.label}>用户名 / Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} />

        <Text style={styles.label}>邮箱 / Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>自定义 API Key（可选）</Text>
        <TextInput style={styles.input} value={apiKey} onChangeText={setApiKey} placeholder="留空使用系统默认" autoCapitalize="none" />

        <LoadingButton loading={loading} icon="save" onPress={handleSave}>
          保存
        </LoadingButton>

        <LoadingButton loading={false} icon="log-out" onPress={logout} color="#dc2626">
          退出登录
        </LoadingButton>

        <Text style={styles.info}>账号：{user?.email}</Text>
        <Text style={styles.info}>角色：{user?.role}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20, gap: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151' },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1f2937',
  },
  info: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  serverRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serverBtn: { paddingHorizontal: 12, paddingVertical: 12 },
});
