import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../components/common/Toast';
import { isValidEmail, getPasswordStrength } from '../../utils/validation';
import { ProgressBar } from '../../components/common/ProgressBar';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendEmail = useCallback(async () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Invalid email');
      return;
    }
    setEmailError('');
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setStep('otp');
      toast.success('Verification code sent to your email');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  }, [email, forgotPassword]);

  const handleVerifyOtp = useCallback(() => {
    const otpStr = otp.join('');
    if (otpStr.length !== 6) {
      toast.error('Please enter the complete code');
      return;
    }
    setStep('reset');
  }, [otp]);

  const handleResetPassword = useCallback(async () => {
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');
    setIsLoading(true);
    try {
      await resetPassword(otp.join(''), newPassword);
      setStep('success');
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  }, [newPassword, confirmPassword, otp, resetPassword]);

  const pwStrength = getPasswordStrength(newPassword);

  const renderEmailStep = () => (
    <View>
      <Text
        style={{
          fontSize: typography.fontSize.h2,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          fontFamily: typography.fontFamily.arabic.bold,
        }}
      >
        Forgot Password?
      </Text>
      <Text
        style={{
          fontSize: typography.fontSize.md,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.sm,
          marginBottom: spacing.xxl,
          fontFamily: typography.fontFamily.arabic.regular,
        }}
      >
        Enter your email and we'll send you a reset code
      </Text>
      <Input
        label="Email"
        value={email}
        onChangeText={(t) => { setEmail(t); setEmailError(''); }}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button title="Send Reset Code" onPress={handleSendEmail} loading={isLoading} fullWidth size="lg" />
    </View>
  );

  const renderOtpStep = () => (
    <View>
      <Text
        style={{
          fontSize: typography.fontSize.h2,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          fontFamily: typography.fontFamily.arabic.bold,
        }}
      >
        Check Your Email
      </Text>
      <Text
        style={{
          fontSize: typography.fontSize.md,
          color: colors.textSecondary,
          textAlign: 'center',
          marginVertical: spacing.lg,
          fontFamily: typography.fontFamily.arabic.regular,
        }}
      >
        We sent a 6-digit code to {email}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xxl }}>
        {otp.map((digit, index) => (
          <View
            key={index}
            style={{
              width: 48,
              height: 56,
              borderRadius: borderRadius.md,
              borderWidth: 1.5,
              borderColor: colors.border,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ fontSize: typography.fontSize.h1, fontWeight: '600', color: colors.text }}>
              {digit}
            </Text>
          </View>
        ))}
      </View>
      <Button title="Verify Code" onPress={handleVerifyOtp} fullWidth size="lg" />
      <Button
        title="Resend Code"
        onPress={handleSendEmail}
        variant="ghost"
        fullWidth
        style={{ marginTop: spacing.md }}
      />
    </View>
  );

  const renderResetStep = () => (
    <View>
      <Text
        style={{
          fontSize: typography.fontSize.h2,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          fontFamily: typography.fontFamily.arabic.bold,
        }}
      >
        Reset Password
      </Text>
      <Text
        style={{
          fontSize: typography.fontSize.md,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.sm,
          marginBottom: spacing.xxl,
          fontFamily: typography.fontFamily.arabic.regular,
        }}
      >
        Enter your new password
      </Text>
      <Input
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        error={passwordError}
        isPassword
      />
      {newPassword.length > 0 && (
        <View style={{ marginTop: -spacing.sm, marginBottom: spacing.lg }}>
          <ProgressBar progress={pwStrength.score / 6} color={pwStrength.color} showLabel label={pwStrength.label} />
        </View>
      )}
      <Input
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword
      />
      <Button title="Reset Password" onPress={handleResetPassword} loading={isLoading} fullWidth size="lg" />
    </View>
  );

  const renderSuccessStep = () => (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxxxl }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.success + '20',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.xl,
        }}
      >
        <Text style={{ fontSize: 40 }}>✓</Text>
      </View>
      <Text
        style={{
          fontSize: typography.fontSize.h2,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          fontFamily: typography.fontFamily.arabic.bold,
        }}
      >
        Password Reset!
      </Text>
      <Text
        style={{
          fontSize: typography.fontSize.md,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.sm,
          marginBottom: spacing.xxl,
          fontFamily: typography.fontFamily.arabic.regular,
        }}
      >
        Your password has been reset successfully
      </Text>
      <Button
        title="Back to Login"
        onPress={() => navigation.navigate('Login')}
        fullWidth
        size="lg"
      />
    </View>
  );

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
        {step === 'email' && renderEmailStep()}
        {step === 'otp' && renderOtpStep()}
        {step === 'reset' && renderResetStep()}
        {step === 'success' && renderSuccessStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
