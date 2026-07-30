import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Badge } from '../common/Badge';

interface BranchCardProps {
  name: string;
  nameAr: string;
  address: string;
  distance?: number;
  rating: number;
  isOpen: boolean;
  facilities: string[];
  onPress: () => void;
}

export const BranchCard: React.FC<BranchCardProps> = ({
  name,
  nameAr,
  address,
  distance,
  rating,
  isOpen,
  facilities,
  onPress,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

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
              fontSize: typography.fontSize.lg,
              fontWeight: '600',
              color: colors.text,
              fontFamily: typography.fontFamily.arabic.bold,
            }}
          >
            {nameAr}
          </Text>
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              fontFamily: typography.fontFamily.english.regular,
            }}
          >
            {name}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
          <Badge
            variant="text"
            text={isOpen ? 'Open Now' : 'Closed'}
            color={isOpen ? 'success' : 'error'}
          />
          {distance !== undefined && (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.textTertiary }}>
              {distance.toFixed(1)} km
            </Text>
          )}
        </View>
      </View>

      <Text
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.textSecondary,
          marginTop: spacing.sm,
          fontFamily: typography.fontFamily.arabic.regular,
        }}
        numberOfLines={2}
      >
        {address}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing.md,
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.warning }}>★</Text>
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text,
              fontFamily: typography.fontFamily.arabic.regular,
            }}
          >
            {rating.toFixed(1)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {facilities.slice(0, 4).map((facility, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.borderLight,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xxs,
                borderRadius: borderRadius.pill,
              }}
            >
              <Text
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.textSecondary,
                }}
              >
                {facility}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};
