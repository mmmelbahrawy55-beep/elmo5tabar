import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface SkeletonBaseProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: Record<string, unknown>;
}

const SkeletonBase: React.FC<SkeletonBaseProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
}) => {
  const { theme } = useTheme();
  const { colors, borderRadius: br } = theme;
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.ease }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmer.value,
      [0, 0.5, 1],
      [0.3, 0.1, 0.3],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius: borderRadius ?? br.sm,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  width?: number | string;
  lastLineWidth?: number | string;
}> = ({ lines = 3, width = '100%', lastLineWidth = '60%' }) => {
  const { theme } = useTheme();
  const { spacing } = theme;

  return (
    <View style={{ gap: spacing.sm }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase
          key={i}
          width={i === lines - 1 ? lastLineWidth : width}
          height={14}
        />
      ))}
    </View>
  );
};

export const SkeletonCard: React.FC = () => {
  const { theme } = useTheme();
  const { spacing } = theme;

  return (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      <SkeletonBase width="40%" height={18} />
      <SkeletonText lines={2} />
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
        <SkeletonBase width={80} height={32} borderRadius={16} />
        <SkeletonBase width={80} height={32} borderRadius={16} />
      </View>
    </View>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const { theme } = useTheme();
  const { spacing } = theme;

  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <SkeletonBase width={48} height={48} borderRadius={24} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <SkeletonBase width="60%" height={16} />
            <SkeletonBase width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const SkeletonCircle: React.FC<{ size?: number }> = ({ size = 48 }) => {
  return <SkeletonBase width={size} height={size} borderRadius={size / 2} />;
};

export const SkeletonImage: React.FC<{
  width?: number | string;
  height?: number;
}> = ({ width = '100%', height = 200 }) => {
  return <SkeletonBase width={width} height={height} />;
};
