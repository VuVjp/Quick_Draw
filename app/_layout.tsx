import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PatrickHand_400Regular,
} from '@expo-google-fonts/patrick-hand';
import {
  Caveat_400Regular,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';
import { IndieFlower_400Regular } from '@expo-google-fonts/indie-flower';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';

// Keep splash visible until fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    PatrickHand_400Regular,
    Caveat_400Regular,
    Caveat_700Bold,
    IndieFlower_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            gestureEnabled: true,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="home" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="drawing" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
          <Stack.Screen name="win" options={{ animation: 'fade' }} />
          <Stack.Screen name="lose" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
