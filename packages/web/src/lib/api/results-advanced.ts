import api, { ApiResponse } from '@/lib/api';

const BASE = '/results/advanced';

export type AlertSeverity = 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'escalated';
export type NoteVisibility = 'public' | 'private';
export type ResultStatus = 'draft' | 'review' | 'approved' | 'published';
export type TimeGranularity = 'daily' | 'weekly' | 'monthly';
export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface CriticalAlert {
  id: string;
  patientId: string;
  patientName: string;
  reportId: string;
  testName: string;
  parameter: string;
  value: string;
  reference: string;
  severity: AlertSeverity;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  escalatedAt?: string;
  createdAt: string;
}

export interface AlertStats {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  escalated: number;
  avgResponseTime: number;
}

export interface AIExplanation {
  id: string;
  reportId: string;
  summary: string;
  detailed: string;
  findings: string[];
  recommendations: string[];
  confidence: number;
  language: string;
  generatedAt: string;
}

export interface PatientInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'improvement' | 'warning';
  title: string;
  description: string;
  relatedTests: string[];
  severity: 'low' | 'medium' | 'high';
  date: string;
}

export interface DoctorNote {
  id: string;
  reportId: string;
  patientId: string;
  authorId: string;
  authorName: string;
  content: string;
  visibility: NoteVisibility;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  reportId: string;
  patientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface AttachmentType {
  type: string;
  count: number;
}

export interface ShareLink {
  id: string;
  token: string;
  reportIds: string[];
  patientId: string;
  password?: string;
  expiresAt: string;
  maxAccess: number;
  accessCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface LinkAnalytics {
  linkId: string;
  accessCount: number;
  uniqueIps: number;
  lastAccessed: string;
  accessLog: { ip: string; timestamp: string; userAgent: string }[];
}

export interface ComparisonResult {
  testName: string;
  parameter: string;
  values: { date: string; value: number; unit: string }[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  changePercent: number;
  isAbnormal: boolean;
}

export interface TestTrend {
  date: string;
  value: number;
  unit: string;
  isAbnormal: boolean;
  referenceMin: number;
  referenceMax: number;
}

export interface DeltaComparison {
  parameter: string;
  previousValue: number;
  currentValue: number;
  unit: string;
  absoluteChange: number;
  percentChange: number;
  isSignificant: boolean;
  direction: 'up' | 'down' | 'unchanged';
}

export interface ChartDataPoint {
  date: string;
  value: number;
  unit: string;
}

export interface PatientSummary {
  patientId: string;
  patientName: string;
  totalReports: number;
  totalTests: number;
  abnormalCount: number;
  criticalCount: number;
  lastReportDate: string;
  commonAbnormalities: { test: string; parameter: string; count: number }[];
}

export interface TimelineEvent {
  id: string;
  type: 'report_created' | 'result_updated' | 'result_verified' | 'result_published' | 'critical_alert' | 'note_added' | 'attachment_added' | 'shared' | 'viewed';
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TimelineStats {
  totalEvents: number;
  byType: Record<string, number>;
  mostActiveDay: string;
  averageEventsPerDay: number;
  recentActivity: number;
}

export interface AuditEntry {
  id: string;
  reportId?: string;
  patientId?: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: AuditSeverity;
  timestamp: string;
}

export interface SuspiciousActivity {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  severity: AuditSeverity;
  timestamp: string;
  details: Record<string, unknown>;
  resolved: boolean;
}

export interface AuditStats {
  totalEntries: number;
  bySeverity: Record<string, number>;
  byAction: Record<string, number>;
  suspiciousCount: number;
  mostActiveUser: { userId: string; userName: string; count: number };
  peakHour: number;
}

export interface ComplianceReport {
  standard: string;
  status: 'compliant' | 'partial' | 'non_compliant';
  score: number;
  lastAssessment: string;
  findings: { id: string; description: string; severity: string; remediated: boolean }[];
}

export interface VerificationToken {
  token: string;
  expiresAt: string;
  qrCode: string;
  barcode: string;
}

export interface DashboardOverview {
  totalResults: number;
  todayResults: number;
  pendingReview: number;
  averageTurnaround: number;
  abnormalRate: number;
  criticalAlerts: number;
  totalPatients: number;
  activeDoctors: number;
}

export interface DailyTrend {
  date: string;
  total: number;
  completed: number;
  abnormal: number;
  critical: number;
}

export interface TurnaroundTime {
  average: number;
  byDepartment: { department: string; averageHours: number; sampleSize: number }[];
  byPriority: { priority: string; averageHours: number }[];
}

export interface AbnormalRate {
  overall: number;
  byDepartment: { department: string; rate: number; total: number; abnormal: number }[];
  byTest: { test: string; rate: number; total: number }[];
}

export interface DepartmentCritical {
  department: string;
  total: number;
  critical: number;
  percentage: number;
}

export interface DoctorPerformance {
  doctorId: string;
  doctorName: string;
  totalReviewed: number;
  averageReviewTime: number;
  accuracy: number;
  criticalFlagged: number;
  lastActive: string;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  abnormalCount: number;
}

class ResultsAdvancedClient {
  // ─── Critical Alerts ────────────────────────────────────────
  async checkCriticalValues(id: string) {
    return api.post<ApiResponse>(`${BASE}/${id}/check-critical`);
  }

