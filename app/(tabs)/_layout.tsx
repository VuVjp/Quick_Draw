import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { Colors } from '../../src/theme/colors';
import { FontFamily, FontSize } from '../../src/theme/typography';
import { Radius, Spacing } from '../../src/theme/spacing';
import { useHaptics } from '../../src/hooks/useHaptics';

const AnimatedIcon = Animated.createAnimatedComponent(Feather);

const CustomTabBarButton = ({ children, onPress, accessibilityState, label, icon }: any) => {
  const isSelected = accessibilityState?.selected;
  const { light } = useHaptics();
  
  const handlePress = (e: any) => {
    light();
    onPress(e);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.tabButtonContainer}
    >
      <View style={[styles.tabButton, isSelected ? styles.tabButtonActive : null]}>
        <Feather 
          name={icon} 
          size={20} 
          color={Colors.warmBlack} 
        />
        {isSelected && (
          <Text style={styles.tabLabelActive}>{label}</Text>
        )}
      </View>
      {!isSelected && (
        <Text style={styles.tabLabelInactive}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen 
        name="lobby" 
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} label="Lobby" icon="grid" />
        }}
      />
      <Tabs.Screen 
        name="ranking" 
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} label="Rankings" icon="award" />
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} label="Profile" icon="user" />
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.paperWhite,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 80 : 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingHorizontal: Spacing.md,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryYellow,
    borderWidth: 1.5,
    borderColor: Colors.border,
    transform: [{ translateY: -4 }],
    ...Platform.select({
      ios: {
        shadowColor: Colors.warmBlack,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 0,
      },
      android: {
        elevation: 2,
      },
      default: {},
    })
  },
  tabLabelActive: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
  tabLabelInactive: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.xs,
    color: Colors.warmBlack,
    opacity: 0.6,
    marginTop: 4,
  }
});
