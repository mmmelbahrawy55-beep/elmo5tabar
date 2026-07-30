import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useBranches } from '../../hooks/useBranches';
import { BranchCard } from '../../components/branches/BranchCard';
import { BranchMap } from '../../components/branches/BranchMap';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';

export const BranchListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const { data: branches, isLoading, error } = useBranches({
    search: searchQuery || undefined,
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={{ fontSize: typography.fontSize.h2, fontWeight: '700', color: colors.text, fontFamily: typography.fontFamily.arabic.bold }}>
            Branches
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => setShowMap(false)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.pill,
                backgroundColor: !showMap ? colors.primary : colors.borderLight,
              }}
            >
              <Text style={{ fontSize: typography.fontSize.sm, color: !showMap ? colors.textInverse : colors.text }}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowMap(true)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.pill,
                backgroundColor: showMap ? colors.primary : colors.borderLight,
              }}
            >
              <Text style={{ fontSize: typography.fontSize.sm, color: showMap ? colors.textInverse : colors.text }}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>
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
            placeholder="Search branch..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, fontSize: typography.fontSize.md, color: colors.text, paddingVertical: spacing.md, fontFamily: typography.fontFamily.arabic.regular }}
          />
        </View>
      </View>

      {isLoading ? (
        <SkeletonList />
      ) : error ? (
        <EmptyState title="Error" description="Failed to load branches" actionTitle="Retry" onAction={() => {}} />
      ) : !branches || branches.length === 0 ? (
        <EmptyState title="No branches found" description="No branches match your search" />
      ) : showMap ? (
        <View style={{ flex: 1 }}>
          <BranchMap
            branches={branches.map((b) => ({ id: b.id, name: b.name, nameAr: b.nameAr, latitude: b.latitude, longitude: b.longitude, distance: b.distance, isOpen: b.isOpen }))}
            onMarkerPress={(branch) => navigation.navigate('BranchDetail', { id: branch.id })}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxxl }}>
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              name={branch.name}
              nameAr={branch.nameAr}
              address={branch.addressAr || branch.address}
              distance={branch.distance}
              rating={branch.rating}
              isOpen={branch.isOpen}
              facilities={branch.facilities}
              onPress={() => navigation.navigate('BranchDetail', { id: branch.id })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};
