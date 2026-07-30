import api from './api';
import { secureStorageService } from './secure-storage.service';
import { storage, StorageKeys } from './storage.service';
import { Platform } from 'react-native';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nameAr: string;
  nameEn: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  email: string;
  phone: string;
  avatar: string | null;
  dateOfBirth: string | null;
  gender: 'male' | 'female' | null;
  bloodType: string | null;
  insuranceCompany: string | null;
  insuranceNumber: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  is2FAEnabled: boolean;
  createdAt: string;
}

export interface SecurityAlert {
  id: string;
  type: 'login' | 'password_change' | 'device_added' | '2fa_change' | 'profile_update';
  description: string;
  ipAddress: string;
  device: string;
  location: string;
  timestamp: string;
  isRead: boolean;
}

export interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  os: string;
  isTrusted: boolean;
  lastUsed: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

class AuthService {
  async login(data: LoginRequest): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const response = await api.post('/auth/login', {
      ...data,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
      },
    });
    const { user, tokens } = response.data.data;
    await secureStorageService.setTokens(tokens.accessToken, tokens.refreshToken);
    storage.setObject(StorageKeys.USER_PROFILE, user);
    return { user, tokens };
  }

  async register(data: RegisterRequest): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const response = await api.post('/auth/register', data);
    const { user, tokens } = response.data.data;
    await secureStorageService.setTokens(tokens.accessToken, tokens.refreshToken);
    storage.setObject(StorageKeys.USER_PROFILE, user);
    return { user, tokens };
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
    } finally {
      await secureStorageService.clearTokens();
      storage.delete(StorageKeys.USER_PROFILE);
      storage.delete(StorageKeys.BIOMETRIC_ENABLED);
      storage.delete(StorageKeys.BIOMETRIC_USERNAME);
    }
  }

  async refreshToken(): Promise<AuthTokens> {
    const tokens = await secureStorageService.getTokens();
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post('/auth/refresh', {
      refreshToken: tokens.refreshToken,
    });
    const newTokens = response.data.data;
    await secureStorageService.setTokens(newTokens.accessToken, newTokens.refreshToken);
    return newTokens;
  }

  async getProfile(): Promise<UserProfile> {
    const response = await api.get('/auth/profile');
    const user = response.data.data;
    storage.setObject(StorageKeys.USER_PROFILE, user);
    return user;
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.put('/auth/profile', data);
    const user = response.data.data;
    storage.setObject(StorageKeys.USER_PROFILE, user);
    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/password', { currentPassword, newPassword });
  }

  async verifyEmail(code: string): Promise<void> {
    await api.post('/auth/verify-email', { code });
  }

  async resendVerificationEmail(): Promise<void> {
    await api.post('/auth/resend-verification');
  }

  async enable2FA(): Promise<{ qrCode: string; secret: string }> {
    const response = await api.post('/auth/2fa/enable');
    return response.data.data;
  }

  async confirm2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/confirm', { code });
  }

  async disable2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/disable', { code });
  }

  async getSessions(): Promise<Session[]> {
    const response = await api.get('/auth/sessions');
    return response.data.data;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}`);
  }

  async getDevices(): Promise<Device[]> {
    const response = await api.get('/auth/devices');
    return response.data.data;
  }

  async trustDevice(deviceId: string): Promise<void> {
    await api.post(`/auth/devices/${deviceId}/trust`);
  }

  async removeDevice(deviceId: string): Promise<void> {
    await api.delete(`/auth/devices/${deviceId}`);
  }

  async getSecurityAlerts(params?: PaginationParams): Promise<SecurityAlert[]> {
    const response = await api.get('/auth/security-alerts', { params });
    return response.data.data;
  }

  async markAlertRead(alertId: string): Promise<void> {
    await api.put(`/auth/security-alerts/${alertId}/read`);
  }
}

export const authService = new AuthService();
