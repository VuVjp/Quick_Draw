import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MainTabParamList } from '../navigation/MainTabs';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import PaperCard from '../components/PaperCard';

const { height } = Dimensions.get('window');

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'ProfileTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ProfileScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: Math.floor(height / 40) }).map((_, i) => (
          <View key={i} style={[styles.paperLine, { top: 40 + i * 40 }]} />
        ))}
      </View>

      <Animated.View entering={FadeInDown.springify().damping(14)} style={styles.content}>
        
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarFrame}>
            <Text style={styles.avatar}>🧑‍🎨</Text>
          </View>
          <View style={styles.starBadge}>
            <Text style={styles.starText}>⭐</Text>
          </View>
        </View>

        {/* Info */}
        <Text style={styles.name}>Artist</Text>
        <Text style={styles.subtitle}>The First</Text>

        {/* XP */}
        <View style={styles.xpHeader}>
          <Text style={styles.levelText}>Level 12</Text>
          <Text style={styles.xpText}>1,250 / 2,000 XP</Text>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpBar, { width: '60%' }]} />
        </View>

        {/* Edit Button */}
        <AnimatedButton
          label="Edit Profile"
          icon="✏️"
          onPress={() => {}}
          variant="ghost"
          style={styles.editBtn}
          textStyle={styles.editBtnText}
        />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <PaperCard style={styles.statCard} variant="yellow">
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>15,420</Text>
            <Text style={styles.statLabel}>TOTAL SCORE</Text>
          </PaperCard>
          
          <PaperCard style={styles.statCard} variant="pink">
            <Text style={styles.statIcon}>🍷</Text>
            <Text style={styles.statValue}>142</Text>
            <Text style={styles.statLabel}>WINS</Text>
          </PaperCard>
          
          <PaperCard style={styles.statCard} variant="blue">
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>210</Text>
            <Text style={styles.statLabel}>GUESSES</Text>
          </PaperCard>
        </View>

      </Animated.View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.notebookWhite,
    paddingHorizontal: Spacing.xl,
  },
  paperLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    borderBottomWidth: 1, borderBottomColor: Colors.softGray, borderStyle: 'dashed', opacity: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatarFrame: {
    width: 100,
    height: 100,
    backgroundColor: Colors.paperWhite,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    fontSize: 56,
  },
  starBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryYellow,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: { fontSize: 12 },
  name: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 32,
    color: Colors.warmBlack,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
    opacity: 0.6,
    marginBottom: Spacing.lg,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  levelText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  xpText: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  xpTrack: {
    width: '50%',
    height: 12,
    backgroundColor: Colors.paperWhite,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  xpBar: {
    height: '100%',
    backgroundColor: Colors.primaryYellow,
    borderRadius: Radius.full,
  },
  editBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xxl,
  },
  editBtnText: {
    fontSize: FontSize.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Spacing.md,
  },
  statValue: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FontFamily.caveatBold,
    fontSize: 10,
    color: Colors.warmBlack,
    letterSpacing: 1,
  }
});
