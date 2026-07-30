import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/common/Button';
import { biometricService, BiometryType } from '../../services/biometric.service';
import { useAuthStore } from '../../state/auth.store';
import { toast } from '../../components/common/Toast';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface BiometricSetupScreenProps {
  navigation: any;
}

export const BiometricSetupScreen: React.FC<BiometricSetupScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [biometryType, setBiometryType] = useState<BiometryType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    loadBiometricStatus();
  }, []);

  const loadBiometricStatus = async () => {
    const result = await biometricService.isAvailable();
    setBiometryType(result.biometryType);
  };

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pulseAnim.value,
      [0, 0.5, 1],
      [1, 1.05, 1],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  const handleSetup = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const auth = await biometricService.authenticate(
        biometryType === 'FaceID' ? 'Set up Face ID' : 'Set up fingerprint',
      );
      if (auth.success) {
        await biometricService.saveCredentials(user.email, '');
        setIsComplete(true);
        toast.success('Biometric setup complete');
        setTimeout(() => {
          navigation.navigate('MainTabs');
        }, 1500);
      }
    } catch {
      toast.error('Biometric setup failed');
    } finally {
      setIsLoading(false);
    }
  }, [user, biometryType, navigation]);

  const handleSkip = useCallback(() => {
    navigation.navigate('MainTabs');
  }, [navigation]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.xxxxl,
        }}
      >
        <Animated.View
          style={[
            {
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.primary + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.xxl,
            },
            pulseStyle,
          ]}
        >
          <Text style={{ fontSize: 56 }}>
            {biometryType === 'FaceID' ? '👤' : '👆'}
          </Text>
        </Animated.View>

        <Text
          style={{
            fontSize: typography.fontSize.h2,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            fontFamily: typography.fontFamily.arabic.bold,
          }}
        >
          {isComplete ? 'Biometrics Enabled!' : `Enable ${biometryType === 'FaceID' ? 'Face ID' : 'Fingerprint'} Login`}
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.md,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.sm,
            marginBottom: spacing.xxxl,
            lineHeight: typography.fontSize.md * 1.6,
            fontFamily: typography.fontFamily.arabic.regular,
          }}
        >
          {isComplete
            ? 'You can now log in quickly and securely using your biometrics'
            : 'Use your fingerprint or face to log in faster and more securely'}
        </Text>

        {!isComplete && (
          <Button
            title={`Enable ${biometryType === 'FaceID' ? 'Face ID' : 'Fingerprint'}`}
            onPress={handleSetup}
            loading={isLoading}
            fullWidth
            size="lg"
          />
        )}
        {!isComplete && (
          <Button
            title="Skip"
            onPress={handleSkip}
            variant="ghost"
            fullWidth
            size="md"
            style={{ marginTop: spacing.md }}
          />
        )}
      </View>
    </View>
  );
};
