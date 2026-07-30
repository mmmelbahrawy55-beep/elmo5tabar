const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class NotificationClient {
  private accessToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
    }
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}/notifications${endpoint}`, { ...options, headers });

    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }).then(r => r.json());
        if (refreshed.tokens?.accessToken) {
          localStorage.setItem('access_token', refreshed.tokens.accessToken);
          this.accessToken = refreshed.tokens.accessToken;
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          return fetch(`${API_BASE}/notifications${endpoint}`, { ...options, headers }).then(r => r.json());
        }
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/ar/login';
      }
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  private qs(params?: Record<string, any>): string {
    if (!params) return '';
    const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (filtered.length === 0) return '';
    return '?' + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString();
  }

  // ─── User Notifications ──────────────────────────────────────

  async list(params?: { page?: number; limit?: number; type?: string; read?: string }) {
    return this.request(`/${this.qs(params)}`);
  }

  async getUnreadCount() {
    return this.request('/unread-count');
  }

  async getStats() {
    return this.request('/stats');
  }

  async getHistory(params?: { page?: number; limit?: number; type?: string; dateFrom?: string; dateTo?: string }) {
    return this.request(`/history${this.qs(params)}`);
  }

  async markRead(id: string) {
    return this.request(`/${id}/read`, { method: 'PATCH' });
  }

  async markAllRead() {
    return this.request('/read-all', { method: 'PATCH' });
  }

  async delete(id: string) {
    return this.request(`/${id}`, { method: 'DELETE' });
  }

  async resend(id: string) {
    return this.request(`/${id}/resend`, { method: 'POST' });
  }

  async getById(id: string) {
    return this.request(`/${id}`);
  }

  // ─── Preferences ─────────────────────────────────────────────

  async getPreferences() {
    return this.request('/preferences');
  }

  async updatePreferences(preferences: { channel: string; type: string; enabled: boolean }[]) {
    return this.request('/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async updatePreference(channel: string, type: string, enabled: boolean) {
    return this.request(`/preferences/${channel}/${type}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  async setQuietHours(channel: string, start: string, end: string) {
    return this.request('/preferences/quiet-hours', {
      method: 'PUT',
      body: JSON.stringify({ channel, start, end }),
    });
  }

  async setMaxPerDay(channel: string, max: number) {
    return this.request('/preferences/max-per-day', {
      method: 'PUT',
      body: JSON.stringify({ channel, max }),
    });
  }

  async getSubscribedTypes() {
    return this.request('/preferences/subscribed-types');
  }

  // ─── Templates ───────────────────────────────────────────────

  async listTemplates(params?: { type?: string; channel?: string; lang?: string; page?: number; limit?: number }) {
    return this.request(`/templates${this.qs(params)}`);
  }

  async getTemplate(id: string) {
    return this.request(`/templates/${id}`);
  }

  async createTemplate(data: any) {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: string, data: any) {
    return this.request(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async activateTemplate(id: string) {
    return this.request(`/templates/${id}/activate`, { method: 'POST' });
  }

  async renderPreview(type: string, channel: string, lang: string, variables: Record<string, any>) {
    return this.request('/templates/render', {
      method: 'POST',
      body: JSON.stringify({ type, channel, lang, variables }),
    });
  }

  // ─── Sending ─────────────────────────────────────────────────

  async send(data: any) {
    return this.request('/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendBulk(data: any) {
    return this.request('/send/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendToRole(role: string, type: string, data: Record<string, any>, channels?: string[]) {
    return this.request('/send/role', {
      method: 'POST',
      body: JSON.stringify({ role, type, data, channels }),
    });
  }

  async schedule(data: any) {
    return this.request('/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelScheduled(id: string) {
    return this.request(`/schedule/${id}`, { method: 'DELETE' });
  }

  // ─── Admin ───────────────────────────────────────────────────

  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getFailed(params?: { page?: number; limit?: number }) {
    return this.request(`/admin/failed${this.qs(params)}`);
  }

  async retryFailed(id: string) {
    return this.request(`/admin/retry/${id}`, { method: 'POST' });
  }

  async retryAllFailed() {
    return this.request('/admin/retry/all', { method: 'POST' });
  }

  async getChannelConfigs() {
    return this.request('/admin/channels');
  }

  async updateChannelConfig(channel: string, config: any) {
    return this.request(`/admin/channels/${channel}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async testChannel(channel: string, recipient: string, message: string) {
    return this.request(`/admin/channels/${channel}/test`, {
      method: 'POST',
      body: JSON.stringify({ recipient, message }),
    });
  }

  async createCampaign(data: any) {
    return this.request('/admin/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listCampaigns(params?: { page?: number; limit?: number }) {
    return this.request(`/admin/campaigns${this.qs(params)}`);
  }

  // ─── Analytics ───────────────────────────────────────────────

  async getChannelPerformance(params?: { dateFrom?: string; dateTo?: string }) {
    return this.request(`/analytics/channel-performance${this.qs(params)}`);
  }

  async getTypeBreakdown(params?: { dateFrom?: string; dateTo?: string }) {
    return this.request(`/analytics/type-breakdown${this.qs(params)}`);
  }

  async getHourlyDistribution(params?: { dateFrom?: string; dateTo?: string }) {
    return this.request(`/analytics/hourly${this.qs(params)}`);
  }

  async getDailyStats(params?: { dateFrom?: string; dateTo?: string }) {
    return this.request(`/analytics/daily${this.qs(params)}`);
  }

  async getAnalyticsDashboard() {
    return this.request('/analytics/dashboard');
  }

  async getDeliveryTime(params?: { channel?: string }) {
    return this.request(`/analytics/delivery-time${this.qs(params)}`);
  }

  async getUserEngagement(params?: { userId?: string }) {
    return this.request(`/analytics/user-engagement${this.qs(params)}`);
  }

  // ─── Logs ─────────────────────────────────────────────────────

  async getSmsLogs(params?: Record<string, any>) {
    return this.request(`/logs/sms${this.qs(params)}`);
  }

  async getEmailLogs(params?: Record<string, any>) {
    return this.request(`/logs/email${this.qs(params)}`);
  }

  async getWhatsAppLogs(params?: Record<string, any>) {
    return this.request(`/logs/whatsapp${this.qs(params)}`);
  }
}

export const notificationClient = new NotificationClient();