  async getActiveAlerts(filters?: Record<string, unknown>) {
    return api.get<ApiResponse<CriticalAlert[]>>(`${BASE}/critical-alerts`, { params: filters });
  }

  async acknowledgeAlert(id: string) {
    return api.post<ApiResponse>(`${BASE}/critical-alerts/${id}/acknowledge`);
  }

  async resolveAlert(id: string, resolution: string) {
    return api.post<ApiResponse>(`${BASE}/critical-alerts/${id}/resolve`, { resolution });
  }

  async escalateAlert(id: string) {
    return api.post<ApiResponse>(`${BASE}/critical-alerts/${id}/escalate`);
  }

  async getAlertHistory(patientId: string) {
    return api.get<ApiResponse<CriticalAlert[]>>(`${BASE}/critical-alerts/history/${patientId}`);
  }

  async getAlertStats() {
    return api.get<ApiResponse<AlertStats>>(`${BASE}/critical-alerts/stats`);
  }

  // ─── AI Explanations ────────────────────────────────────────
  async getExplanation(id: string, lang: string) {
    return api.get<ApiResponse<AIExplanation>>(`${BASE}/${id}/explain`, { params: { lang } });
  }

  async regenerateExplanation(id: string) {
    return api.post<ApiResponse<AIExplanation>>(`${BASE}/${id}/explain/regenerate`);
  }

  async getPatientInsights(patientId: string) {
    return api.get<ApiResponse<PatientInsight[]>>(`${BASE}/insights/${patientId}`);
  }

  async getTrendExplanation(id: string) {
    return api.get<ApiResponse<AIExplanation>>(`${BASE}/${id}/explain/trend`);
  }

  // ─── Doctor Notes ───────────────────────────────────────────
  async addNote(reportId: string, data: { content: string; visibility: NoteVisibility }) {
    return api.post<ApiResponse<DoctorNote>>(`${BASE}/${reportId}/notes`, data);
  }

  async getNotes(reportId: string) {
    return api.get<ApiResponse<DoctorNote[]>>(`${BASE}/${reportId}/notes`);
  }

  async updateNote(noteId: string, data: Partial<DoctorNote>) {
    return api.patch<ApiResponse<DoctorNote>>(`${BASE}/notes/${noteId}`, data);
  }

  async deleteNote(noteId: string) {
    return api.delete<ApiResponse>(`${BASE}/notes/${noteId}`);
  }

