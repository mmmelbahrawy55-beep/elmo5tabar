import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useInvoices, useWallet, usePaymentMethods } from '../../hooks/usePayments';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';

export const PaymentsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const insets = useSafeAreaInsets();
  const [filterStatus, setFilterStatus] = useState('all');
  const { data: invoices, isLoading: invLoading } = useInvoices({ status: filterStatus !== 'all' ? filterStatus : undefined });
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: paymentMethods } = usePaymentMethods();

  const QUICK_ACTIONS = [
    { id: 'topup', icon: '💰', label: 'Top Up Wallet', screen: 'WalletTopUp' },
    { id: 'pay', icon: '💳', label: 'Pay Invoice', screen: 'PayInvoice' },
    { id: 'gift', icon: '🎁', label: 'Gift Cards', screen: 'GiftCards' },
  ];

  const STATUS_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: typography.fontSize.h2, fontWeight: '700', color: colors.text, marginBottom: spacing.lg, fontFamily: typography.fontFamily.arabic.bold }}>
          Payments
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxxl }}>
        {wallet && (
          <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, fontFamily: typography.fontFamily.arabic.regular }}>
                Wallet Balance
              </Text>
              <Text style={{ fontSize: typography.fontSize.h1, fontWeight: '700', color: colors.primary, marginTop: spacing.sm }}>
                {wallet.balance.toLocaleString()} SAR
              </Text>
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
                {wallet.points} points
              </Text>
            </View>
          </Card>
        )}

        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity key={action.id} onPress={() => {}} style={{ flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.sm }}>
              <Text style={{ fontSize: 28 }}>{action.icon}</Text>
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.text, marginTop: spacing.xs, textAlign: 'center', fontFamily: typography.fontFamily.arabic.regular }}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {STATUS_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setFilterStatus(filter.key)}
                style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, backgroundColor: filterStatus === filter.key ? colors.primary : colors.borderLight }}
              >
                <Text style={{ fontSize: typography.fontSize.sm, color: filterStatus === filter.key ? colors.textInverse : colors.text, fontFamily: typography.fontFamily.arabic.regular }}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {invLoading ? (
          <SkeletonList />
        ) : !invoices || invoices.length === 0 ? (
          <EmptyState title="No invoices" description="You have no invoices in this category" />
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id} variant="elevated" style={{ marginBottom: spacing.md }} onPress={() => navigation.navigate('InvoiceDetail', { id: invoice.id })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                    #{invoice.invoiceNumber}
                  </Text>
                  <Text style={{ fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text, marginTop: spacing.xs, fontFamily: typography.fontFamily.arabic.bold }}>
                    {invoice.descriptionAr || invoice.description}
                  </Text>
                </View>
                <Badge variant="text" text={invoice.status} color={invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : invoice.status === 'overdue' ? 'error' : 'info'} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }}>
                <Text style={{ fontSize: typography.fontSize.h3, fontWeight: '700', color: colors.text }}>
                  {invoice.amount.toLocaleString()} SAR
                </Text>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </Text>
              </View>
            </Card>
          ))
        )}

        {paymentMethods && paymentMethods.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={{ fontSize: typography.fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md, fontFamily: typography.fontFamily.arabic.bold }}>
              Payment Methods
            </Text>
            {paymentMethods.map((pm) => (
              <Card key={pm.id} variant="flat" style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: typography.fontSize.md, color: colors.text }}>{pm.label}</Text>
                  {pm.isDefault && <Badge variant="text" text="Default" color="primary" />}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
