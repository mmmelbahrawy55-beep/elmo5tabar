import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Badge } from '../common/Badge';
import { formatDate, formatTime } from '../../utils/format';

interface AppointmentCardProps {
  patientName: string;
  branchName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  testNames: string[];
  queueNumber?: number | null;
  onPress: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  patientName,
  branchName,
  date,
  time,
  status,
  testNames,
  queueNumber,
  onPress,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const getStatusConfig = () => {
    switch (status) {
      case 'scheduled':
        return { color: 'primary' as const, text: 'Scheduled' };
      case 'confirmed':
        return { color: 'info' as const, text: 'Confirmed' };
      case 'in_progress':
        return { color: 'warning' as const, text: 'In Progress' };
      case 'completed':
        return { color: 'success' as const, text: 'Completed' };
      case 'cancelled':
        return { color: 'error' as const, text: 'Cancelled' };
    }
  };

  const statusConfig = getStatusConfig();

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: '600',
            color: colors.text,
            flex: 1,
            fontFamily: typography.fontFamily.arabic.bold,
          }}
        >
          {patientName}
        </Text>
        <Badge variant="text" text={statusConfig.text} color={statusConfig.color} />
      </View>

      <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
        <Text
          style={{
            fontSize: typography.fontSize.md,
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.arabic.regular,
          }}
        >
          {branchName}
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.md,
            color: colors.text,
            fontFamily: typography.fontFamily.arabic.regular,
          }}
        >
          {formatDate(date, 'ar')} - {formatTime(time, 'ar')}
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.textTertiary,
            fontFamily: typography.fontFamily.arabic.regular,
          }}
          numberOfLines={1}
        >
          {testNames.join(' • ')}
        </Text>
      </View>

      {queueNumber && (status === 'confirmed' || status === 'in_progress') && (
        <View
          style={{
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              fontFamily: typography.fontFamily.arabic.regular,
            }}
          >
            Queue #{queueNumber}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
