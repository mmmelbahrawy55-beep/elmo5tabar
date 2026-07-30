import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../state/auth.store';
import { authService, LoginRequest, RegisterRequest } from '../services/auth.service';
import { biometricService } from '../services/biometric.service';
import { useEffect } from 'react';

export const useAuth = () => {
  const store = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    store.hydrate();
  }, []);

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (result) => {
      store.setUser(result.user);
      store.setTokens(result.tokens);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (result) => {
      store.setUser(result.user);
      store.setTokens(result.tokens);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      store.logout();
      queryClient.clear();
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
    enabled: store.isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Parameters<typeof authService.updateProfile>[0]) =>
      authService.updateProfile(data),
    onSuccess: (user) => {
      store.updateProfile(user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const biometricLogin = async () => {
    const isAvailable = await biometricService.isAvailable();
    if (!isAvailable.available) {
      throw new Error('Biometric authentication not available');
    }
    const credentials = await biometricService.getCredentials();
    if (!credentials) {
      throw new Error('No stored credentials');
    }
    return loginMutation.mutateAsync({
      email: credentials.username,
      password: credentials.password,
    });
  };

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: loginMutation.mutateAsync,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    profile: profileQuery.data,
    isProfileLoading: profileQuery.isLoading,
    profileError: profileQuery.error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    biometricLogin,
    forgotPassword: authService.forgotPassword.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    enable2FA: authService.enable2FA.bind(authService),
    confirm2FA: authService.confirm2FA.bind(authService),
    disable2FA: authService.disable2FA.bind(authService),
    changePassword: authService.changePassword.bind(authService),
    verifyEmail: authService.verifyEmail.bind(authService),
  };
};

export const useSessions = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => authService.getSessions(),
  });
};

export const useDevices = () => {
  return useQuery({
    queryKey: ['devices'],
    queryFn: () => authService.getDevices(),
  });
};

export const useSecurityAlerts = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['securityAlerts', params],
    queryFn: () => authService.getSecurityAlerts(params),
  });
};
