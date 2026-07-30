import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { TimeSlotPicker } from '../../components/appointments/TimeSlotPicker';
import { useCreateAppointment, useAvailableSlots, useTestCatalog } from '../../hooks/useAppointments';
import { useBranches } from '../../hooks/useBranches';
import { useFamilyMembers } from '../../hooks/useFamily';
import { toast } from '../../components/common/Toast';

const STEPS_COUNT = 7;

export const BookAppointmentScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isHomeVisit, setIsHomeVisit] = useState(false);
  const [insuranceVerified, setInsuranceVerified] = useState(false);

  const { data: branches } = useBranches();
  const { data: tests } = useTestCatalog();
  const { data: familyMembers } = useFamilyMembers();
  const { data: availableSlots } = useAvailableSlots({
    branchId: selectedBranch?.id,
    date: selectedDate || '',
  });
  const createAppointment = useCreateAppointment();

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS_COUNT - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleConfirm = useCallback(async () => {
    if (!selectedBranch || !selectedDate || !selectedTime || selectedTests.length === 0) {
      toast.error('Please complete all required fields');
      return;
    }
    try {
      await createAppointment.mutateAsync({
        branchId: selectedBranch.id,
        testIds: selectedTests,
        date: selectedDate,
        timeSlot: selectedTime,
        patientId: selectedPatient?.id,
        isHomeVisit,
        insuranceVerified,
      });
      toast.success('Appointment booked successfully!');
      navigation.navigate('Appointments');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to book appointment');
    }
  }, [selectedBranch, selectedDate, selectedTime, selectedTests, selectedPatient, isHomeVisit, insuranceVerified, createAppointment, navigation]);

  const renderStepIndicator = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
      {Array.from({ length: STEPS_COUNT }).map((_, i) => (
        <React.Fragment key={i}>
          <View
            style={{
              width: i <= step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i <= step ? colors.primary : colors.border,
            }}
          />
          {i < STEPS_COUNT - 1 && (
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: i < step ? colors.primary : colors.border,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text style={{ fontSize: typography.fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
              Select Branch
            </Text>
            {branches?.map((branch: any) => (
              <Card
                key={branch.id}
                variant={selectedBranch?.id === branch.id ? 'elevated' : 'outlined'}
                onPress={() => setSelectedBranch(branch)}
                style={{ marginBottom: spacing.sm }}
              >
                <Text style={{ fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text, fontFamily: typography.fontFamily.arabic.bold }}>
                  {branch.nameAr}
                </Text>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
                  {branch.address}
                </Text>
              </Card>
            ))}
          </View>
        );
      case 1:
        return (
          <View>
            <Text style={{ fontSize: typography.fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
              Select Tests
            </Text>
            {tests?.map((test: any) => (
              <TouchableOpacity
                key={test.id}
                onPress={() => {
                  setSelectedTests((prev) =>
                    prev.includes(test.id) ? prev.filter((t) => t !== test.id) : [...prev, test.id],
                  );
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  backgroundColor: selectedTests.includes(test.id) ? colors.primary + '10' : colors.surface,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: selectedTests.includes(test.id) ? colors.primary : colors.border,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: selectedTests.includes(test.id) ? colors.primary : colors.border,
                    backgroundColor: selectedTests.includes(test.id) ? colors.primary : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: spacing.md,
                  }}
                >
                  {selectedTests.includes(test.id) && (
                    <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fontSize.md, color: colors.text, fontFamily: typography.fontFamily.arabic.regular }}>
                    {test.nameAr}
                  </Text>
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                    {test.price} SAR
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={{ fontSize: typography.fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
              Select Date & Time
            </Text>
            <TimeSlotPicker
              slots={availableSlots || []}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelectDate={setSelectedDate}
              onSelectTime={setSelectedTime}
            />
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={{ fontSize: typography.fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
              Select Patient
            </Text>
            <Card
              variant={selectedPatient === null ? 'elevated' : 'outlined'}
              onPress={() => setSelectedPatient(null)}
              style={{ marginBottom: spacing.sm }}
            >
              <Text style={{ fontSize: typography.fontSize.lg, color: colors.text, fontFamily: typography.fontFamily.arabic.bold }}>
                Myself
              </Text>
            </Card>
            {familyMembers?.map((member: any) => (
              <Card
                key={member.id}
                variant={selectedPatient?.id === member.id ? 'elevated' : 'outlined'}
                onPress={() => setSelectedPatient(member)}
                style={{ marginBottom: spacing.sm }}
              >
                <Text style={{ fontSize: typography.fontSize.md, color: colors.text, fontFamily: typography.fontFamily.arabic.regular }}>
                  {member.nameAr}
                </Text>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                  {member.relationship}
                </Text>
              </Card>
            ))}
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={{ fontSize: typography.fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
              Confirm Booking
            </Text>
            <Card>
              <Text style={{ fontSize: typography.fontSize.md, color: colors.textSecondary }}>Branch</Text>
              <Text style={{ fontSize: typography.fontSize.lg, color: colors.text, marginBottom: spacing.md, fontFamily: typography.fontFamily.arabic.bold }}>
                {selectedBranch?.nameAr}
              </Text>
              <Text style={{ fontSize: typography.fontSize.md, color: colors.textSecondary }}>Date & Time</Text>
              <Text style={{ fontSize: typography.fontSize.lg, color: colors.text, marginBottom: spacing.md }}>
                {selectedDate} - {selectedTime}
              </Text>
              <Text style={{ fontSize: typography.fontSize.md, color: colors.textSecondary }}>Tests</Text>
              <Text style={{ fontSize: typography.fontSize.lg, color: colors.text }}>
                {selectedTests.length} tests selected
              </Text>
            </Card>
            <TouchableOpacity
              onPress={() => setIsHomeVisit(!isHomeVisit)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: spacing.lg,
                gap: spacing.md,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: isHomeVisit ? colors.primary : colors.border,
                  backgroundColor: isHomeVisit ? colors.primary : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {isHomeVisit && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: typography.fontSize.md, color: colors.text, fontFamily: typography.fontFamily.arabic.regular }}>
                Home Visit
              </Text>
            </TouchableOpacity>
          </View>
        );
      case 5:
        return (
          <View>
            <Text style={{ fontSize: typography.fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
              Insurance Verification
            </Text>
            <Card>
              <Text style={{ fontSize: typography.fontSize.md, color: colors.textSecondary, marginBottom: spacing.md }}>
                Your insurance information will be verified with the provider.
              </Text>
              <TouchableOpacity
                onPress={() => setInsuranceVerified(!insuranceVerified)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: insuranceVerified ? colors.primary : colors.border,
                    backgroundColor: insuranceVerified ? colors.primary : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {insuranceVerified && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                </View>
                <Text style={{ fontSize: typography.fontSize.md, color: colors.text }}>
                  I have insurance and want to use it
                </Text>
              </TouchableOpacity>
            </Card>
          </View>
        );
      case 6:
        return (
          <View>
            <Text style={{ fontSize: typography.fontSize.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
              Payment
            </Text>
            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontSize: typography.fontSize.h1, fontWeight: '700', color: colors.primary, textAlign: 'center' }}>
                {selectedTests.length * 50} SAR
              </Text>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }}>
                Total Amount
              </Text>
            </Card>
            <Button title="Complete Booking" onPress={handleConfirm} loading={createAppointment.isPending} fullWidth size="lg" />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button title="Back" onPress={handleBack} variant="ghost" size="sm" disabled={step === 0} />
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text }}>
            Step {step + 1} of {STEPS_COUNT}
          </Text>
          <Button title="Next" onPress={handleNext} variant="ghost" size="sm" disabled={step === STEPS_COUNT - 1} />
        </View>
        {renderStepIndicator()}
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxxl,
        }}
      >
        {renderStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
