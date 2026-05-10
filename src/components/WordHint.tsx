import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing } from '../theme/spacing';

type Props = {
  word: string;
  hint: string;
};

/**
 * Displays word hint as animated underscores with revealed letters.
 * Each character is its own cell for individual reveal styling.
 */
const WordHint = ({ word = '', hint = '' }: Props) => {
  const chars = hint ? hint.split('') : [];

  return (
    <View style={styles.container}>
      <Text style={styles.category}>Guess the word!</Text>
      <View style={styles.letterRow}>
        {chars.map((char, i) =>
          char === ' ' ? (
            <View key={i} style={styles.space} />
          ) : (
            <View key={i} style={styles.letterBox}>
              <Text
                style={[
                  styles.letter,
                  char !== '_' && styles.revealed,
                ]}
              >
                {char === '_' ? '' : char}
              </Text>
              <View style={[styles.underline, char !== '_' && styles.underlineRevealed]} />
            </View>
          )
        )}
      </View>
      <Text style={styles.charCount}>{word ? word.length : 0} letters</Text>
    </View>
  );
};

export default React.memo(WordHint);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  category: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
    opacity: 0.6,
  },
  letterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  space: {
    width: 16,
  },
  letterBox: {
    alignItems: 'center',
    minWidth: 18,
    gap: 2,
  },
  letter: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.xl,
    color: Colors.warmBlack,
    textTransform: 'uppercase',
  },
  revealed: {
    color: Colors.border,
  },
  underline: {
    height: 2,
    width: '100%',
    backgroundColor: Colors.softGray,
    borderRadius: 1,
  },
  underlineRevealed: {
    backgroundColor: Colors.border,
  },
  charCount: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
    opacity: 0.5,
  },
});
