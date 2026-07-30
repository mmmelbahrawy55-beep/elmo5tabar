import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  indeterminate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  backgroundColor,
  height = 6,
  showLabel = false,
  label,
  indeterminate = false,
}) => {
  const { theme } = useTheme();
  const { colors, borderRadius, spacing, typography } = theme;
  const animValue = useSharedValue(0);
  const indeterminateAnim = useSharedValue(0);

  const barColor = color || colors.primary;
  const trackColor = backgroundColor || colors.borderLight;

  useEffect(() => {
    if (indeterminate) {
      indeterminateAnim.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        -1,
      );
    } else {
      animValue.value = withTiming(progress, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [progress, indeterminate]);

  const progressStyle = useAnimatedStyle(() => {
    if (indeterminate) {
      const translateX = interpolate(
        indeterminateAnim.value,
        [0, 1],
        [-100, 200],
        Extrapolation.CLAMP,
      );
      return {
        transform: [{ translateX }],
        width: '50%',
      };
    }
    return {
      width: `${animValue.value * 100}%`,
    };
  });

  return (
    <View>
      <View
        style={{
          height,
          backgroundColor: trackColor,
          borderRadius: borderRadius.full,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              backgroundColor: barColor,
              borderRadius: borderRadius.full,
            },
            progressStyle,
          ]}
        />
      </View>
      {(showLabel || label) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: spacing.xs,
          }}
        >
          {label && (
            <Text
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.arabic.regular,
              }}
            >
              {label}
            </Text>
          )}
          {showLabel && !indeterminate && (
            <Text
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.arabic.regular,
              }}
            >
              {Math.round(progress * 100)}%
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
