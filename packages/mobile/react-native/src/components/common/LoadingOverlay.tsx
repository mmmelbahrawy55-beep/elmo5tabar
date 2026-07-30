import React, { useEffect } from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { ProgressBar } from './ProgressBar';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
  progress,
  showProgress = false,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.back) });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.8, { duration: 150 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0, 1], [0, 0.5], Extrapolation.CLAMP),
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          },
          backdropStyle,
        ]}
      >
        <TouchableBlocker />
        <Animated.View
          style={[
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              paddingHorizontal: spacing.xxxl,
              paddingVertical: spacing.xxl,
              alignItems: 'center',
              minWidth: 200,
              maxWidth: 300,
            },
            contentStyle,
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          {message && (
            <Text
              style={{
                marginTop: spacing.lg,
                fontSize: typography.fontSize.md,
                color: colors.text,
                textAlign: 'center',
                fontFamily: typography.fontFamily.arabic.regular,
              }}
            >
              {message}
            </Text>
          )}
          {showProgress && progress !== undefined && (
            <View style={{ width: '100%', marginTop: spacing.lg }}>
              <ProgressBar progress={progress} />
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const TouchableBlocker: React.FC = () => (
  <View
    style={StyleSheet.absoluteFill}
    onStartShouldSetResponder={() => true}
  />
);

import { StyleSheet } from 'react-native';
