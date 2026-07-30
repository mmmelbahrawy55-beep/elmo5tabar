import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useResultComparison } from '../../hooks/useResults';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';

export const ResultComparisonScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: comparisonData, isLoading } = useResultComparison({
    testId: route.params?.testId || '',
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary, fontSize: typography.fontSize.md }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: typography.fontSize.h3, fontWeight: '700', color: colors.text, marginLeft: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
            Result Comparison
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxxl }}>
        <Card variant="flat" style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md }}>
            Select Date Range
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>From</Text>
              <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm }}>
                <Text style={{ fontSize: typography.fontSize.md, color: colors.text }}>{dateFrom || 'Select date'}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>To</Text>
              <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm }}>
                <Text style={{ fontSize: typography.fontSize.md, color: colors.text }}>{dateTo || 'Select date'}</Text>
              </View>
            </View>
          </View>
        </Card>

        {comparisonData && comparisonData.length > 0 ? (
          <>
            {comparisonData.map((item, index) => (
              <Card key={index} variant={index % 2 === 0 ? 'elevated' : 'flat'} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: typography.fontSize.md, color: colors.text }}>
                    {new Date(item.date).toLocaleDateString('ar-SA')}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: '700',
                      color: item.status === 'normal' ? colors.success : colors.error,
                    }}
                  >
                    {item.value} {item.unit}
                  </Text>
                </View>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
                  Range: {item.referenceRange}
                </Text>
              </Card>
            ))}
            <Button title="Export CSV" onPress={() => {}} variant="outline" fullWidth style={{ marginTop: spacing.lg }} />
          </>
        ) : (
          <EmptyState title="No comparison data" description="Select a date range to compare results" />
        )}
      </ScrollView>
    </View>
  );
};
