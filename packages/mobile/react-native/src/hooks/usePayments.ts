import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'partial' | 'cancelled' | 'refunded';
  dueDate: string;
  description: string;
  descriptionAr: string;
  items: Array<{
    id: string;
    name: string;
    nameAr: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: string;
  paidAt: string | null;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet' | 'apple_pay' | 'google_pay' | 'bank_transfer';
  label: string;
  isDefault: boolean;
  lastFour?: string;
  expiryDate?: string;
  cardBrand?: string;
}

export interface Wallet {
  balance: number;
  currency: string;
  points: number;
  transactions: Array<{
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    descriptionAr: string;
    createdAt: string;
  }>;
}

export const useInvoices = (params?: { status?: string; page?: number }) => {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const response = await api.get('/invoices', { params });
      return response.data.data as Invoice[];
    },
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await api.get(`/invoices/${id}`);
      return response.data.data as Invoice;
    },
    enabled: !!id,
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      invoiceId: string;
      paymentMethodId: string;
      amount: number;
      biometricConfirm?: boolean;
    }) => {
      const response = await api.post('/payments/process', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await api.get('/wallet');
      return response.data.data as Wallet;
    },
  });
};

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      const response = await api.get('/payment-methods');
      return response.data.data as PaymentMethod[];
    },
  });
};

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: string;
      token: string;
      setDefault?: boolean;
    }) => {
      const response = await api.post('/payment-methods', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/payment-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
  });
};

export const useTopUpWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { amount: number; paymentMethodId: string }) => {
      const response = await api.post('/wallet/topup', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};
