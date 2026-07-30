import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useAppointments, Appointment } from '../../hooks/useAppointments';
import { AppointmentCard } from '../../components/appointments/AppointmentCard';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';

type TabType = 'upcoming' | 'past' | 'cancelled';

export const AppointmentListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const { data: appointments, isLoading, error } = useAppointments({
    status: activeTab === 'past' ? 'completed' : activeTab === 'cancelled' ? 'cancelled' : 'scheduled,confirmed,in_progress',
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filteredAppointments = appointments?.filter((a: Appointment) => {
    if (activeTab === 'upcoming') return ['scheduled', 'confirmed', 'in_progress'].includes(a.status);
    if (activeTab === 'past') return a.status === 'completed';
    if (activeTab === 'cancelled') return a.status === 'cancelled';
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: typography.fontSize.h2,
              fontWeight: '700',
              color: colors.text,
              fontFamily: typography.fontFamily.arabic.bold,
            }}
          >
            Appointments
          </Text>
          <Button
            title="+ Book"
            onPress={() => navigation.navigate('BookAppointment')}
            size="sm"
          />
        </View>

        <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.xs }}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab.key ? colors.primary : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: typography.fontSize.md,
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                  fontFamily: typography.fontFamily.arabic.regular,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <SkeletonList />
      ) : error ? (
        <EmptyState
          title="Error loading appointments"
          description="Something went wrong. Please try again."
          actionTitle="Retry"
          onAction={onRefresh}
        />
      ) : !filteredAppointments || filteredAppointments.length === 0 ? (
        <EmptyState
          title={activeTab === 'upcoming' ? 'No upcoming appointments' : 'No appointments found'}
          description={activeTab === 'upcoming' ? 'Book your first appointment' : 'No appointments in this category'}
          actionTitle={activeTab === 'upcoming' ? 'Book Appointment' : undefined}
          onAction={activeTab === 'upcoming' ? () => navigation.navigate('BookAppointment') : undefined}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: insets.bottom + spacing.xxxxl,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {filteredAppointments.map((appointment: Appointment) => (
            <AppointmentCard
              key={appointment.id}
              patientName={appointment.patientNameAr || appointment.patientName}
              branchName={appointment.branchNameAr || appointment.branchName}
              date={appointment.date}
              time={appointment.time}
              status={appointment.status}
              testNames={appointment.tests.map((t) => t.nameAr || t.name)}
              queueNumber={appointment.queueNumber}
              onPress={() => navigation.navigate('AppointmentDetail', { id: appointment.id })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};
