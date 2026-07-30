import { create } from 'zustand';
import { storage, StorageKeys } from '../services/storage.service';

interface AppState {
  isOnline: boolean;
  lastSync: string | null;
  pendingActions: number;
  onboardingComplete: boolean;
  isAppReady: boolean;
  setOnline: (online: boolean) => void;
  setLastSync: (timestamp: string) => void;
  addPendingAction: () => void;
  removePendingAction: () => void;
  setOnboardingComplete: (complete: boolean) => void;
  setAppReady: (ready: boolean) => void;
  resetPendingActions: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isOnline: true,
  lastSync: null,
  pendingActions: 0,
  onboardingComplete: storage.getBoolean(StorageKeys.ONBOARDING_COMPLETE) ?? false,
  isAppReady: false,

  setOnline: (isOnline) => set({ isOnline }),

  setLastSync: (timestamp) => {
    storage.setString(StorageKeys.LAST_SYNC, timestamp);
    set({ lastSync: timestamp });
  },

  addPendingAction: () => {
    const count = get().pendingActions + 1;
    set({ pendingActions: count });
  },

  removePendingAction: () => {
    const count = Math.max(0, get().pendingActions - 1);
    set({ pendingActions: count });
  },

  setOnboardingComplete: (complete) => {
    storage.setBoolean(StorageKeys.ONBOARDING_COMPLETE, complete);
    set({ onboardingComplete: complete });
  },

  setAppReady: (isAppReady) => set({ isAppReady }),

  resetPendingActions: () => set({ pendingActions: 0 }),
}));
