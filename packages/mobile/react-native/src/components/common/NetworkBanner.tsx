import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useOffline } from '../../hooks/useOffline';

export const NetworkBanner: React.FC = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const { isOnline } = useOffline();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (!isOnline) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.back),
      });
    } else {
      translateY.value = withTiming(-100, { duration: 200 });
    }
  }, [isOnline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (isOnline) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.warning,
          paddingTop: insets.top + spacing.xs,
          paddingBottom: spacing.sm,
          paddingHorizontal: spacing.lg,
          zIndex: 9999,
          alignItems: 'center',
        },
        animatedStyle,
      ]}
    >
      <Text
        style={{
          color: '#000',
          fontSize: typography.fontSize.sm,
          fontWeight: '600',
          fontFamily: typography.fontFamily.arabic.regular,
        }}
      >
        You are offline. Data will sync when connected.
      </Text>
    </Animated.View>
  );
};
