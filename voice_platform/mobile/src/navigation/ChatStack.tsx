import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';

const Stack = createNativeStackNavigator();

export default function ChatStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: '对话 / Chats' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '聊天 / Chat' }} />
    </Stack.Navigator>
  );
}
