import { create } from 'zustand';
import { UserProfile, AuthTokens } from '../services/auth.service';
import { storage, StorageKeys } from '../services/storage.service';

interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    if (user) {
      storage.setObject(StorageKeys.USER_PROFILE, user);
    } else {
      storage.delete(StorageKeys.USER_PROFILE);
    }
    set({
      user,
      isAuthenticated: user !== null && get().tokens !== null,
    });
  },

  setTokens: (tokens) => {
    set({
      tokens,
      isAuthenticated: tokens !== null && get().user !== null,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    storage.delete(StorageKeys.USER_PROFILE);
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
    });
  },

  updateProfile: (data) => {
    const currentUser = get().user;
    if (currentUser) {
      const updated = { ...currentUser, ...data };
      storage.setObject(StorageKeys.USER_PROFILE, updated);
      set({ user: updated });
    }
  },

  hydrate: () => {
    try {
      const user = storage.getObject<UserProfile>(StorageKeys.USER_PROFILE);
      set({
        user: user ?? null,
        isAuthenticated: user !== null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
