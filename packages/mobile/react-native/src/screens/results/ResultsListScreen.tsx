import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useResults } from '../../hooks/useResults';
import { ResultCard } from '../../components/results/ResultCard';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';
import { Badge } from '../../components/common/Badge';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'abnormal', label: 'Abnormal' },
];

export const ResultsListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: results, isLoading, error } = useResults({
    search: searchQuery || undefined,
    status: statusFilter !== 'all' && statusFilter !== 'abnormal' ? statusFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredResults = results?.filter((r) => {
    if (statusFilter === 'abnormal') return r.results.some((res) => res.isAbnormal);
    return true;
  });

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
        <Text
          style={{
            fontSize: typography.fontSize.h2,
            fontWeight: '700',
            color: colors.text,
            marginBottom: spacing.lg,
            fontFamily: typography.fontFamily.arabic.bold,
          }}
        >
          Test Results
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.background,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <Text style={{ fontSize: 16, color: colors.textTertiary, marginRight: spacing.sm }}>🔍</Text>
          <TextInput
            placeholder="Search results..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              fontSize: typography.fontSize.md,
              color: colors.text,
              paddingVertical: spacing.md,
              fontFamily: typography.fontFamily.arabic.regular,
            }}
          />
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Text style={{ fontSize: 16, color: showFilters ? colors.primary : colors.textTertiary }}>⚙</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setStatusFilter(filter.key)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.pill,
                  backgroundColor: statusFilter === filter.key ? colors.primary : colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: statusFilter === filter.key ? colors.textInverse : colors.text,
                    fontFamily: typography.fontFamily.arabic.regular,
                  }}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : error ? (
        <EmptyState title="Error" description="Failed to load results" actionTitle="Retry" onAction={onRefresh} />
      ) : !filteredResults || filteredResults.length === 0 ? (
        <EmptyState title="No results found" description="No test results match your criteria" />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {filteredResults.map((result) => (
            <ResultCard
              key={result.id}
              reportNumber={result.reportNumber}
              patientName={result.patientNameAr || result.patientName}
              testCount={result.results.length}
              abnormalCount={result.results.filter((r) => r.isAbnormal).length}
              status={result.status}
              createdAt={result.createdAt}
              onPress={() => navigation.navigate('ResultDetail', { id: result.id })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};
