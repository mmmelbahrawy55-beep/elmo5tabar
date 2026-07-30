import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  I18nManager,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  showCharCount?: boolean;
  maxChars?: number;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  showCharCount = false,
  maxChars,
  containerStyle,
  value,
  onChangeText,
  ...rest
}) => {
  const { theme } = useTheme();
  const { colors, borderRadius, spacing, typography } = theme;
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusAnim = useSharedValue(value ? 1 : 0);

  const handleFocus = () => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      focusAnim.value = withTiming(0, { duration: 200 });
    }
  };

  const handleChangeText = (text: string) => {
    if (maxChars && text.length > maxChars) return;
    onChangeText?.(text);
  };

  const labelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      focusAnim.value,
      [0, 1],
      [0, -22],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      focusAnim.value,
      [0, 1],
      [1, 0.85],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY }, { scale }],
      color: isFocused ? colors.primary : error ? colors.error : colors.textSecondary,
    };
  });

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;

  return (
    <View style={[{ marginBottom: spacing.lg }, containerStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={{
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor,
          borderRadius: borderRadius.md,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.lg,
          minHeight: 56,
        }}
      >
        {leftIcon && (
          <View style={{ marginRight: spacing.sm }}>{leftIcon}</View>
        )}
        <View style={{ flex: 1, position: 'relative', justifyContent: 'center' }}>
          <Animated.Text
            style={[
              {
                position: 'absolute',
                left: 0,
                fontSize: typography.fontSize.md,
                fontFamily: typography.fontFamily.arabic.regular,
              },
              labelStyle,
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isPassword && !showPassword}
            style={{
              fontSize: typography.fontSize.md,
              color: colors.text,
              fontFamily: typography.fontFamily.arabic.regular,
              paddingTop: 18,
              paddingBottom: 2,
              textAlign: I18nManager.isRTL ? 'right' : 'left',
              writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
            }}
            placeholderTextColor={colors.textTertiary}
            {...rest}
          />
        </View>
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ marginLeft: spacing.sm }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={{ marginLeft: spacing.sm }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      <View
        style={{
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          justifyContent: 'space-between',
          marginTop: spacing.xs,
        }}
      >
        {error && (
          <Text
            style={{
              color: colors.error,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.arabic.regular,
            }}
          >
            {error}
          </Text>
        )}
        {showCharCount && maxChars && (
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: typography.fontSize.sm,
              textAlign: 'right',
              flex: 1,
            }}
          >
            {(value?.length ?? 0)}/{maxChars}
          </Text>
        )}
      </View>
    </View>
  );
};
