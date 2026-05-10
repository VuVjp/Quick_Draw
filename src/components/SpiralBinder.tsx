import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';

const { height } = Dimensions.get('window');

const SpiralBinder = () => {
  const numRings = Math.floor(height / 40);

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: numRings }).map((_, i) => (
        <View key={i} style={styles.ringWrapper}>
          {/* Outer ring part */}
          <View style={styles.ring} />
          {/* Hole on paper */}
          <View style={styles.hole} />
        </View>
      ))}
    </View>
  );
};

export default SpiralBinder;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    top: 20,
    bottom: 0,
    zIndex: 10,
  },
  ringWrapper: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    width: 24,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#A0A0A0', // Metallic gray
    backgroundColor: 'transparent',
    position: 'absolute',
    left: -12,
  },
  hole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1CBB8', // Darker paper hole color
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});
