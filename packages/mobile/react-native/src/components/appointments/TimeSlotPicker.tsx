import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  remaining: number;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedDate: string | null;
  selectedTime: string | null;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const dates = useMemo(() => {
    const unique = [...new Set(slots.map((s) => s.date))];
    return unique.slice(0, 14);
  }, [slots]);

  const timeSlotsForDate = useMemo(() => {
    return slots.filter((s) => s.date === selectedDate);
  }, [slots, selectedDate]);

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return DAYS_OF_WEEK[date.getDay()];
  };

  const getDateNumber = (dateStr: string) => {
    return new Date(dateStr).getDate();
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}
      >
        {dates.map((date) => {
          const isSelected = date === selectedDate;
          const todaySlots = slots.filter((s) => s.date === date);
          const hasAvailable = todaySlots.some((s) => s.isAvailable);

          return (
            <TouchableOpacity
              key={date}
              onPress={() => onSelectDate(date)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
                alignItems: 'center',
                minWidth: 70,
              }}
            >
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  color: isSelected ? colors.textInverse : colors.textSecondary,
                  fontFamily: typography.fontFamily.arabic.regular,
                }}
              >
                {getDayName(date)}
              </Text>
              <Text
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: '700',
                  color: isSelected ? colors.textInverse : colors.text,
                  marginTop: spacing.xs,
                }}
              >
                {getDateNumber(date)}
              </Text>
              {!hasAvailable && (
                <Text
                  style={{
                    fontSize: 8,
                    color: isSelected ? colors.textInverse : colors.error,
                    marginTop: spacing.xxs,
                  }}
                >
                  Full
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedDate && (
        <View style={{ marginTop: spacing.lg }}>
          <Text
            style={{
              fontSize: typography.fontSize.md,
              fontWeight: '600',
              color: colors.text,
              marginBottom: spacing.md,
              fontFamily: typography.fontFamily.arabic.bold,
            }}
          >
            Available Times
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {timeSlotsForDate.map((slot) => {
              const isSelected = slot.startTime === selectedTime;
              return (
                <TouchableOpacity
                  key={`${slot.startTime}-${slot.endTime}`}
                  onPress={() => slot.isAvailable && onSelectTime(slot.startTime)}
                  disabled={!slot.isAvailable}
                  style={{
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: isSelected
                      ? colors.primary
                      : slot.isAvailable
                      ? colors.surface
                      : colors.borderLight,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? colors.primary
                      : slot.isAvailable
                      ? colors.border
                      : colors.borderLight,
                    opacity: slot.isAvailable ? 1 : 0.5,
                  }}
                >
                  <Text
                    style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: '600',
                      color: isSelected ? colors.textInverse : colors.text,
                      fontFamily: typography.fontFamily.arabic.regular,
                    }}
                  >
                    {slot.startTime} - {slot.endTime}
                  </Text>
                  {slot.remaining <= 3 && slot.isAvailable && (
                    <Text
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: isSelected ? colors.textInverse : colors.warning,
                        textAlign: 'center',
                        marginTop: spacing.xxs,
                      }}
                    >
                      {slot.remaining} left
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};
