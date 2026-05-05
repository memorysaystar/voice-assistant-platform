import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';

export default function RootNavigator() {
  const token = useAuthStore((s) => s.token);

  return (
    <NavigationContainer>
      {token ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
