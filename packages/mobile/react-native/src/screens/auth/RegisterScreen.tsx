import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../components/common/Toast';
import {
  isValidEmail,
  isValidSaudiPhone,
  isValidPassword,
  getPasswordStrength,
} from '../../utils/validation';
import { ProgressBar } from '../../components/common/ProgressBar';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface RegisterScreenProps {
  navigation: any;
}

const STEPS = ['Personal Info', 'Password', 'Verification'] as const;

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const { register, isRegistering } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slideAnim = useSharedValue(0);

  const goToStep = useCallback((step: number) => {
    slideAnim.value = withTiming(1, { duration: 300, easing: Easing.ease });
    setTimeout(() => {
      setCurrentStep(step);
      slideAnim.value = 0;
    }, 150);
  }, []);

  const slideStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slideAnim.value, [0, 0.5, 1], [1, 0.5, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(
          slideAnim.value,
          [0, 1],
          [0, 20],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const validateStep1 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nameAr.trim()) newErrors.nameAr = 'Name in Arabic is required';
    if (!nameEn.trim()) newErrors.nameEn = 'Name in English is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!isValidEmail(email)) newErrors.email = 'Invalid email';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    else if (!isValidSaudiPhone(phone)) newErrors.phone = 'Invalid Saudi phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [nameAr, nameEn, email, phone]);

  const validateStep2 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!password) newErrors.password = 'Password is required';
    else if (!isValidPassword(password)) newErrors.password = 'Min 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [password, confirmPassword]);

  const handleNext = useCallback(() => {
    if (currentStep === 0 && validateStep1()) goToStep(1);
    else if (currentStep === 1 && validateStep2()) goToStep(2);
  }, [currentStep, validateStep1, validateStep2, goToStep]);

  const handleRegister = useCallback(async () => {
    try {
      await register({
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
      });
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Registration failed');
    }
  }, [nameAr, nameEn, email, phone, password, confirmPassword, register]);

  const pwStrength = getPasswordStrength(password);
  const progress = (currentStep + 1) / STEPS.length;

  const renderStepIndicator = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl }}>
      {STEPS.map((step, index) => (
        <React.Fragment key={index}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: index <= currentStep ? colors.primary : colors.border,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: index <= currentStep ? colors.textInverse : colors.textSecondary,
                fontSize: typography.fontSize.sm,
                fontWeight: '600',
              }}
            >
              {index + 1}
            </Text>
          </View>
          {index < STEPS.length - 1 && (
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: index < currentStep ? colors.primary : colors.border,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <Animated.View style={slideStyle}>
      <Input
        label="Name in Arabic"
        value={nameAr}
        onChangeText={(t) => { setNameAr(t); setErrors((e) => ({ ...e, nameAr: '' })); }}
        error={errors.nameAr}
      />
      <Input
        label="Name in English"
        value={nameEn}
        onChangeText={(t) => { setNameEn(t); setErrors((e) => ({ ...e, nameEn: '' })); }}
        error={errors.nameEn}
      />
      <Input
        label="Email"
        value={email}
        onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Phone Number"
        value={phone}
        onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: '' })); }}
        error={errors.phone}
        keyboardType="phone-pad"
      />
      <Button title="Next" onPress={handleNext} fullWidth size="lg" />
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View style={slideStyle}>
      <Input
        label="Password"
        value={password}
        onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
        error={errors.password}
        isPassword
      />
      {password.length > 0 && (
        <View style={{ marginTop: -spacing.sm, marginBottom: spacing.lg }}>
          <ProgressBar
            progress={pwStrength.score / 6}
            color={pwStrength.color}
            showLabel
            label={pwStrength.label}
          />
        </View>
      )}
      <Input
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
        error={errors.confirmPassword}
        isPassword
      />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Button title="Back" onPress={() => goToStep(0)} variant="outline" style={{ flex: 1 }} />
        <Button title="Next" onPress={handleNext} style={{ flex: 1 }} />
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View style={slideStyle}>
      <Text
        style={{
          fontSize: typography.fontSize.lg,
          color: colors.text,
          textAlign: 'center',
          marginBottom: spacing.lg,
          fontFamily: typography.fontFamily.arabic.regular,
        }}
      >
        Enter the verification code sent to {email}
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
              borderColor: errors.otp ? colors.error : colors.border,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.surface,
            }}
          >
            <Text
              style={{
                fontSize: typography.fontSize.h1,
                fontWeight: '600',
                color: colors.text,
              }}
            >
              {digit}
            </Text>
          </View>
        ))}
      </View>
      {errors.otp && (
        <Text style={{ color: colors.error, textAlign: 'center', marginBottom: spacing.md }}>
          {errors.otp}
        </Text>
      )}
      <Button
        title="Create Account"
        onPress={handleRegister}
        loading={isRegistering}
        fullWidth
        size="lg"
      />
      <Button
        title="Back"
        onPress={() => goToStep(1)}
        variant="ghost"
        fullWidth
        style={{ marginTop: spacing.md }}
      />
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.xxl,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
          <Text
            style={{
              fontSize: typography.fontSize.h2,
              fontWeight: '700',
              color: colors.text,
              fontFamily: typography.fontFamily.arabic.bold,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              fontSize: typography.fontSize.md,
              color: colors.textSecondary,
              marginTop: spacing.xs,
              fontFamily: typography.fontFamily.arabic.regular,
            }}
          >
            Join us to access our services
          </Text>
        </View>

        {renderStepIndicator()}

        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl }}>
          <Text style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
            Already have an account?{' '}
          </Text>
          <Button
            title="Sign In"
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="sm"
            style={{ padding: 0 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
