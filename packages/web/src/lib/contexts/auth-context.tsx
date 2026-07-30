'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authClient, User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  loginWithOTP: (emailOrPhone: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      if (authClient.isAuthenticated) {
        const u = await authClient.getMe();
        setUser(u);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const result = await authClient.login(email, password);
    if (!result.requiresTwoFactor) await refreshUser();
    return result;
  };

  const loginWithOTP = async (emailOrPhone: string) => {
    await authClient.loginWithOTP(emailOrPhone);
  };

  const register = async (data: any) => {
    const result = await authClient.register(data);
    await refreshUser();
    return result;
  };

  const logout = async () => {
    await authClient.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithOTP,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
