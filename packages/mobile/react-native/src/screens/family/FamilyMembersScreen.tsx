import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useFamilyMembers, useDeleteFamilyMember } from '../../hooks/useFamily';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';
import { toast } from '../../components/common/Toast';

export const FamilyMembersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const insets = useSafeAreaInsets();
  const { data: members, isLoading, error } = useFamilyMembers();
  const deleteMember = useDeleteFamilyMember();

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Member', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteMember.mutateAsync(id);
          toast.success('Member deleted');
        } catch {
          toast.error('Failed to delete member');
        }
      }},
    ]);
  }, [deleteMember]);

  const getRelationshipColor = (rel: string) => {
    switch (rel) {
      case 'spouse': return colors.primary;
      case 'child': return colors.success;
      case 'parent': return colors.warning;
      case 'sibling': return colors.info;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: typography.fontSize.h2, fontWeight: '700', color: colors.text, fontFamily: typography.fontFamily.arabic.bold }}>
            Family Members
          </Text>
          <Button title="+ Add" onPress={() => navigation.navigate('AddFamilyMember')} size="sm" />
        </View>
      </View>

      {isLoading ? (
        <SkeletonList />
      ) : error ? (
        <EmptyState title="Error" description="Failed to load family members" actionTitle="Retry" onAction={() => {}} />
      ) : !members || members.length === 0 ? (
        <EmptyState title="No family members" description="Add your family members to manage their appointments" actionTitle="Add Member" onAction={() => navigation.navigate('AddFamilyMember')} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxxl }}>
          {members.map((member) => (
            <Card key={member.id} variant="elevated" style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: getRelationshipColor(member.relationship) + '20', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 24 }}>
                    {member.gender === 'male' ? '👨' : '👩'}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={{ fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text, fontFamily: typography.fontFamily.arabic.bold }}>
                    {member.nameAr || member.name}
                  </Text>
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.xxs, fontFamily: typography.fontFamily.arabic.regular }}>
                    {member.relationship} {member.isDependent ? '(Dependent)' : ''}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <TouchableOpacity onPress={() => navigation.navigate('AddFamilyMember', { member })}>
                    <Text style={{ color: colors.primary, fontSize: typography.fontSize.sm }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(member.id, member.nameAr || member.name)}>
                    <Text style={{ color: colors.error, fontSize: typography.fontSize.sm }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
};
