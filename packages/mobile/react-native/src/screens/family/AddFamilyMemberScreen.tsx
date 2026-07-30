import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useCreateFamilyMember, useUpdateFamilyMember } from '../../hooks/useFamily';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { toast } from '../../components/common/Toast';

const RELATIONSHIPS = ['spouse', 'child', 'parent', 'sibling', 'other'];
const GENDERS = ['male', 'female'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const AddFamilyMemberScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const editing = route.params?.member;
  const createMember = useCreateFamilyMember();
  const updateMember = useUpdateFamilyMember();

  const [nameAr, setNameAr] = useState(editing?.nameAr || '');
  const [nameEn, setNameEn] = useState(editing?.nameEn || '');
  const [relationship, setRelationship] = useState(editing?.relationship || 'spouse');
  const [dateOfBirth, setDateOfBirth] = useState(editing?.dateOfBirth || '');
  const [gender, setGender] = useState(editing?.gender || 'male');
  const [bloodType, setBloodType] = useState(editing?.bloodType || '');
  const [insuranceCompany, setInsuranceCompany] = useState(editing?.insuranceCompany || '');
  const [insuranceNumber, setInsuranceNumber] = useState(editing?.insuranceNumber || '');
  const [isDependent, setIsDependent] = useState(editing?.isDependent || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!nameAr.trim()) newErrors.nameAr = 'Name in Arabic is required';
    if (!nameEn.trim()) newErrors.nameEn = 'Name in English is required';
    if (!dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of birth is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [nameAr, nameEn, dateOfBirth]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    try {
      const data = { nameAr: nameAr.trim(), nameEn: nameEn.trim(), relationship, dateOfBirth, gender, bloodType: bloodType || null, insuranceCompany: insuranceCompany || null, insuranceNumber: insuranceNumber || null, isDependent };
      if (editing) {
        await updateMember.mutateAsync({ id: editing.id, data });
        toast.success('Member updated');
      } else {
        await createMember.mutateAsync(data as any);
        toast.success('Member added');
      }
      navigation.goBack();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    }
  }, [nameAr, nameEn, relationship, dateOfBirth, gender, bloodType, insuranceCompany, insuranceNumber, isDependent, editing, createMember, updateMember, navigation, validate]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.primary }}>← Back</Text></TouchableOpacity>
          <Text style={{ fontSize: typography.fontSize.h2, fontWeight: '700', color: colors.text, marginLeft: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
            {editing ? 'Edit Member' : 'Add Member'}
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxxl }}>
        <Input label="Name in Arabic" value={nameAr} onChangeText={(t) => { setNameAr(t); setErrors((e) => ({ ...e, nameAr: '' })); }} error={errors.nameAr} />
        <Input label="Name in English" value={nameEn} onChangeText={(t) => { setNameEn(t); setErrors((e) => ({ ...e, nameEn: '' })); }} error={errors.nameEn} />
        <Input label="Date of Birth" value={dateOfBirth} onChangeText={(t) => { setDateOfBirth(t); setErrors((e) => ({ ...e, dateOfBirth: '' })); }} placeholder="YYYY-MM-DD" error={errors.dateOfBirth} />

        <Text style={{ fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, fontFamily: typography.fontFamily.arabic.bold }}>
          Relationship
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
          {RELATIONSHIPS.map((rel) => (
            <TouchableOpacity key={rel} onPress={() => setRelationship(rel)} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, backgroundColor: relationship === rel ? colors.primary : colors.borderLight }}>
              <Text style={{ fontSize: typography.fontSize.sm, color: relationship === rel ? colors.textInverse : colors.text }}>{rel.charAt(0).toUpperCase() + rel.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, fontFamily: typography.fontFamily.arabic.bold }}>
          Gender
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          {GENDERS.map((g) => (
            <TouchableOpacity key={g} onPress={() => setGender(g)} style={{ paddingHorizontal: spacing.xxl, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, backgroundColor: gender === g ? colors.primary : colors.borderLight }}>
              <Text style={{ fontSize: typography.fontSize.sm, color: gender === g ? colors.textInverse : colors.text }}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: typography.fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, fontFamily: typography.fontFamily.arabic.bold }}>
          Blood Type
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
          {BLOOD_TYPES.map((bt) => (
            <TouchableOpacity key={bt} onPress={() => setBloodType(bt)} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, backgroundColor: bloodType === bt ? colors.primary : colors.borderLight }}>
              <Text style={{ fontSize: typography.fontSize.sm, color: bloodType === bt ? colors.textInverse : colors.text }}>{bt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Insurance Company" value={insuranceCompany} onChangeText={setInsuranceCompany} />
        <Input label="Insurance Number" value={insuranceNumber} onChangeText={setInsuranceNumber} />

        <TouchableOpacity onPress={() => setIsDependent(!isDependent)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl }}>
          <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: isDependent ? colors.primary : colors.border, backgroundColor: isDependent ? colors.primary : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
            {isDependent && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
          </View>
          <Text style={{ fontSize: typography.fontSize.md, color: colors.text, fontFamily: typography.fontFamily.arabic.regular }}>Dependent</Text>
        </TouchableOpacity>

        <Button title={editing ? 'Update Member' : 'Add Member'} onPress={handleSubmit} loading={createMember.isPending || updateMember.isPending} fullWidth size="lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
