import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import MainTabs from './MainTabs';
import DrawingScreen from '../screens/DrawingScreen';
import WinScreen from '../screens/WinScreen';
import LoseScreen from '../screens/LoseScreen';

// ── Route param types ─────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  MainTabs: undefined;
  Drawing: undefined;
  Win: undefined;
  Lose: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        gestureEnabled: true,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Drawing"
        component={DrawingScreen}
        options={{ animation: 'slide_from_right', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Win"
        component={WinScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="Lose"
        component={LoseScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}
