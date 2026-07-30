import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/format';

interface ResultCardProps {
  reportNumber: string;
  patientName: string;
  testCount: number;
  abnormalCount: number;
  status: 'completed' | 'pending' | 'partial' | 'cancelled';
  createdAt: string;
  onPress: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  reportNumber,
  patientName,
  testCount,
  abnormalCount,
  status,
  createdAt,
  onPress,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'partial':
        return colors.info;
      case 'cancelled':
        return colors.error;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'partial':
        return 'Partial';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.md,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              fontFamily: typography.fontFamily.arabic.regular,
            }}
          >
            #{reportNumber}
          </Text>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: '600',
              color: colors.text,
              marginTop: spacing.xs,
              fontFamily: typography.fontFamily.arabic.bold,
            }}
          >
            {patientName}
          </Text>
        </View>
        <Badge
          variant="text"
          text={getStatusText()}
          color={
            status === 'completed'
              ? 'success'
              : status === 'pending'
              ? 'warning'
              : status === 'partial'
              ? 'info'
              : 'error'
          }
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          gap: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
            Tests:
          </Text>
          <Text
            style={{
              fontSize: typography.fontSize.md,
              fontWeight: '600',
              color: colors.text,
            }}
          >
            {testCount}
          </Text>
        </View>
        {abnormalCount > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              Abnormal:
            </Text>
            <Badge count={abnormalCount} color="error" size="sm" />
          </View>
        )}
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.textTertiary }}>
            {formatDate(createdAt, 'ar')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
