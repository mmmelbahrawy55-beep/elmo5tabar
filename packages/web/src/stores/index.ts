import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
  profile?: {
    firstNameAr: string;
    lastNameAr: string;
    firstNameEn?: string;
    lastNameEn?: string;
    avatar?: string;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    { name: 'al-mokhtabar-auth' }
  )
);

interface CartState {
  items: Array<{ testId: string; nameAr: string; nameEn: string; price: number; code: string }>;
  addItem: (item: { testId: string; nameAr: string; nameEn: string; price: number; code: string }) => void;
  removeItem: (testId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          if (state.items.find((i) => i.testId === item.testId)) return state;
          return { items: [...state.items, item] };
        }),
      removeItem: (testId) =>
        set((state) => ({ items: state.items.filter((i) => i.testId !== testId) })),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, item) => sum + item.price, 0),
    }),
    { name: 'al-mokhtabar-cart' }
  )
);

interface NotificationState {
  count: number;
  setCount: (count: number) => void;
  decrement: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
  decrement: () => set((state) => ({ count: Math.max(0, state.count - 1) })),
}));

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  locale: 'ar' | 'en';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLocale: (locale: 'ar' | 'en') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      locale: 'ar',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'al-mokhtabar-ui' }
  )
);
