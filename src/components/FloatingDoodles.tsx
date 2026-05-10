import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  useSharedValue,
} from 'react-native-reanimated';

const FloatingDoodle = ({ emoji, top, left, delay = 0, rotation = 0 }: any) => {
  const translateY = useSharedValue(0);
  
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 + Math.random() * 1000 }),
        withTiming(0, { duration: 2000 + Math.random() * 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation}deg` }
    ],
  }));

  return (
    <Animated.View style={[styles.doodle, { top, left }, animatedStyle]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
};

const FloatingDoodles = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <FloatingDoodle emoji="✨" top="10%" left="15%" rotation={-15} />
      <FloatingDoodle emoji="⭐" top="15%" left="80%" rotation={10} />
      <FloatingDoodle emoji="💡" top="40%" left="85%" rotation={20} />
      <FloatingDoodle emoji="☁️" top="55%" left="5%" rotation={-10} />
      <FloatingDoodle emoji="🖍️" top="80%" left="10%" rotation={45} />
      <FloatingDoodle emoji="❤️" top="85%" left="75%" rotation={-20} />
      <FloatingDoodle emoji="🎨" top="5%" left="70%" rotation={15} />
    </View>
  );
};

export default FloatingDoodles;

const styles = StyleSheet.create({
  doodle: {
    position: 'absolute',
    opacity: 0.4,
  },
  emoji: {
    fontSize: 24,
  },
});
