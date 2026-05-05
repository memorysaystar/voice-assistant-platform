import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import ChatStack from './ChatStack';
import TTSStack from './TTSStack';
import SettingsScreen from '../screens/SettingsScreen';
import AdminStack from './AdminStack';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'chatbubble';
          if (route.name === 'ChatTab') iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          else if (route.name === 'TTSTab') iconName = focused ? 'volume-high' : 'volume-high-outline';
          else if (route.name === 'SettingsTab') iconName = focused ? 'settings' : 'settings-outline';
          else if (route.name === 'AdminTab') iconName = focused ? 'shield' : 'shield-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="ChatTab" component={ChatStack} options={{ title: '聊天' }} />
      <Tab.Screen name="TTSTab" component={TTSStack} options={{ title: '语音' }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: '设置' }} />
      {isAdmin && (
        <Tab.Screen name="AdminTab" component={AdminStack} options={{ title: '管理' }} />
      )}
    </Tab.Navigator>
  );
}
