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
import { AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initBgm, initClickSound, initBrushSound, playBgm, pauseBgm } from '../src/store/useAudioStore';
import { useUserStore } from '../src/store/useUserStore';
import { useSettingsStore } from '../src/store/useSettingsStore';

// Keep splash visible until fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    PatrickHand_400Regular,
    Caveat_400Regular,
    Caveat_700Bold,
    IndieFlower_400Regular,
  });

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);

  useEffect(() => {
    initBgm().then(() => {
      if (useSettingsStore.getState().soundEnabled && AppState.currentState === 'active') {
        playBgm();
      }
    });
    initClickSound();
    initBrushSound();
  }, []);

  // Load persisted user session and settings into in-memory stores once on app start
  useEffect(() => {
    try {
      useUserStore.getState().loadSession();
    } catch (e) {
      console.warn('Failed to load session on startup', e);
    }

    try {
      useSettingsStore.getState().loadSettings();
    } catch (e) {
      console.warn('Failed to load settings on startup', e);
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && useSettingsStore.getState().soundEnabled) {
        playBgm();
      } else {
        pauseBgm();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (soundEnabled && AppState.currentState === 'active') {
      playBgm();
    } else {
      pauseBgm();
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  // useEffect(() => {
  //   const unsub = auth().onAuthStateChanged((user) => {
  //     if (user) router.replace('/lobby');
  //   });
  //   return unsub;
  // }, []);

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
