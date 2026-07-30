'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BranchFilter, UserLocation } from '@/types/branch';

// ============================================================
// BRANCH FAVORITES STORE (localStorage-persisted)
// ============================================================
interface BranchFavoritesState {
  favoriteIds: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useBranchFavoritesStore = create<BranchFavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      addFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(id)
            ? state.favoriteIds
            : [...state.favoriteIds, id],
        })),
      removeFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((fid) => fid !== id),
        })),
      toggleFavorite: (id) => {
        const { favoriteIds } = get();
        if (favoriteIds.includes(id)) {
          set({ favoriteIds: favoriteIds.filter((fid) => fid !== id) });
        } else {
          set({ favoriteIds: [...favoriteIds, id] });
        }
      },
      isFavorite: (id) => get().favoriteIds.includes(id),
    }),
    { name: 'al-mokhtabar-branch-favorites' }
  )
);

// ============================================================
// LOCATION STORE (GPS)
// ============================================================
interface LocationState {
  userLocation: UserLocation | null;
  locationError: string | null;
  isLocating: boolean;
  requestLocation: () => void;
  setUserLocation: (location: UserLocation) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  userLocation: null,
  locationError: null,
  isLocating: false,
  requestLocation: () => {
    if (!navigator.geolocation) {
      set({ locationError: 'Geolocation is not supported by this browser.' });
      return;
    }

    set({ isLocating: true, locationError: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        set({
          userLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          },
          isLocating: false,
          locationError: null,
        });
      },
      (error) => {
        let message: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
          default:
            message = 'An unknown error occurred while retrieving location.';
        }
        set({ locationError: message, isLocating: false });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  },
  setUserLocation: (location) => set({ userLocation: location, locationError: null }),
  clearLocation: () => set({ userLocation: null, locationError: null, isLocating: false }),
}));

// ============================================================
// BRANCH FILTER STORE (localStorage-persisted)
// ============================================================
const defaultBranchFilters: BranchFilter = {
  cities: [],
  regions: [],
  types: [],
  services: [],
  isOpen: null,
  hasParking: null,
  isAccessible: null,
  acceptWalkIn: null,
  radius: 50,
  sortBy: 'distance',
};

interface BranchFilterState {
  filters: BranchFilter;
  setFilter: <K extends keyof BranchFilter>(key: K, value: BranchFilter[K]) => void;
  resetFilters: () => void;
  viewMode: 'map' | 'list' | 'grid';
  setViewMode: (mode: 'map' | 'list' | 'grid') => void;
  selectedBranchId: string | null;
  setSelectedBranch: (id: string | null) => void;
}

export const useBranchFilterStore = create<BranchFilterState>()(
  persist(
    (set) => ({
      filters: { ...defaultBranchFilters },
      setFilter: (key, value) =>
        set((state) => ({ filters: { ...state.filters, [key]: value } })),
      resetFilters: () => set({ filters: { ...defaultBranchFilters } }),
      viewMode: 'list',
      setViewMode: (mode) => set({ viewMode: mode }),
      selectedBranchId: null,
      setSelectedBranch: (id) => set({ selectedBranchId: id }),
    }),
    { name: 'al-mokhtabar-branch-filters' }
  )
);
