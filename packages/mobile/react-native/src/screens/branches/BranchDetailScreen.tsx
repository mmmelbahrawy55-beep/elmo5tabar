import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useBranch } from '../../hooks/useBranches';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SkeletonCard } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const BranchDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const { data: branch, isLoading, error } = useBranch(id);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: insets.top }}>
        <SkeletonCard />
      </View>
    );
  }

  if (error || !branch) {
    return <EmptyState title="Error" description="Failed to load branch details" actionTitle="Retry" onAction={() => navigation.goBack()} />;
  }

  const openMaps = () => {
    const url = `https://maps.google.com/?q=${branch.latitude},${branch.longitude}`;
    Linking.openURL(url);
  };

  const callBranch = () => {
    Linking.openURL(`tel:${branch.phone}`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxxl }}>
      <View style={{ height: 200, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48 }}>🏥</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: insets.top + spacing.md, left: spacing.lg }}>
          <Text style={{ color: colors.primary, fontSize: typography.fontSize.md }}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginTop: -20 }}>
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.fontSize.h2, fontWeight: '700', color: colors.text, fontFamily: typography.fontFamily.arabic.bold }}>
                {branch.nameAr}
              </Text>
              <Text style={{ fontSize: typography.fontSize.md, color: colors.textSecondary, marginTop: spacing.xs }}>
                {branch.name}
              </Text>
            </View>
            <Badge variant="text" text={branch.isOpen ? 'Open Now' : 'Closed'} color={branch.isOpen ? 'success' : 'error'} />
          </View>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.md, fontFamily: typography.fontFamily.arabic.regular }}>
            {branch.addressAr || branch.address}
          </Text>
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
          <Button title="Get Directions" onPress={openMaps} variant="outline" style={{ flex: 1 }} size="md" />
          <Button title="Call" onPress={callBranch} variant="primary" style={{ flex: 1 }} size="md" />
        </View>

        <Card variant="flat" style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md, fontFamily: typography.fontFamily.arabic.bold }}>
            Working Hours
          </Text>
          {branch.workingHours.map((wh, index) => (
            <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
              <Text style={{ fontSize: typography.fontSize.md, color: colors.text, fontFamily: typography.fontFamily.arabic.regular }}>
                {wh.dayAr || wh.day}
              </Text>
              <Text style={{ fontSize: typography.fontSize.md, color: colors.textSecondary }}>
                {wh.open} - {wh.close}
              </Text>
            </View>
          ))}
        </Card>

        <Card variant="flat" style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md, fontFamily: typography.fontFamily.arabic.bold }}>
            Services
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {branch.services.map((service) => (
              <View key={service.id} style={{ backgroundColor: colors.borderLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.pill }}>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.text }}>{service.icon} {service.nameAr || service.name}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md }}>
          {branch.facilities.map((facility, index) => (
            <Badge key={index} variant="text" text={facility} color="info" />
          ))}
        </View>

        <Button title="Book Appointment at this Branch" onPress={() => navigation.navigate('BookAppointment', { branchId: branch.id })} fullWidth size="lg" style={{ marginTop: spacing.lg }} />
      </View>
    </ScrollView>
  );
};