  async getPatientNotes(patientId: string) {
    return api.get<ApiResponse<DoctorNote[]>>(`${BASE}/notes/patient/${patientId}`);
  }

  async getMyNotes() {
    return api.get<ApiResponse<DoctorNote[]>>(`${BASE}/notes/my`);
  }

  async createNoteTemplate(data: { name: string; content: string; category: string }) {
    return api.post<ApiResponse<NoteTemplate>>(`${BASE}/notes/templates`, data);
  }

  async getNoteTemplates() {
    return api.get<ApiResponse<NoteTemplate[]>>(`${BASE}/notes/templates`);
  }

  // ─── Attachments ────────────────────────────────────────────
  async uploadAttachment(reportId: string, formData: FormData) {
    return api.post<ApiResponse<Attachment>>(`${BASE}/${reportId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async getAttachments(reportId: string) {
    return api.get<ApiResponse<Attachment[]>>(`${BASE}/${reportId}/attachments`);
  }

  async downloadAttachment(attachmentId: string) {
    return api.get(`${BASE}/attachments/${attachmentId}`, { responseType: 'blob' });
  }

  async deleteAttachment(attachmentId: string) {
    return api.delete<ApiResponse>(`${BASE}/attachments/${attachmentId}`);
  }

  async getAttachmentTypes(patientId: string) {
    return api.get<ApiResponse<AttachmentType[]>>(`${BASE}/attachments/types/${patientId}`);
  }

  // ─── Share Links ────────────────────────────────────────────
  async createShareLink(data: { reportIds: string[]; password?: string; expiresInDays?: number; maxAccess?: number }) {
    return api.post<ApiResponse<ShareLink>>(`${BASE}/share-links`, data);
  }

  async accessSharedLink(token: string, password?: string) {
    return api.post<ApiResponse>(`${BASE}/share-links/access/${token}`, { password });
  }

  async revokeShareLink(linkId: string) {
    return api.delete<ApiResponse>(`${BASE}/share-links/${linkId}`);
  }

  async getActiveLinks() {
    return api.get<ApiResponse<ShareLink[]>>(`${BASE}/share-links/active`);
  }

  async getLinkAnalytics(linkId: string) {
    return api.get<ApiResponse<LinkAnalytics>>(`${BASE}/share-links/${linkId}/analytics`);
  }

  // ─── Comparison ─────────────────────────────────────────────
  async getPatientComparison(patientId: string, params?: Record<string, unknown>) {
    return api.get<ApiResponse<ComparisonResult[]>>(`${BASE}/comparison/patient/${patientId}`, { params });
  }

  async getTestTrends(patientId: string, labTestId: string) {
    return api.get<ApiResponse<TestTrend[]>>(`${BASE}/comparison/tests/${patientId}/${labTestId}`);
  }

  async compareDelta(data: { reportId1: string; reportId2: string }) {
    return api.post<ApiResponse<DeltaComparison[]>>(`${BASE}/comparison/delta`, data);
  }

  async getChartData(patientId: string, params?: { testId?: string; from?: string; to?: string }) {
    return api.get<ApiResponse<ChartDataPoint[]>>(`${BASE}/comparison/chart/${patientId}`, { params });
  }

  async exportComparison(patientId: string, params?: { from?: string; to?: string; format?: string }) {
    return api.get(`${BASE}/comparison/export/${patientId}`, { params, responseType: 'blob' });
  }

  async getPatientSummary(patientId: string) {
    return api.get<ApiResponse<PatientSummary>>(`${BASE}/comparison/summary/${patientId}`);
  }

  // ─── Timeline ───────────────────────────────────────────────
  async getPatientTimeline(patientId: string, params?: { page?: number; limit?: number }) {
    return api.get<ApiResponse<TimelineEvent[]>>(`${BASE}/timeline/patient/${patientId}`, { params });
  }

  async getReportTimeline(reportId: string) {
    return api.get<ApiResponse<TimelineEvent[]>>(`${BASE}/timeline/report/${reportId}`);
  }

  async getDailyTimeline(patientId: string, date: string) {
    return api.get<ApiResponse<TimelineEvent[]>>(`${BASE}/timeline/daily/${patientId}/${date}`);
  }

  async getTimelineStats(patientId: string) {
    return api.get<ApiResponse<TimelineStats>>(`${BASE}/timeline/stats/${patientId}`);
  }

  // ─── Audit Trail ────────────────────────────────────────────
  async getReportAudit(reportId: string) {
    return api.get<ApiResponse<AuditEntry[]>>(`${BASE}/audit/report/${reportId}`);
  }

  async getPatientAudit(patientId: string) {
    return api.get<ApiResponse<AuditEntry[]>>(`${BASE}/audit/patient/${patientId}`);
  }

  async getSuspiciousActivity() {
    return api.get<ApiResponse<SuspiciousActivity[]>>(`${BASE}/audit/suspicious`);
  }

  async getAuditStats() {
    return api.get<ApiResponse<AuditStats>>(`${BASE}/audit/stats`);
  }

  async exportAuditLog(params?: Record<string, unknown>) {
    return api.get(`${BASE}/audit/export`, { params, responseType: 'blob' });
  }

  async getUserAudit(userId: string) {
    return api.get<ApiResponse<AuditEntry[]>>(`${BASE}/audit/user/${userId}`);
  }

  async getComplianceReport() {
    return api.get<ApiResponse<ComplianceReport[]>>(`${BASE}/audit/compliance`);
  }

  // ─── PDF & Verification ─────────────────────────────────────
  async generatePdf(id: string) {
    return api.post<ApiResponse<{ url: string }>>(`${BASE}/${id}/pdf/generate`);
  }

  async signPdf(id: string) {
    return api.post<ApiResponse<{ url: string }>>(`${BASE}/${id}/pdf/sign`);
  }

  async getQrCode(id: string) {
    return api.get<ApiResponse<{ qrCode: string }>>(`${BASE}/${id}/verification/qrcode`);
  }

  async getBarcode(id: string) {
    return api.get<ApiResponse<{ barcode: string }>>(`${BASE}/${id}/verification/barcode`);
  }

  async createVerificationToken(id: string) {
    return api.post<ApiResponse<VerificationToken>>(`${BASE}/${id}/verification/token`);
  }

  async verifyByToken(token: string) {
    return api.get<ApiResponse>(`${BASE}/verification/verify/${token}`);
  }

  async getVerificationUrl(id: string) {
    return api.get<ApiResponse<{ url: string }>>(`${BASE}/${id}/verification/url`);
  }

  // ─── Dashboard ──────────────────────────────────────────────
  async getDashboardOverview() {
    return api.get<ApiResponse<DashboardOverview>>(`${BASE}/dashboard/overview`);
  }

  async getDailyTrends() {
    return api.get<ApiResponse<DailyTrend[]>>(`${BASE}/dashboard/daily-trends`);
  }

  async getTurnaroundTime() {
    return api.get<ApiResponse<TurnaroundTime>>(`${BASE}/dashboard/turnaround`);
  }

  async getAbnormalRate() {
    return api.get<ApiResponse<AbnormalRate>>(`${BASE}/dashboard/abnormal-rate`);
  }

  async getCriticalByDepartment() {
    return api.get<ApiResponse<DepartmentCritical[]>>(`${BASE}/dashboard/critical-by-department`);
  }

  async getDoctorPerformance() {
    return api.get<ApiResponse<DoctorPerformance[]>>(`${BASE}/dashboard/doctor-performance`);
  }

  async getCategoryBreakdown() {
    return api.get<ApiResponse<CategoryBreakdown[]>>(`${BASE}/dashboard/category-breakdown`);
  }
}

export const resultsAdvancedApi = new ResultsAdvancedClient();
