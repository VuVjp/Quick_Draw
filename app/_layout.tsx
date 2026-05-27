import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  Caveat_400Regular,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';
import { IndieFlower_400Regular } from '@expo-google-fonts/indie-flower';
import {
  PatrickHand_400Regular,
  useFonts,
} from '@expo-google-fonts/patrick-hand';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initBgm, initClickSound, initBrushSound } from '../src/store/useAudioStore';

import auth from '@react-native-firebase/auth';

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
    initBgm();
    initClickSound();
    initBrushSound();
  }, []);

  useEffect(() => {
    // Sign in anonymously to ensure everyone has a valid uid
    auth().signInAnonymously()
      .then((userCred) => {
        console.log('✅ Firebase Anonymous Auth success. UID:', userCred.user.uid);
      })
      .catch((err) => {
        console.error('❌ Firebase Anonymous Auth failed:', err);
      });

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
          <Stack.Screen name="room/[id]" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
          <Stack.Screen name="drawing" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
          <Stack.Screen name="win" options={{ animation: 'fade' }} />
          <Stack.Screen name="lose" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
