import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LabTest, TestCategory, SampleType } from '@/types/test';

// ============================================================
// TEST CATALOG FILTERS STORE
// ============================================================
export interface TestCatalogFilters {
  categories: TestCategory[];
  priceRange: [number, number];
  sampleTypes: SampleType[];
  fastingRequired: boolean | null;
  turnaroundTime: 'any' | 'fast' | 'normal' | 'slow';
  homeVisitAvailable: boolean | null;
  searchQuery: string;
  sortBy: 'name' | 'price' | 'popularity' | 'turnaround' | 'category';
  sortOrder: 'asc' | 'desc';
}

interface TestCatalogState {
  filters: TestCatalogFilters;
  viewMode: 'grid' | 'list';
  showCompareBar: boolean;
  setFilter: <K extends keyof TestCatalogFilters>(key: K, value: TestCatalogFilters[K]) => void;
  resetFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setShowCompareBar: (show: boolean) => void;
}

const defaultFilters: TestCatalogFilters = {
  categories: [],
  priceRange: [0, 5000],
  sampleTypes: [],
  fastingRequired: null,
  turnaroundTime: 'any',
  homeVisitAvailable: null,
  searchQuery: '',
  sortBy: 'popularity',
  sortOrder: 'desc',
};

export const useTestCatalogStore = create<TestCatalogState>((set) => ({
  filters: { ...defaultFilters },
  viewMode: 'grid',
  showCompareBar: false,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShowCompareBar: (show) => set({ showCompareBar: show }),
}));

// ============================================================
// FAVORITES STORE (localStorage-persisted)
// ============================================================
interface FavoritesState {
  favoriteIds: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      addFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(id) ? state.favoriteIds : [...state.favoriteIds, id],
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
    { name: 'al-mokhtabar-favorites' }
  )
);

// ============================================================
// RECENTLY VIEWED STORE (localStorage-persisted)
// ============================================================
interface RecentlyViewedState {
  recentIds: string[];
  addRecent: (id: string) => void;
  clearRecent: () => void;
  MAX_RECENT: number;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      recentIds: [],
      MAX_RECENT: 20,
      addRecent: (id) =>
        set((state) => {
          const filtered = state.recentIds.filter((rid) => rid !== id);
          return { recentIds: [id, ...filtered].slice(0, state.MAX_RECENT) };
        }),
      clearRecent: () => set({ recentIds: [] }),
    }),
    { name: 'al-mokhtabar-recently-viewed' }
  )
);

// ============================================================
// COMPARE STORE (localStorage-persisted)
// ============================================================
interface CompareState {
  compareIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
  MAX_COMPARE: number;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      compareIds: [],
      MAX_COMPARE: 4,
      addToCompare: (id) =>
        set((state) => {
          if (state.compareIds.length >= state.MAX_COMPARE) return state;
          if (state.compareIds.includes(id)) return state;
          return { compareIds: [...state.compareIds, id] };
        }),
      removeFromCompare: (id) =>
        set((state) => ({
          compareIds: state.compareIds.filter((cid) => cid !== id),
        })),
      toggleCompare: (id) => {
        const { compareIds, MAX_COMPARE } = get();
        if (compareIds.includes(id)) {
          set({ compareIds: compareIds.filter((cid) => cid !== id) });
        } else if (compareIds.length < MAX_COMPARE) {
          set({ compareIds: [...compareIds, id] });
        }
      },
      clearCompare: () => set({ compareIds: [] }),
      isInCompare: (id) => get().compareIds.includes(id),
    }),
    { name: 'al-mokhtabar-compare' }
  )
);
