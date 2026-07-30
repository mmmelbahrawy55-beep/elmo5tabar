import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface AppNotification {
  id: string;
  type:
    | 'appointment_reminder'
    | 'result_ready'
    | 'payment_received'
    | 'promotion'
    | 'system'
    | 'security'
    | 'queue_update';
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  data: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

export const useNotifications = (params?: {
  type?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const response = await api.get('/notifications', { params });
      return response.data.data as {
        items: AppNotification[];
        total: number;
        unreadCount: number;
      };
    },
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return response.data.data.count as number;
    },
    refetchInterval: 60000,
  });
};

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
