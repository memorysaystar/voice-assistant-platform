import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TTSScreen from '../screens/tts/TTSScreen';
import VoiceCloneScreen from '../screens/tts/VoiceCloneScreen';
import VoiceDesignScreen from '../screens/tts/VoiceDesignScreen';

const Stack = createNativeStackNavigator();

export default function TTSStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TTS" component={TTSScreen} options={{ title: '语音合成 / TTS' }} />
      <Stack.Screen name="VoiceClone" component={VoiceCloneScreen} options={{ title: '语音克隆 / Clone' }} />
      <Stack.Screen name="VoiceDesign" component={VoiceDesignScreen} options={{ title: '音色设计 / Design' }} />
    </Stack.Navigator>
  );
}
