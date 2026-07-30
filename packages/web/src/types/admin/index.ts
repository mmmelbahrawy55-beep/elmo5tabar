export type AdminModule =
  | 'executive' | 'analytics' | 'revenue'
  | 'appointments' | 'patients' | 'doctors' | 'staff' | 'reception' | 'branches' | 'departments'
  | 'tests' | 'packages' | 'results' | 'reports' | 'inventory'
  | 'accounting' | 'payroll' | 'insurance'
  | 'partners' | 'marketing' | 'seo' | 'cms' | 'media' | 'blog' | 'offers' | 'coupons'
  | 'notifications' | 'emails' | 'sms' | 'whatsapp'
  | 'roles' | 'permissions' | 'audit' | 'activity' | 'api-monitor' | 'server' | 'security' | 'settings'
  | 'ai';

export type TimePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
  children?: AdminNavItem[];
  roles: string[];
  module: AdminModule;
}

export interface AdminStats {
  totalOrders: number;
  totalPatients: number;
  totalDoctors: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  activeBranches: number;
  todayAppointments: number;
  ordersChange: number;
  patientsChange: number;
  revenueChange: number;
  appointmentsChange: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  revenue: number;
  orders: number;
  patients: number;
  avgWaitTime: number;
  satisfaction: number;
}

export interface DepartmentPerformance {
  departmentId: string;
  departmentName: string;
  testsRun: number;
  revenue: number;
  avgTurnaround: number;
  accuracy: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ActivityLogEntry {
  id: string;
  type: 'auth' | 'order' | 'report' | 'patient' | 'system' | 'payment';
  message: string;
  user?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ApiMonitorEntry {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalRequests: number;
  errorRate: number;
  lastCalled: string;
  status: 'healthy' | 'degraded' | 'down';
}

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: { in: number; out: number };
  uptime: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
  avgResponseTime: number;
}

export interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'brute_force' | 'sql_injection' | 'xss_attempt' | 'unauthorized_access' | 'data_breach' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  blocked: boolean;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'push';
  subject?: string;
  body: string;
  variables: string[];
  active: boolean;
  createdAt: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'ads' | 'whatsapp';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  views: number;
  publishedAt?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  active: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  type: 'percentage' | 'fixed';
  tests: string[];
  packages: string[];
  startDate: string;
  endDate: string;
  active: boolean;
  usageCount: number;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  contactPhone: string;
  contactEmail: string;
  claimsEmail: string;
  totalPatients: number;
  totalClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  avgProcessingDays: number;
  active: boolean;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  period: string;
  status: 'pending' | 'processed' | 'paid';
  paidAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unitPrice: number;
  supplier: string;
  expiryDate: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

export interface SeoMetrics {
  page: string;
  title: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage: string;
  schema: string;
  score: number;
  issues: string[];
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio';
  url: string;
  size: number;
  dimensions?: { width: number; height: number };
  alt?: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  metaTitle: string;
  metaDescription: string;
  status: 'draft' | 'published' | 'archived';
  author: string;
  publishedAt?: string;
  updatedAt: string;
}

export interface AiInsight {
  id: string;
  type: 'anomaly' | 'prediction' | 'recommendation' | 'trend';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  metric?: string;
  value?: number;
  prediction?: number;
  confidence: number;
  actionable: boolean;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  nameAr: string;
  type: 'referral' | 'corporate' | 'insurance' | 'government' | 'pharmacy';
  contactPerson: string;
  email: string;
  phone: string;
  totalReferrals: number;
  totalRevenue: number;
  commission: number;
  status: 'active' | 'inactive' | 'pending';
  contractStart: string;
  contractEnd: string;
}

export interface ExportOptions {
  format: ExportFormat;
  dateRange?: { from: string; to: string };
  filters?: Record<string, unknown>;
  columns?: string[];
  title?: string;
}
