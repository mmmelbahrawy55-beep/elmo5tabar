import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

type BadgeVariant = 'dot' | 'number' | 'text';
type BadgeColor = 'primary' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  count?: number;
  text?: string;
  color?: BadgeColor;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'number',
  count,
  text,
  color = 'error',
  size = 'sm',
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const getColor = () => {
    switch (color) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.info;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return { dotSize: 8, fontSize: typography.fontSize.xs, padding: spacing.xxs };
      case 'md':
        return { dotSize: 10, fontSize: typography.fontSize.sm, padding: spacing.xs };
      case 'lg':
        return { dotSize: 12, fontSize: typography.fontSize.md, padding: spacing.sm };
    }
  };

  const bgColor = getColor();
  const s = getSize();

  if (variant === 'dot') {
    return (
      <View
        style={{
          width: s.dotSize,
          height: s.dotSize,
          borderRadius: s.dotSize / 2,
          backgroundColor: bgColor,
        }}
      />
    );
  }

  if (variant === 'number' && count !== undefined && count > 0) {
    const displayCount = count > 99 ? '99+' : String(count);
    return (
      <View
        style={{
          backgroundColor: bgColor,
          borderRadius: borderRadius.full,
          paddingHorizontal: s.padding + 2,
          paddingVertical: s.padding,
          minWidth: s.dotSize * 2.5,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: colors.textInverse,
            fontSize: s.fontSize,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {displayCount}
        </Text>
      </View>
    );
  }

  if (variant === 'text' && text) {
    return (
      <View
        style={{
          backgroundColor: bgColor + '20',
          borderRadius: borderRadius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          alignSelf: 'flex-start',
        }}
      >
        <Text
          style={{
            color: bgColor,
            fontSize: s.fontSize,
            fontWeight: '600',
            fontFamily: typography.fontFamily.arabic.regular,
          }}
        >
          {text}
        </Text>
      </View>
    );
  }

  return null;
};
