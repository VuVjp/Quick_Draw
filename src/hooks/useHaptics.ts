import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../store/useUserStore';

export const useHaptics = () => {
  const hapticsEnabled = useUserStore((s) => s.hapticsEnabled);

  const light = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hapticsEnabled]);

  const medium = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [hapticsEnabled]);

  const heavy = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [hapticsEnabled]);

  const success = useCallback(() => {
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hapticsEnabled]);

  const error = useCallback(() => {
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [hapticsEnabled]);

  return { light, medium, heavy, success, error };
};
