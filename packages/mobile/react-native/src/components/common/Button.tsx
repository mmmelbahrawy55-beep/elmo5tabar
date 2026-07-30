import React, { useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const { colors, borderRadius, spacing, typography, shadows } = theme;
  const scale = useSharedValue(1);

  const getButtonStyle = useCallback(() => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: colors.primary,
          ...shadows.md,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: colors.secondary,
          ...shadows.md,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: colors.error,
          ...shadows.md,
        };
      default:
        return base;
    }
  }, [variant, colors, borderRadius, shadows]);

  const getSizeStyle = useCallback((): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg };
      case 'md':
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
      case 'lg':
        return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl };
      case 'xl':
        return { paddingVertical: spacing.xl, paddingHorizontal: spacing.xxxl };
      default:
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
    }
  }, [size, spacing]);

  const getTextStyle = useCallback((): TextStyle => {
    const base: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    switch (size) {
      case 'sm':
        base.fontSize = typography.fontSize.sm;
        break;
      case 'md':
        base.fontSize = typography.fontSize.md;
        break;
      case 'lg':
        base.fontSize = typography.fontSize.lg;
        break;
      case 'xl':
        base.fontSize = typography.fontSize.xl;
        break;
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        base.color = colors.textInverse;
        break;
      case 'outline':
      case 'ghost':
        base.color = colors.primary;
        break;
    }

    return base;
  }, [size, variant, colors, typography]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : 1,
    };
  });

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <Animated.View
      style={[
        getButtonStyle(),
        getSizeStyle(),
        fullWidth && { width: '100%' },
        animatedStyle,
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={StyleSheet.absoluteFill}
      />
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[getTextStyle(), icon ? { marginHorizontal: spacing.sm } : {}, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Animated.View>
  );
};
