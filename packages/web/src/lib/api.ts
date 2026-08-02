import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/ar/login';
        return Promise.reject(refreshError);
      }
    }

    const message =
      (error.response?.data as any)?.error?.message ||
      error.message ||
      'An error occurred';

    return Promise.reject(new Error(message));
  }
);

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any[];
}

export default api;

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse>('/auth/login', data),
  register: (data: any) => api.post<ApiResponse>('/auth/register', data),
  refresh: (token: string) =>
    api.post<ApiResponse>('/auth/refresh', { refreshToken: token }),
  logout: (token: string) => api.post('/auth/logout', { refreshToken: token }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

export const patientApi = {
  list: (params?: any) => api.get<ApiResponse>('/patients', { params }),
  get: (id: string) => api.get<ApiResponse>(`/patients/${id}`),
  create: (data: any) => api.post<ApiResponse>('/patients', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/patients/${id}`, data),
  getMedicalSummary: (id: string) =>
    api.get<ApiResponse>(`/patients/${id}/medical-summary`),
};

export const testApi = {
  list: (params?: any) => api.get<ApiResponse>('/tests', { params }),
  get: (id: string) => api.get<ApiResponse>(`/tests/${id}`),
  getCategories: () => api.get<ApiResponse>('/tests/categories'),
  getPopular: () => api.get<ApiResponse>('/tests/popular'),
  getFeatured: () => api.get<ApiResponse>('/tests/featured'),
};

export const orderApi = {
  list: (params?: any) => api.get<ApiResponse>('/orders', { params }),
  get: (id: string) => api.get<ApiResponse>(`/orders/${id}`),
  create: (data: any) => api.post<ApiResponse>('/orders', data),
  updateStatus: (id: string, data: any) =>
    api.patch<ApiResponse>(`/orders/${id}/status`, data),
  getByPatient: (patientId: string, params?: any) =>
    api.get<ApiResponse>(`/orders/patient/${patientId}`, { params }),
};

export const reportApi = {
  list: (params?: any) => api.get<ApiResponse>('/reports', { params }),
  get: (id: string) => api.get<ApiResponse>(`/reports/${id}`),
  update: (id: string, data: any) => api.patch<ApiResponse>(`/reports/${id}`, data),
  getPatientHistory: (patientId: string, params?: any) =>
    api.get<ApiResponse>(`/reports/patient/${patientId}/history`, { params }),
};

export const appointmentApi = {
  list: (params?: any) => api.get<ApiResponse>('/appointments', { params }),
  create: (data: any) => api.post<ApiResponse>('/appointments', data),
  updateStatus: (id: string, data: any) =>
    api.patch<ApiResponse>(`/appointments/${id}/status`, data),
  getAvailableSlots: (branchId: string, date: string) =>
    api.get<ApiResponse>('/appointments/available-slots', {
      params: { branchId, date },
    }),
};

export const billingApi = {
  getInvoices: (params?: any) => api.get<ApiResponse>('/billing/invoices', { params }),
  getInvoice: (id: string) => api.get<ApiResponse>(`/billing/invoices/${id}`),
  createInvoice: (orderId: string) =>
    api.post<ApiResponse>('/billing/invoices', { orderId }),
  createPayment: (data: any) => api.post<ApiResponse>('/billing/payments', data),
};

export const branchApi = {
  list: () => api.get<ApiResponse>('/branches'),
  get: (id: string) => api.get<ApiResponse>(`/branches/${id}`),
  getStats: (id: string) => api.get<ApiResponse>(`/branches/${id}/stats`),
};

export const analyticsApi = {
  getDashboard: () => api.get<ApiResponse>('/analytics/dashboard'),
  getRevenue: (params?: any) => api.get<ApiResponse>('/analytics/revenue', { params }),
  getOrderStats: () => api.get<ApiResponse>('/analytics/order-stats'),
  getTopTests: () => api.get<ApiResponse>('/analytics/top-tests'),
};

export const notificationApi = {
  list: (params?: any) => api.get<ApiResponse>('/notifications', { params }),
  markRead: (id: string) => api.patch<ApiResponse>(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const searchApi = {
  search: (q: string, type?: string, limit?: number) =>
    api.get<ApiResponse>('/search', { params: { q, type, limit } }),
};
