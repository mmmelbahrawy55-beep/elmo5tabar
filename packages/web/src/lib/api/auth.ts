const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  phone: string;
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn?: string;
  lastNameEn?: string;
  role: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
}

class AuthClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;

    let response: Response;
    try {
      response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        throw new Error('الخادم غير متاح حالياً. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
      }
      throw new Error('حدث خطأ في الاتصال بالخادم.');
    }

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        return fetch(`${API_BASE}${endpoint}`, { ...options, headers }).then(r => r.json());
      }
      this.logout();
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async register(data: {
    email: string;
    phone: string;
    password: string;
    firstNameAr: string;
    lastNameAr: string;
    firstNameEn?: string;
    lastNameEn?: string;
  }) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(result.tokens);
    return result;
  }

  async login(email: string, password: string) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.requiresTwoFactor) return result;
    this.setTokens(result.tokens);
    return result;
  }

  async loginWithOTP(emailOrPhone: string) {
    return this.request('/auth/login/otp', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone }),
    });
  }

  async verifyOTP(code: string, emailOrPhone: string) {
    const result = await this.request('/auth/login/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ code, emailOrPhone }),
    });
    this.setTokens(result.tokens);
    return result;
  }

  async verify2FA(code: string) {
    const result = await this.request('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    this.setTokens(result.tokens);
    return result;
  }

  async enable2FA(method: string) {
    return this.request('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
  }

  async disable2FA(password: string) {
    return this.request('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async getBackupCodes() {
    return this.request('/auth/2fa/backup-codes');
  }

  getOAuthUrl(provider: string) {
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    return `${API_BASE}/auth/oauth/${provider}?state=${state}&redirectUri=${encodeURIComponent(
      window.location.origin + '/auth/callback/' + provider
    )}`;
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async verifyEmail(token: string) {
    return this.request('/auth/verify/email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getSessions() {
    return this.request('/auth/sessions');
  }

  async revokeSession(id: string) {
    return this.request(`/auth/sessions/${id}`, { method: 'DELETE' });
  }

  async getDevices() {
    return this.request('/auth/devices');
  }

  async removeDevice(id: string) {
    return this.request(`/auth/devices/${id}`, { method: 'DELETE' });
  }

  async trustDevice(id: string) {
    return this.request(`/auth/devices/${id}/trust`, {
      method: 'PATCH',
      body: JSON.stringify({ trusted: true }),
    });
  }

  async untrustDevice(id: string) {
    return this.request(`/auth/devices/${id}/trust`, {
      method: 'PATCH',
      body: JSON.stringify({ trusted: false }),
    });
  }

  async getDeviceHistory(deviceId: string) {
    return this.request(`/auth/devices/${deviceId}/history`);
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me');
  }

  async getSecurityAlerts(params?: { severity?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/auth/security/alerts${query ? '?' + query : ''}`);
  }

  async refresh(): Promise<boolean> {
    try {
      const result = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      }).then(r => r.json());
      this.setTokens(result.tokens);
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {}
    this.clearTokens();
  }

  private setTokens(tokens: AuthTokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.accessToken);
      localStorage.setItem('refresh_token', tokens.refreshToken);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  get isAuthenticated() {
    return !!this.accessToken;
  }
}

export const authClient = new AuthClient();
export type { User, AuthTokens };
