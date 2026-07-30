import React from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: number;
  style?: ViewStyle;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  padding,
  style,
  header,
  footer,
}) => {
  const { theme } = useTheme();
  const { colors, borderRadius, spacing, shadows } = theme;

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'flat':
        return {
          backgroundColor: colors.surfaceAlt,
        };
    }
  };

  const cardPadding = padding ?? spacing.lg;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        {
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
        },
        getVariantStyle(),
        style,
      ]}
    >
      {header && (
        <View style={{ padding: cardPadding, paddingBottom: 0 }}>{header}</View>
      )}
      <View style={{ padding: cardPadding }}>{children}</View>
      {footer && (
        <View
          style={{
            padding: cardPadding,
            paddingTop: 0,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            marginTop: spacing.sm,
          }}
        >
          {footer}
        </View>
      )}
    </Wrapper>
  );
};
