import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import SystemConfigScreen from '../screens/admin/SystemConfigScreen';
import UsageAnalyticsScreen from '../screens/admin/UsageAnalyticsScreen';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: '管理后台 / Admin' }} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: '用户管理 / Users' }} />
      <Stack.Screen name="SystemConfig" component={SystemConfigScreen} options={{ title: '系统配置 / Config' }} />
      <Stack.Screen name="UsageAnalytics" component={UsageAnalyticsScreen} options={{ title: '使用统计 / Analytics' }} />
    </Stack.Navigator>
  );
}
