'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BranchFilter, UserLocation } from '@/types/branch';

// ============================================================
// BRANCH FAVORITES STORE (localStorage-persisted)
// ============================================================
interface BranchFavoritesState {
  favoriteIds: string[];
  favorites: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useBranchFavoritesStore = create<BranchFavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      favorites: [],
      addFavorite: (id) =>
        set((state) => {
          const favoriteIds = state.favoriteIds.includes(id)
            ? state.favoriteIds
            : [...state.favoriteIds, id];
          return { favoriteIds, favorites: favoriteIds };
        }),
      removeFavorite: (id) =>
        set((state) => {
          const favoriteIds = state.favoriteIds.filter((fid) => fid !== id);
          return { favoriteIds, favorites: favoriteIds };
        }),
      toggleFavorite: (id) => {
        const { favoriteIds } = get();
        const next = favoriteIds.includes(id)
          ? favoriteIds.filter((fid) => fid !== id)
          : [...favoriteIds, id];
        set({ favoriteIds: next, favorites: next });
      },
      isFavorite: (id) => get().favoriteIds.includes(id),
    }),
    { name: 'al-mokhtabar-branch-favorites' }
  )
);

// ============================================================
// LOCATION STORE (GPS)
// ============================================================
export type PermissionState = 'granted' | 'denied' | 'prompt';

interface LocationState {
  userLocation: UserLocation | null;
  locationError: string | null;
  isLocating: boolean;
  requestLocation: () => void;
  setUserLocation: (location: UserLocation) => void;
  clearLocation: () => void;
  // convenience aliases used by branch pages
  latitude: number | null;
  longitude: number | null;
  permissionState: PermissionState;
  isLoading: boolean;
  error: string | null;
  locate: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  userLocation: null,
  locationError: null,
  isLocating: false,
  requestLocation: () => {
    if (!navigator.geolocation) {
      set({ locationError: 'Geolocation is not supported by this browser.', permissionState: 'denied' });
      return;
    }

    set({ isLocating: true, locationError: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        set({
          userLocation,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          permissionState: 'granted',
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
        set({
          locationError: message,
          error: message,
          permissionState: error.code === error.PERMISSION_DENIED ? 'denied' : 'prompt',
          isLocating: false,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  },
  setUserLocation: (location) =>
    set({
      userLocation: location,
      latitude: location.lat,
      longitude: location.lng,
      permissionState: 'granted',
      locationError: null,
    }),
  clearLocation: () =>
    set({
      userLocation: null,
      latitude: null,
      longitude: null,
      locationError: null,
      isLocating: false,
    }),
  latitude: null,
  longitude: null,
  permissionState: 'prompt',
  isLoading: false,
  error: null,
  locate: () => get().requestLocation(),
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

type SortMode = 'distance' | 'rating' | 'name' | 'capacity' | 'nearest';

interface BranchFilterState {
  filters: BranchFilter;
  setFilter: <K extends keyof BranchFilter>(key: K, value: BranchFilter[K]) => void;
  resetFilters: () => void;
  viewMode: 'map' | 'list' | 'grid';
  setViewMode: (mode: 'map' | 'list' | 'grid') => void;
  selectedBranchId: string | null;
  setSelectedBranch: (id: string | null) => void;
  // convenience aliases used by branch pages
  selectedCity: string;
  selectedType: string;
  sortBy: SortMode;
  setCity: (city: string) => void;
  setType: (type: string) => void;
  setSortBy: (mode: SortMode) => void;
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
      selectedCity: '',
      selectedType: 'all',
      sortBy: 'nearest' as SortMode,
      setCity: (city) => set({ selectedCity: city }),
      setType: (type) => set({ selectedType: type }),
      setSortBy: (mode) => set({ sortBy: mode }),
    }),
    { name: 'al-mokhtabar-branch-filters' }
  )
);
