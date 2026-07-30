import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../components/common/Toast';
import { isValidEmail } from '../../utils/validation';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const { login, isLoggingIn, biometricLogin, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  const shakeAnim = useSharedValue(0);

  const animatedErrorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  const validate = useCallback((): boolean => {
    let valid = true;
    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Invalid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!valid) {
      shakeAnim.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }

    return valid;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;
    try {
      await login({ email: email.trim(), password });
      toast.success('Welcome back!');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    }
  }, [email, password, login, validate]);

  const handleBiometricLogin = useCallback(async () => {
    try {
      await biometricLogin();
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error?.message || 'Biometric login failed');
    }
  }, [biometricLogin]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.xxxxl,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: spacing.xxxxl }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: colors.primary + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <Text style={{ fontSize: 36 }}>🔬</Text>
          </View>
          <Text
            style={{
              fontSize: typography.fontSize.h1,
              fontWeight: '700',
              color: colors.text,
              fontFamily: typography.fontFamily.arabic.bold,
              textAlign: 'center',
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              fontSize: typography.fontSize.md,
              color: colors.textSecondary,
              marginTop: spacing.sm,
              fontFamily: typography.fontFamily.arabic.regular,
              textAlign: 'center',
            }}
          >
            Sign in to continue
          </Text>
        </View>

        <Animated.View style={animatedErrorStyle}>
          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Animated.View>

        <Input
          label="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError('');
          }}
          error={passwordError}
          isPassword
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={{ alignSelf: 'flex-end', marginBottom: spacing.xl }}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.arabic.regular,
            }}
          >
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={isLoggingIn}
          fullWidth
          size="lg"
        />

        {isBiometricAvailable && (
          <Button
            title="Use Face ID / Fingerprint"
            onPress={handleBiometricLogin}
            variant="ghost"
            fullWidth
            size="md"
            style={{ marginTop: spacing.md }}
          />
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: spacing.xxl,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text
            style={{
              marginHorizontal: spacing.lg,
              color: colors.textSecondary,
              fontSize: typography.fontSize.sm,
            }}
          >
            or continue with
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button
            title="Apple"
            onPress={() => {}}
            variant="outline"
            style={{ flex: 1 }}
            size="md"
          />
          <Button
            title="Google"
            onPress={() => {}}
            variant="outline"
            style={{ flex: 1 }}
            size="md"
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: spacing.xxl,
            gap: spacing.xs,
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSize.md,
              fontFamily: typography.fontFamily.arabic.regular,
            }}
          >
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.fontSize.md,
                fontWeight: '600',
                fontFamily: typography.fontFamily.arabic.bold,
              }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
