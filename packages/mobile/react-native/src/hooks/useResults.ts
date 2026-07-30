import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

export interface LabResult {
  id: string;
  patientId: string;
  patientName: string;
  patientNameAr: string;
  testId: string;
  testName: string;
  testNameAr: string;
  testCategory: string;
  testCategoryAr: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal_high' | 'abnormal_low' | 'pending' | 'cancelled';
  isAbnormal: boolean;
  notes: string | null;
  performedBy: string;
  reviewedBy: string | null;
  sampleType: string;
  sampleId: string;
  collectedAt: string;
  resultAt: string;
  createdAt: string;
}

export interface LabReport {
  id: string;
  reportNumber: string;
  patientId: string;
  patientName: string;
  patientNameAr: string;
  dateOfBirth: string;
  gender: string;
  results: LabResult[];
  status: 'completed' | 'pending' | 'partial' | 'cancelled';
  pdfUrl: string | null;
  qrCode: string;
  barcode: string;
  shareLink: string | null;
  createdAt: string;
  completedAt: string | null;
}

export const useResults = (params?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
}) => {
  return useQuery({
    queryKey: ['results', params],
    queryFn: async () => {
      const response = await api.get('/results', { params });
      return response.data.data as LabReport[];
    },
  });
};

export const useResult = (id: string) => {
  return useQuery({
    queryKey: ['result', id],
    queryFn: async () => {
      const response = await api.get(`/results/${id}`);
      return response.data.data as LabReport;
    },
    enabled: !!id,
  });
};

export const useResultPDF = (id: string) => {
  return useQuery({
    queryKey: ['resultPDF', id],
    queryFn: async () => {
      const response = await api.get(`/results/${id}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    },
    enabled: !!id,
  });
};

export const useResultQR = (id: string) => {
  return useQuery({
    queryKey: ['resultQR', id],
    queryFn: async () => {
      const response = await api.get(`/results/${id}/qr`);
      return response.data.data as { qrCode: string; shareLink: string };
    },
    enabled: !!id,
  });
};

export const useResultComparison = (params: {
  testId: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return useQuery({
    queryKey: ['resultComparison', params],
    queryFn: async () => {
      const response = await api.get('/results/comparison', { params });
      return response.data.data as Array<{
        date: string;
        value: number;
        unit: string;
        referenceRange: string;
        status: string;
      }>;
    },
    enabled: !!params.testId,
  });
};

export const useHealthTimeline = (params?: {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
}) => {
  return useQuery({
    queryKey: ['healthTimeline', params],
    queryFn: async () => {
      const response = await api.get('/results/timeline', { params });
      return response.data.data as Array<{
        id: string;
        type: 'test' | 'appointment' | 'medicine';
        title: string;
        titleAr: string;
        date: string;
        description: string;
        descriptionAr: string;
        icon: string;
        metadata: Record<string, unknown>;
      }>;
    },
  });
};

export const useShareResult = () => {
  return useMutation({
    mutationFn: async ({
      id,
      expiresIn,
    }: {
      id: string;
      expiresIn?: number;
    }) => {
      const response = await api.post(`/results/${id}/share`, {
        expiresIn: expiresIn ?? 24,
      });
      return response.data.data as { shareLink: string; expiresAt: string };
    },
  });
};

export const useExportResults = () => {
  return useMutation({
    mutationFn: async (params: {
      ids: string[];
      format: 'csv' | 'pdf';
    }) => {
      const response = await api.post('/results/export', params, {
        responseType: 'blob',
      });
      return response.data;
    },
  });
};
