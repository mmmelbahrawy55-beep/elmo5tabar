import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useResult, useResultPDF, useResultQR } from '../../hooks/useResults';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SkeletonCard } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/format';

interface ResultDetailScreenProps {
  route: { params: { id: string } };
  navigation: any;
}

export const ResultDetailScreen: React.FC<ResultDetailScreenProps> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const { data: report, isLoading, error } = useResult(id);
  const { data: pdfData } = useResultPDF(id);
  const { data: qrData } = useResultQR(id);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: insets.top }}>
        <SkeletonCard />
      </View>
    );
  }

  if (error || !report) {
    return (
      <EmptyState title="Error" description="Failed to load report" actionTitle="Retry" onAction={() => navigation.goBack()} />
    );
  }

  const getResultColor = (status: string) => {
    if (status === 'abnormal_high' || status === 'abnormal_low') return colors.error;
    if (status === 'normal') return colors.success;
    return colors.textSecondary;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary, fontSize: typography.fontSize.md }}>← Back</Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: '600',
              color: colors.text,
              fontFamily: typography.fontFamily.arabic.bold,
            }}
          >
            Report #{report.reportNumber}
          </Text>
          <Badge variant="text" text={report.status} color={report.status === 'completed' ? 'success' : 'warning'} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxxl }}>
        <Card variant="flat" style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>Patient</Text>
              <Text style={{ fontSize: typography.fontSize.lg, color: colors.text, fontFamily: typography.fontFamily.arabic.bold }}>
                {report.patientNameAr || report.patientName}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>Date</Text>
              <Text style={{ fontSize: typography.fontSize.md, color: colors.text }}>
                {formatDate(report.createdAt, 'ar')}
              </Text>
            </View>
          </View>
        </Card>

        {report.results.map((result, index) => (
          <Card
            key={result.id}
            variant="elevated"
            style={{ marginBottom: spacing.md }}
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
                {result.testNameAr || result.testName}
              </Text>
              {result.isAbnormal && <Badge variant="text" text="Abnormal" color="error" />}
            </View>

            <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.xl }}>
              <View>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>Result</Text>
                <Text
                  style={{
                    fontSize: typography.fontSize.h3,
                    fontWeight: '700',
                    color: getResultColor(result.status),
                  }}
                >
                  {result.resultValue}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>Range</Text>
                <Text style={{ fontSize: typography.fontSize.md, color: colors.text }}>{result.referenceRange}</Text>
              </View>
              {result.unit && (
                <View>
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>Unit</Text>
                  <Text style={{ fontSize: typography.fontSize.md, color: colors.text }}>{result.unit}</Text>
                </View>
              )}
            </View>
          </Card>
        ))}

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
          <Button title="Download PDF" onPress={() => {}} variant="outline" style={{ flex: 1 }} />
          <Button title="Share" onPress={() => {}} variant="outline" style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <Button title="Compare" onPress={() => navigation.navigate('ResultComparison', { reportId: id })} variant="ghost" style={{ flex: 1 }} />
          <Button title="AI Explain" onPress={() => navigation.navigate('AIAssistant', { resultId: id })} variant="ghost" style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </View>
  );
};
