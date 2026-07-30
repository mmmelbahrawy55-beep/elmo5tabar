import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useQueueStatus } from '../../hooks/useAppointments';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SkeletonCard } from '../../components/common/Skeleton';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface QueueStatusScreenProps {
  route: { params: { appointmentId: string } };
  navigation: any;
}

export const QueueStatusScreen: React.FC<QueueStatusScreenProps> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const insets = useSafeAreaInsets();
  const { appointmentId } = route.params;
  const { data: queue, isLoading, error } = useQueueStatus(appointmentId);
  const pulseAnim = useSharedValue(0);

  React.useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 0.5, 1], [1, 1.03, 1], Extrapolation.CLAMP);
    return { transform: [{ scale }] };
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: insets.top }}>
        <SkeletonCard />
      </View>
    );
  }

  if (error || !queue) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
        <Text style={{ color: colors.error }}>Failed to load queue status</Text>
        <Button title="Retry" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary, fontSize: typography.fontSize.md }}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxxl }}>
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.textSecondary,
            marginBottom: spacing.lg,
            fontFamily: typography.fontFamily.arabic.regular,
          }}
        >
          Your Queue Number
        </Text>

        <Animated.View
          style={[
            {
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: colors.primary + '10',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.lg,
              borderWidth: 3,
              borderColor: colors.primary,
            },
            pulseStyle,
          ]}
        >
          <Text
            style={{
              fontSize: typography.fontSize.giant,
              fontWeight: '700',
              color: colors.primary,
            }}
          >
            {queue.queueNumber}
          </Text>
        </Animated.View>

        <View style={{ flexDirection: 'row', gap: spacing.xl, marginBottom: spacing.xxl }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: typography.fontSize.h1, fontWeight: '700', color: colors.text }}>
              {queue.estimatedWaitMinutes}
            </Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              Min Wait
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: typography.fontSize.h1, fontWeight: '700', color: colors.text }}>
              {queue.positionsAhead}
            </Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              Ahead
            </Text>
          </View>
        </View>

        <Card variant="flat" style={{ width: '100%', marginBottom: spacing.xl }}>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' }}>
            Status: {queue.status.charAt(0).toUpperCase() + queue.status.slice(1)}
          </Text>
        </Card>

        <Button
          title="View on Map"
          onPress={() => navigation.navigate('BranchDetail', { id: 'current' })}
          variant="outline"
          fullWidth
        />
      </View>
    </View>
  );
};
