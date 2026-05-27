import React, { memo } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import SpiralBinder from './SpiralBinder';

const { height } = Dimensions.get('window');

// Tiny repeating noise texture base64
const NOISE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAI0lEQVR42u3OMQEAAAwCIMt/0z2MMQ4iIICoKioqKioqKioqKl4f3P18gR0AAAAASUVORK5CYII=';

// More realistic noise
const BETTER_NOISE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAQMAAACQp+OdAAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQOb+/0F7bZQAAABPSURBVCjPpcoxCgAxCATAf5vP+Vl7jW9RCEGE7G6m4MAQ1u4QG2YwQG2YwQC1YQYD1IYZDFAbZjBAbZjBALVhBgPUhhkMUBtmMEBtmMEAtWGGA2P+sN5GAAAAAElFTkSuQmCC';

import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children?: React.ReactNode;
};

const NotebookBackground = ({ children }: Props) => {
  // Line spacing: ~40px is good for a sketchbook feel
  const SPACING = 42;
  const numLines = Math.floor(height / SPACING);

  return (
    <View style={styles.container}>
      {/* Base Paper Color */}
      <View style={styles.paperBase} />

      {/* Spiral Binder rings on the side */}
      <SpiralBinder />

      {/* Subtle Grain/Noise Texture */}
      <Image
        source={{ uri: BETTER_NOISE }}
        style={[styles.noiseOverlay, { opacity: 0.03 }]}
        resizeMode="repeat"
      />

      {/* Horizontal Notebook Lines */}
      <View style={styles.linesContainer} pointerEvents="none">
        {Array.from({ length: numLines }).map((_, i) => (
          <View key={i} style={[styles.paperLine, { top: SPACING + i * SPACING }]} />
        ))}
      </View>

      {/* Main Content inside Safe Area */}
      <SafeAreaView style={styles.content}>
        {children}
      </SafeAreaView>
    </View>
  );
};

export default memo(NotebookBackground);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE7D5', // User's requested warm cream paper tone
  },
  paperBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ECE7D5',
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    // The noise image is dark, so a very low opacity creates a soft grain effect
  },
  linesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  paperLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#D8D2BE', // User's requested line color
    opacity: 0.35, // Opacity between 0.3 and 0.4
  },
  content: {
    flex: 1,
    zIndex: 1, // Ensure content is above the background layers
  },
});
