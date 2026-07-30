import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { locationService } from '../services/location.service';

export interface Branch {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  city: string;
  cityAr: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  distance?: number;
  rating: number;
  ratingCount: number;
  isOpen: boolean;
  workingHours: Array<{
    day: string;
    dayAr: string;
    open: string;
    close: string;
  }>;
  services: Array<{
    id: string;
    name: string;
    nameAr: string;
    icon: string;
  }>;
  facilities: string[];
  images: string[];
  hasParking: boolean;
  hasWheelchairAccess: boolean;
  hasWomenSection: boolean;
}

export const useBranches = (params?: {
  city?: string;
  service?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['branches', params],
    queryFn: async () => {
      const response = await api.get('/branches', { params });
      const branches = response.data.data as Branch[];

      try {
        const hasPermission = await locationService.requestPermission();
        if (hasPermission) {
          const position = await locationService.getCurrentPosition();
          return branches.map((branch) => ({
            ...branch,
            distance: locationService.calculateDistance(
              position.latitude,
              position.longitude,
              branch.latitude,
              branch.longitude,
            ),
          }));
        }
      } catch {
      }

      return branches;
    },
  });
};

export const useBranch = (id: string) => {
  return useQuery({
    queryKey: ['branch', id],
    queryFn: async () => {
      const response = await api.get(`/branches/${id}`);
      return response.data.data as Branch;
    },
    enabled: !!id,
  });
};

export const useNearbyBranches = (params?: {
  latitude?: number;
  longitude?: number;
  radius?: number;
}) => {
  return useQuery({
    queryKey: ['nearbyBranches', params],
    queryFn: async () => {
      const response = await api.get('/branches/nearby', { params });
      return response.data.data as Branch[];
    },
  });
};
