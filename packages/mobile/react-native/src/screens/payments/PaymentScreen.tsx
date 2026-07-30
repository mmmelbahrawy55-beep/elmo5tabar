import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useProcessPayment } from '../../hooks/usePayments';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { toast } from '../../components/common/Toast';

export const PaymentScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const { invoiceId, amount } = route.params || {};
  const processPayment = useProcessPayment();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);

  const PAYMENT_METHODS = [
    { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { id: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
    { id: 'google_pay', label: 'Google Pay', icon: '📱' },
    { id: 'wallet', label: 'Wallet', icon: '💰' },
    { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }
    setIsProcessing(true);
    try {
      await processPayment.mutateAsync({
        invoiceId: invoiceId || 'new',
        paymentMethodId: selectedMethod,
        amount: amount || 0,
      });
      setPaymentResult('success');
      toast.success('Payment successful!');
    } catch {
      setPaymentResult('failed');
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentResult === 'success') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxxl }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success + '20', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 40 }}>✓</Text>
        </View>
        <Text style={{ fontSize: typography.fontSize.h2, fontWeight: '700', color: colors.text, textAlign: 'center', fontFamily: typography.fontFamily.arabic.bold }}>
          Payment Successful
        </Text>
        <Text style={{ fontSize: typography.fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, fontFamily: typography.fontFamily.arabic.regular }}>
          Your payment has been processed
        </Text>
        <Button title="Done" onPress={() => navigation.goBack()} fullWidth style={{ marginTop: spacing.xxl }} />
      </View>
    );
  }

  if (paymentResult === 'failed') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxxl }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.error + '20', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 40 }}>✕</Text>
        </View>
        <Text style={{ fontSize: typography.fontSize.h2, fontWeight: '700', color: colors.text, textAlign: 'center', fontFamily: typography.fontFamily.arabic.bold }}>
          Payment Failed
        </Text>
        <Button title="Try Again" onPress={() => setPaymentResult(null)} fullWidth style={{ marginTop: spacing.xxl }} />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="ghost" fullWidth style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxxxl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: colors.primary }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize: typography.fontSize.h2, fontWeight: '700', color: colors.text, marginLeft: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
          Payment
        </Text>
      </View>

      <Card variant="flat" style={{ marginBottom: spacing.xxl, alignItems: 'center' }}>
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>Amount Due</Text>
        <Text style={{ fontSize: typography.fontSize.h1, fontWeight: '700', color: colors.primary, marginTop: spacing.sm }}>
          {(amount || 150).toLocaleString()} SAR
        </Text>
      </Card>

      <Text style={{ fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
        Payment Method
      </Text>
      {PAYMENT_METHODS.map((method) => (
        <TouchableOpacity
          key={method.id}
          onPress={() => setSelectedMethod(method.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.lg,
            marginBottom: spacing.sm,
            backgroundColor: selectedMethod === method.id ? colors.primary + '10' : colors.surface,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: selectedMethod === method.id ? colors.primary : colors.border,
          }}
        >
          <Text style={{ fontSize: 24, marginRight: spacing.md }}>{method.icon}</Text>
          <Text style={{ fontSize: typography.fontSize.md, color: colors.text, flex: 1, fontFamily: typography.fontFamily.arabic.regular }}>
            {method.label}
          </Text>
          {selectedMethod === method.id && <Text style={{ color: colors.primary }}>✓</Text>}
        </TouchableOpacity>
      ))}

      {selectedMethod === 'card' && (
        <View style={{ marginTop: spacing.lg }}>
          <Input label="Card Number" value={cardNumber} onChangeText={setCardNumber} keyboardType="number-pad" maxLength={19} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Input label="Expiry Date" value={cardExpiry} onChangeText={setCardExpiry} placeholder="MM/YY" maxLength={5} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="CVV" value={cardCvv} onChangeText={setCardCvv} keyboardType="number-pad" maxLength={4} />
            </View>
          </View>
          <Input label="Card Holder Name" value={cardHolder} onChangeText={setCardHolder} />
        </View>
      )}

      <Button title={`Pay ${(amount || 150).toLocaleString()} SAR`} onPress={handlePayment} loading={isProcessing} fullWidth size="lg" style={{ marginTop: spacing.xxl }} />
      <LoadingOverlay visible={isProcessing} message="Processing payment..." />
    </ScrollView>
  );
};
