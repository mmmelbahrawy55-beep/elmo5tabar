import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface MedicineReminder {
  id: string;
  medicineName: string;
  medicineNameAr: string;
  dosage: string;
  dosageAr: string;
  frequency: 'daily' | 'twice_daily' | 'custom';
  times: string[];
  notes: string | null;
  notesAr: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  refillReminder: boolean;
  refillThreshold: number | null;
  adherenceRate: number;
  createdAt: string;
}

export const useReminders = () => {
  return useQuery({
    queryKey: ['medicineReminders'],
    queryFn: async () => {
      const response = await api.get('/medicine-reminders');
      return response.data.data as MedicineReminder[];
    },
  });
};

export const useReminder = (id: string) => {
  return useQuery({
    queryKey: ['medicineReminder', id],
    queryFn: async () => {
      const response = await api.get(`/medicine-reminders/${id}`);
      return response.data.data as MedicineReminder;
    },
    enabled: !!id,
  });
};

export const useCreateReminder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<MedicineReminder, 'id' | 'adherenceRate' | 'createdAt'>) => {
      const response = await api.post('/medicine-reminders', data);
      return response.data.data as MedicineReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineReminders'] });
    },
  });
};

export const useUpdateReminder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<MedicineReminder>;
    }) => {
      const response = await api.put(`/medicine-reminders/${id}`, data);
      return response.data.data as MedicineReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineReminders'] });
    },
  });
};

export const useDeleteReminder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/medicine-reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineReminders'] });
    },
  });
};

export const useToggleReminder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/medicine-reminders/${id}/toggle`);
      return response.data.data as MedicineReminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineReminders'] });
    },
  });
};
