import React from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 100;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

interface AnimatedHeaderProps {
  scrollY: Animated.Value;
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  backgroundColors?: string[];
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  scrollY,
  title,
  subtitle,
  leftAction,
  rightAction,
  backgroundColors,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const insets = useSafeAreaInsets();

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE / 2],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: backgroundColors?.[0] || colors.primary,
          zIndex: 10,
          height: headerHeight,
          overflow: 'hidden',
        },
      ]}
    >
      <Animated.View
        style={{
          flex: 1,
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.lg,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {leftAction && <View>{leftAction}</View>}
          {rightAction && <View>{rightAction}</View>}
        </View>
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'center',
            transform: [
              { scale: titleScale },
              { translateY: titleTranslateY },
            ],
          }}
        >
          <Text
            style={{
              color: colors.textInverse,
              fontSize: typography.fontSize.h2,
              fontWeight: '700',
              fontFamily: typography.fontFamily.arabic.bold,
              textAlign: 'left',
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Animated.Text
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: typography.fontSize.md,
                marginTop: spacing.xs,
                fontFamily: typography.fontFamily.arabic.regular,
                opacity: subtitleOpacity,
              }}
            >
              {subtitle}
            </Animated.Text>
          )}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

export { HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT, HEADER_SCROLL_DISTANCE };
