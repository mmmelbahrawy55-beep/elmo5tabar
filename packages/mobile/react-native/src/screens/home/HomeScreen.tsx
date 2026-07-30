import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../state/auth.store';
import { useAppointments } from '../../hooks/useAppointments';
import { useResults } from '../../hooks/useResults';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { SkeletonCard } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

const QUICK_ACTIONS = [
  { id: 'book', icon: '📅', labelAr: 'احجز موعد', labelEn: 'Book Appointment', screen: 'BookAppointment' },
  { id: 'results', icon: '📊', labelAr: 'النتائج', labelEn: 'View Results', screen: 'ResultsList' },
  { id: 'branches', icon: '📍', labelAr: 'الفروع', labelEn: 'Find Branch', screen: 'BranchList' },
  { id: 'ai', icon: '🤖', labelAr: 'المساعد الذكي', labelEn: 'AI Assistant', screen: 'AIAssistant' },
  { id: 'payments', icon: '💳', labelAr: 'المدفوعات', labelEn: 'Payments', screen: 'Payments' },
  { id: 'family', icon: '👨‍👩‍👧‍👦', labelAr: 'العائلة', labelEn: 'Family', screen: 'Family' },
];

const HEALTH_TIPS = [
  { ar: 'اشرب 8 أكواب من الماء يومياً', en: 'Drink 8 glasses of water daily' },
  { ar: 'مارس الرياضة 30 دقيقة يومياً', en: 'Exercise 30 minutes daily' },
  { ar: 'نم 7-8 ساعات يومياً', en: 'Sleep 7-8 hours daily' },
  { ar: 'تناول وجبة إفطار متوازنة', en: 'Eat a balanced breakfast' },
];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { data: appointments, isLoading: apptsLoading } = useAppointments({ status: 'scheduled' });
  const { data: results, isLoading: resultsLoading } = useResults({ status: 'completed' });
  const [refreshing, setRefreshing] = React.useState(false);

  const isRTL = false;
  const greeting = 'Good Morning';
  const healthTip = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];

  const upcomingAppt = appointments?.[0];
  const recentResult = results?.[0];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxxl,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text
            style={{
              fontSize: typography.fontSize.h2,
              fontWeight: '700',
              color: colors.text,
              fontFamily: typography.fontFamily.arabic.bold,
            }}
          >
            {greeting}, {user?.nameAr || 'User'}
          </Text>
          <Text
            style={{
              fontSize: typography.fontSize.md,
              color: colors.textSecondary,
              marginTop: spacing.xs,
              fontFamily: typography.fontFamily.arabic.regular,
            }}
          >
            Welcome to Al Mokhtabar
          </Text>
        </View>

        {upcomingAppt && (
          <Card
            style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}
            variant="elevated"
            onPress={() => navigation.navigate('AppointmentDetail', { id: upcomingAppt.id })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.arabic.regular,
                }}
              >
                Upcoming Appointment
              </Text>
              <Badge variant="dot" color="primary" />
            </View>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: '600',
                color: colors.text,
                marginTop: spacing.sm,
                fontFamily: typography.fontFamily.arabic.bold,
              }}
            >
              {upcomingAppt.branchName}
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.md,
                color: colors.textSecondary,
                marginTop: spacing.xs,
                fontFamily: typography.fontFamily.arabic.regular,
              }}
            >
              {new Date(upcomingAppt.date).toLocaleDateString('ar-SA')} - {upcomingAppt.time}
            </Text>
          </Card>
        )}

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xxl }}>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: '600',
              color: colors.text,
              marginBottom: spacing.lg,
              fontFamily: typography.fontFamily.arabic.bold,
            }}
          >
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => navigation.navigate(action.screen)}
                style={{
                  width: '30%',
                  flexGrow: 1,
                  backgroundColor: colors.surface,
                  borderRadius: borderRadius.lg,
                  padding: spacing.lg,
                  alignItems: 'center',
                  minWidth: 100,
                  ...shadows.sm,
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: spacing.sm }}>{action.icon}</Text>
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text,
                    textAlign: 'center',
                    fontFamily: typography.fontFamily.arabic.regular,
                  }}
                >
                  {action.labelAr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {recentResult && (
          <Card
            style={{ marginHorizontal: spacing.lg, marginTop: spacing.xl }}
            variant="outlined"
            onPress={() => navigation.navigate('ResultDetail', { id: recentResult.id })}
          >
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              Recent Results
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: '600',
                color: colors.text,
                marginTop: spacing.xs,
                fontFamily: typography.fontFamily.arabic.bold,
              }}
            >
              {recentResult.reportNumber}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
              <Badge
                variant="text"
                text={recentResult.status === 'completed' ? 'Completed' : 'Pending'}
                color={recentResult.status === 'completed' ? 'success' : 'warning'}
              />
            </View>
          </Card>
        )}

        <Card
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.xl }}
          variant="flat"
        >
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Text style={{ fontSize: 28 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: '600',
                  color: colors.text,
                  fontFamily: typography.fontFamily.arabic.bold,
                }}
              >
                Health Tip
              </Text>
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                  fontFamily: typography.fontFamily.arabic.regular,
                }}
              >
                {healthTip.ar}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};
