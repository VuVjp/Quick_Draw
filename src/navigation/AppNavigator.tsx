import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import MainTabs from './MainTabs';
import DrawingScreen from '../screens/DrawingScreen';
import WinScreen from '../screens/WinScreen';
import LoseScreen from '../screens/LoseScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';

// ── Route param types ─────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
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
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen} 
        options={{ animation: 'fade' }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ animation: 'fade' }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen} 
        options={{ animation: 'fade' }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ animation: 'fade' }}
      />
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
