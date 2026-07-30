import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xxxxl,
        paddingVertical: spacing.section,
      }}
    >
      {icon && (
        <View style={{ marginBottom: spacing.xl, opacity: 0.5 }}>
          {icon}
        </View>
      )}
      <Text
        style={{
          fontSize: typography.fontSize.xl,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
          fontFamily: typography.fontFamily.arabic.bold,
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            fontSize: typography.fontSize.md,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.xl,
            lineHeight: typography.fontSize.md * 1.6,
            fontFamily: typography.fontFamily.arabic.regular,
          }}
        >
          {description}
        </Text>
      )}
      {actionTitle && onAction && (
        <Button title={actionTitle} onPress={onAction} variant="primary" size="md" />
      )}
    </View>
  );
};
