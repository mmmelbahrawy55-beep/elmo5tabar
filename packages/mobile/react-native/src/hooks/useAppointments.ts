import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface Appointment {
  id: string;
  patientName: string;
  patientNameAr: string;
  branchId: string;
  branchName: string;
  branchNameAr: string;
  tests: Array<{ id: string; name: string; nameAr: string; price: number }>;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  queueNumber: number | null;
  estimatedWaitMinutes: number | null;
  isHomeVisit: boolean;
  notes: string | null;
  insuranceVerified: boolean;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  capacity: number;
  remaining: number;
}

interface BookAppointmentData {
  branchId: string;
  testIds: string[];
  date: string;
  timeSlot: string;
  patientId?: string;
  isHomeVisit?: boolean;
  notes?: string;
  insuranceVerified?: boolean;
}

export const useAppointments = (params?: { status?: string; page?: number }) => {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      const response = await api.get('/appointments', { params });
      return response.data.data as Appointment[];
    },
  });
};

export const useAppointment = (id: string) => {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const response = await api.get(`/appointments/${id}`);
      return response.data.data as Appointment;
    },
    enabled: !!id,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BookAppointmentData) => {
      const response = await api.post('/appointments', data);
      return response.data.data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/appointments/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      date,
      timeSlot,
    }: {
      id: string;
      date: string;
      timeSlot: string;
    }) => {
      const response = await api.put(`/appointments/${id}/reschedule`, {
        date,
        timeSlot,
      });
      return response.data.data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useAvailableSlots = (params: {
  branchId: string;
  date: string;
  testIds?: string[];
}) => {
  return useQuery({
    queryKey: ['availableSlots', params],
    queryFn: async () => {
      const response = await api.get('/appointments/available-slots', {
        params,
      });
      return response.data.data as TimeSlot[];
    },
    enabled: !!params.branchId && !!params.date,
  });
};

export const useQueueStatus = (appointmentId: string) => {
  return useQuery({
    queryKey: ['queueStatus', appointmentId],
    queryFn: async () => {
      const response = await api.get(`/appointments/${appointmentId}/queue`);
      return response.data.data as {
        queueNumber: number;
        estimatedWaitMinutes: number;
        positionsAhead: number;
        status: string;
      };
    },
    enabled: !!appointmentId,
    refetchInterval: 30000,
  });
};

export const useCheckIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await api.post(`/appointments/${appointmentId}/check-in`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useTestCatalog = (params?: { category?: string; search?: string }) => {
  return useQuery({
    queryKey: ['testCatalog', params],
    queryFn: async () => {
      const response = await api.get('/tests', { params });
      return response.data.data;
    },
  });
};
