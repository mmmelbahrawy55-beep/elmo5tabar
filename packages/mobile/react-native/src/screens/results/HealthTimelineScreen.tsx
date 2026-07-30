import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useHealthTimeline } from '../../hooks/useResults';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'test', label: 'Tests' },
  { key: 'appointment', label: 'Appointments' },
  { key: 'medicine', label: 'Medicine' },
];

export const HealthTimelineScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: timeline, isLoading } = useHealthTimeline({
    type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'test': return '🔬';
      case 'appointment': return '📅';
      case 'medicine': return '💊';
      default: return '📌';
    }
  };

  const filteredEvents = timeline?.filter((e) => typeFilter === 'all' || e.type === typeFilter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: typography.fontSize.h2, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
          Health Timeline
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {TYPE_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setTypeFilter(filter.key)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.pill,
                  backgroundColor: typeFilter === filter.key ? colors.primary : colors.borderLight,
                }}
              >
                <Text style={{ fontSize: typography.fontSize.sm, color: typeFilter === filter.key ? colors.textInverse : colors.text, fontFamily: typography.fontFamily.arabic.regular }}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {isLoading ? (
        <SkeletonList />
      ) : !filteredEvents || filteredEvents.length === 0 ? (
        <EmptyState title="No events found" description="Your health timeline is empty" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxxl }}>
          <View style={{ position: 'relative', paddingLeft: spacing.xxl }}>
            <View style={{ position: 'absolute', left: spacing.md, top: 0, bottom: 0, width: 2, backgroundColor: colors.border }} />
            {filteredEvents.map((event) => {
              const isExpanded = expandedIds.has(event.id);
              return (
                <TouchableOpacity key={event.id} onPress={() => toggleExpand(event.id)} style={{ marginBottom: spacing.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: spacing.xxl, alignItems: 'center', position: 'absolute', left: -spacing.xxl + spacing.md - 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary }}>
                        <Text>{getIcon(event.type)}</Text>
                      </View>
                    </View>
                    <Card variant={isExpanded ? 'elevated' : 'flat'} style={{ flex: 1, marginLeft: spacing.lg }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text, flex: 1, fontFamily: typography.fontFamily.arabic.bold }}>
                          {event.titleAr || event.title}
                        </Text>
                        <Badge variant="dot" color={event.type === 'test' ? 'primary' : event.type === 'appointment' ? 'info' : 'success'} />
                      </View>
                      <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
                        {new Date(event.date).toLocaleDateString('ar-SA')}
                      </Text>
                      {isExpanded && event.description && (
                        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text, marginTop: spacing.md, fontFamily: typography.fontFamily.arabic.regular }}>
                          {event.descriptionAr || event.description}
                        </Text>
                      )}
                    </Card>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
};
