import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface FamilyMember {
  id: string;
  name: string;
  nameAr: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  dateOfBirth: string;
  gender: 'male' | 'female';
  bloodType: string | null;
  insuranceCompany: string | null;
  insuranceNumber: string | null;
  isDependent: boolean;
  avatar: string | null;
  createdAt: string;
}

export const useFamilyMembers = () => {
  return useQuery({
    queryKey: ['familyMembers'],
    queryFn: async () => {
      const response = await api.get('/family');
      return response.data.data as FamilyMember[];
    },
  });
};

export const useCreateFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<FamilyMember, 'id' | 'createdAt'>) => {
      const response = await api.post('/family', data);
      return response.data.data as FamilyMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
    },
  });
};

export const useUpdateFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<FamilyMember>;
    }) => {
      const response = await api.put(`/family/${id}`, data);
      return response.data.data as FamilyMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
    },
  });
};

export const useDeleteFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/family/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
    },
  });
};
