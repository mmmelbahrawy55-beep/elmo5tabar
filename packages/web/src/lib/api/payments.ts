const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class PaymentClient {
  private accessToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
    }
  }

  setToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
      }
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}/payments${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  private qs(params?: Record<string, any>): string {
    if (!params) return '';
    const filtered = Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== '',
    );
    if (filtered.length === 0) return '';
    return '?' + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString();
  }

  // ─── Invoices ────────────────────────────────────────────────

  async createInvoice(data: any) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInvoices(params?: Record<string, any>) {
    return this.request(`/invoices${this.qs(params)}`);
  }

  async getInvoice(id: string) {
    return this.request(`/invoices/${id}`);
  }

  async updateInvoiceStatus(id: string, status: string, reason?: string) {
    return this.request(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async getInvoicePDF(id: string) {
    return this.request(`/invoices/${id}/pdf`);
  }

  async getInvoiceReceipt(id: string) {
    return this.request(`/invoices/${id}/receipt`);
  }

  async voidInvoice(id: string, reason: string) {
    return this.request(`/invoices/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getOverdueInvoices(params?: Record<string, any>) {
    return this.request(`/invoices/overdue${this.qs(params)}`);
  }

  async calculateInsuranceCoverage(id: string, data: any) {
    return this.request(`/invoices/${id}/insurance`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ─── Payments ────────────────────────────────────────────────

  async processPayment(data: any) {
    return this.request('/process', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayments(params?: Record<string, any>) {
    return this.request(`/payments${this.qs(params)}`);
  }

  async getPayment(id: string) {
    return this.request(`/payments/${id}`);
  }

  async getPaymentStats(params?: Record<string, any>) {
    return this.request(`/payments/stats${this.qs(params)}`);
  }

  async getPaymentHistory(params?: Record<string, any>) {
    return this.request(`/payments/history${this.qs(params)}`);
  }

  async getMethodReport(params?: Record<string, any>) {
    return this.request(`/payments/method-report${this.qs(params)}`);
  }

  async generatePaymentReceipt(id: string) {
    return this.request(`/payments/${id}/receipt`, { method: 'POST' });
  }

  // ─── Refunds ─────────────────────────────────────────────────

  async processRefund(data: any) {
    return this.request('/refunds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRefunds(params?: Record<string, any>) {
    return this.request(`/refunds${this.qs(params)}`);
  }

  async getRefund(id: string) {
    return this.request(`/refunds/${id}`);
  }

  async approveRefund(id: string) {
    return this.request(`/refunds/${id}/approve`, { method: 'PATCH' });
  }

  async rejectRefund(id: string, reason: string) {
    return this.request(`/refunds/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async getRefundStats(params?: Record<string, any>) {
    return this.request(`/refunds/stats${this.qs(params)}`);
  }

  // ─── Webhooks ────────────────────────────────────────────────

  async sendStripeWebhook(payload: any, signature: string) {
    return this.request('/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: JSON.stringify(payload),
    });
  }

  async sendTapWebhook(payload: any) {
    return this.request('/webhooks/tap', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendHyperPayWebhook(payload: any) {
    return this.request('/webhooks/hyperpay', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendPayPalWebhook(payload: any) {
    return this.request('/webhooks/paypal', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ─── Wallet ──────────────────────────────────────────────────

  async createWallet(data: any) {
    return this.request('/wallet', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWallet() {
    return this.request('/wallet');
  }

  async topUpWallet(data: any) {
    return this.request('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWalletTransactions(params?: Record<string, any>) {
    return this.request(`/wallet/transactions${this.qs(params)}`);
  }

  async transferWallet(data: any) {
    return this.request('/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ─── Gift Cards ──────────────────────────────────────────────

  async purchaseGiftCard(data: any) {
    return this.request('/gift-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGiftCard(number: string) {
    return this.request(`/gift-cards/${number}`);
  }

  async getGiftCardBalance(number: string) {
    return this.request(`/gift-cards/${number}/balance`);
  }

  async redeemGiftCard(data: any) {
    return this.request('/gift-cards/redeem', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deactivateGiftCard(number: string) {
    return this.request(`/gift-cards/${number}/deactivate`, {
      method: 'PATCH',
    });
  }

  // ─── Installments ────────────────────────────────────────────

  async createInstallmentPlan(data: any) {
    return this.request('/installments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInstallmentPlans(params?: Record<string, any>) {
    return this.request(`/installments${this.qs(params)}`);
  }

  async getInstallmentPlan(id: string) {
    return this.request(`/installments/${id}`);
  }

  async processInstallmentPayment(id: string, data: any) {
    return this.request(`/installments/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelInstallmentPlan(id: string) {
    return this.request(`/installments/${id}/cancel`, { method: 'PATCH' });
  }

  // ─── Corporate ───────────────────────────────────────────────

  async createCorporateAccount(data: any) {
    return this.request('/corporate/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCorporateAccounts(params?: Record<string, any>) {
    return this.request(`/corporate/accounts${this.qs(params)}`);
  }

  async getCorporateAccount(id: string) {
    return this.request(`/corporate/accounts/${id}`);
  }

  async getCorporateAccountInvoices(id: string, params?: Record<string, any>) {
    return this.request(`/corporate/accounts/${id}/invoices${this.qs(params)}`);
  }

  async processCorporatePayment(id: string, data: any) {
    return this.request(`/corporate/accounts/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async closeCorporateCycle(id: string) {
    return this.request(`/corporate/accounts/${id}/close-cycle`, {
      method: 'POST',
    });
  }

  async getCorporateAging(id: string, params?: Record<string, any>) {
    return this.request(`/corporate/accounts/${id}/aging${this.qs(params)}`);
  }

  async getCorporateReport() {
    return this.request('/corporate/report');
  }

  // ─── Subscriptions ───────────────────────────────────────────

  async createSubscription(data: any) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubscriptions(params?: Record<string, any>) {
    return this.request(`/subscriptions${this.qs(params)}`);
  }

  async getSubscription(id: string) {
    return this.request(`/subscriptions/${id}`);
  }

  async pauseSubscription(id: string) {
    return this.request(`/subscriptions/${id}/pause`, { method: 'PATCH' });
  }

  async resumeSubscription(id: string) {
    return this.request(`/subscriptions/${id}/resume`, { method: 'PATCH' });
  }

  async cancelSubscription(id: string) {
    return this.request(`/subscriptions/${id}/cancel`, { method: 'PATCH' });
  }

  // ─── Coupons ─────────────────────────────────────────────────

  async createCoupon(data: any) {
    return this.request('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCoupons(params?: Record<string, any>) {
    return this.request(`/coupons${this.qs(params)}`);
  }

  async validateCoupon(code: string, invoiceId: string) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, invoiceId }),
    });
  }

  async applyCoupon(data: any) {
    return this.request('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deactivateCoupon(id: string) {
    return this.request(`/coupons/${id}/deactivate`, { method: 'PATCH' });
  }

  // ─── Tax ─────────────────────────────────────────────────────

  async getTaxConfig() {
    return this.request('/tax/config');
  }

  async updateTaxConfig(id: string, data: any) {
    return this.request(`/tax/config/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getTaxReport(params: Record<string, any>) {
    return this.request(`/tax/report${this.qs(params)}`);
  }

  // ─── Reports ─────────────────────────────────────────────────

  async getRevenueReport(params: Record<string, any>) {
    return this.request(`/reports/revenue${this.qs(params)}`);
  }

  async getAgingReport(params?: Record<string, any>) {
    return this.request(`/reports/aging${this.qs(params)}`);
  }

  async getRefundReport(params: Record<string, any>) {
    return this.request(`/reports/refund${this.qs(params)}`);
  }

  // ─── Fraud ───────────────────────────────────────────────────

  async getFraudAlerts(params?: Record<string, any>) {
    return this.request(`/fraud/alerts${this.qs(params)}`);
  }

  async investigateFraudAlert(id: string, data?: any) {
    return this.request(`/fraud/alerts/${id}/investigate`, {
      method: 'PATCH',
      body: JSON.stringify(data || {}),
    });
  }

  async resolveFraudAlert(id: string, data: any) {
    return this.request(`/fraud/alerts/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getFraudStats() {
    return this.request('/fraud/stats');
  }
}

export const paymentClient = new PaymentClient();
