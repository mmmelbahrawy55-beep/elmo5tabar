// ============================================================================
// Al Mokhtabar Laboratory - Mobile API Types & Contracts
// ============================================================================

export const API_BASE = '/api/v1';

// ---- Auth ----
export interface LoginRequest { email: string; password: string }
export interface RegisterRequest {
  email: string; phone: string; password: string
  firstNameAr: string; lastNameAr: string
  firstNameEn?: string; lastNameEn?: string
}
export interface AuthTokens { accessToken: string; refreshToken: string }
export interface AuthResponse { user: User; tokens: AuthTokens; requiresTwoFactor?: boolean }
export interface User {
  id: string; email: string; phone: string
  firstNameAr: string; lastNameAr: string
  firstNameEn?: string; lastNameEn?: string
  role: Role; avatarUrl?: string; twoFactorEnabled: boolean
  emailVerified: boolean; phoneVerified: boolean
}
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SECURITY_ADMIN' | 'COMPLIANCE_OFFICER'
  | 'BRANCH_MANAGER' | 'DOCTOR' | 'LAB_TECHNICIAN' | 'RECEPTIONIST' | 'BILLING'
  | 'PATIENT' | 'GUEST';

export interface RefreshResponse { accessToken: string; refreshToken: string }

// ---- Profile ----
export interface PatientProfile {
  id: string; userId: string; dateOfBirth?: string; gender?: 'male' | 'female'
  nationality?: string; bloodType?: string; emergencyContact?: EmergencyContact
  insurance?: PatientInsurance; preferredLanguage: 'ar' | 'en'
  createdAt: string; updatedAt: string
}
export interface EmergencyContact {
  name: string; relationship: string; phone: string
}
export interface PatientInsurance {
  provider: string; policyNumber: string; expiryDate: string
  coverageType: string; companyName: string
}

// ---- Family Members ----
export interface FamilyMember {
  id: string; patientId: string; firstNameAr: string; lastNameAr: string
  firstNameEn?: string; lastNameEn?: string
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
  dateOfBirth?: string; gender?: string; bloodType?: string
  insurance?: PatientInsurance; isDependent: boolean
  createdAt: string; updatedAt: string
}

// ---- Branches ----
export interface Branch {
  id: string; nameAr: string; nameEn: string
  cityAr: string; cityEn: string; regionAr: string; regionEn: string
  addressAr: string; addressEn: string
  latitude: number; longitude: number
  phone: string; email?: string; workingHours: WorkingHours[]
  facilities: string[]; services: string[]
  rating?: number; reviewCount?: number
  distance?: number; isOpen: boolean; timezone: string
}
export interface WorkingHours {
  day: string; open: string; close: string; is24h: boolean; isClosed: boolean
}
export interface NearbyQuery { latitude: number; longitude: number; radius?: number }

// ---- Tests ----
export interface LabTest {
  id: string; nameAr: string; nameEn: string
  category: string; department: string
  price: number; insuranceCovered: boolean
  preparation?: string; description?: string
  turnaroundHours: number; isActive: boolean
}
export interface TestPackage {
  id: string; nameAr: string; nameEn: string
  tests: LabTest[]; price: number; discount?: number
  description?: string; isActive: boolean
}

// ---- Appointments ----
export interface AppointmentSlot {
  date: string; startTime: string; endTime: string
  branchId: string; doctorId?: string; isAvailable: boolean
}
export interface AppointmentCreate {
  branchId: string; testIds: string[]; slotDate: string
  slotTime: string; notes?: string; familyMemberId?: string
  isHomeVisit?: boolean; addressId?: string
}
export interface Appointment {
  id: string; patientId: string; branchId: string
  branch: Branch; tests: LabTest[]
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress'
    | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  slotDate: string; slotTime: string
  queueNumber?: number; estimatedWaitMinutes?: number
  isHomeVisit: boolean; homeAddress?: string
  familyMemberId?: string; familyMember?: FamilyMember
  notes?: string; createdAt: string; updatedAt: string
}

// ---- Queue ----
export interface QueueTicket {
  id: string; appointmentId?: string; patientId: string
  branchId: string; servicePoint: string
  queueNumber: number; status: QueueStatus
  estimatedWaitMinutes?: number; positionInQueue?: number
  calledAt?: string; servedAt?: string; completedAt?: string
  canceledAt?: string; createdAt: string
}
export type QueueStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'canceled' | 'no_show' | 'transferred';
export interface QueueStatusResponse {
  branchId: string; ticket: QueueTicket
  aheadCount: number; estimatedWaitMinutes: number
}

// ---- Results / Reports ----
export interface LabReport {
  id: string; orderId: string; patientId: string
  patientName: string; branchName: string
  status: ReportStatus; testResults: TestResult[]
  pdfUrl?: string; qrCode?: string; barcode?: string
  verificationToken?: string
  generatedAt?: string; approvedAt?: string; releasedAt?: string
  createdAt: string; updatedAt: string
}
export type ReportStatus = 'draft' | 'approved' | 'released' | 'amended' | 'cancelled';
export interface TestResult {
  testId: string; testNameAr: string; testNameEn: string
  category: string; result: string; unit?: string
  referenceRange?: string; flags?: 'normal' | 'abnormal' | 'critical'
  isAbnormal: boolean; isCritical: boolean
  notes?: string; performedAt?: string
}
export interface ResultComparison {
  testId: string; testName: string; current: TestResult
  history: Array<{ date: string; result: string }>
  trend: 'stable' | 'increasing' | 'decreasing' | 'fluctuating'
}
export interface HealthTimeline {
  date: string; events: TimelineEvent[]
}
export interface TimelineEvent {
  type: 'test' | 'appointment' | 'prescription' | 'vaccination' | 'note'
  title: string; description?: string; timestamp: string
  metadata?: Record<string, any>
}

// ---- Payments ----
export interface Invoice {
  id: string; patientId: string; invoiceNumber: string
  items: InvoiceItem[]; subtotal: number; discount?: number
  tax: number; total: number; currency: string
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'void' | 'partially_paid'
  dueDate: string; paidAt?: string
  insuranceClaim?: boolean; couponCode?: string
  createdAt: string; updatedAt: string
}
export interface InvoiceItem {
  description: string; quantity: number; unitPrice: number; total: number
}
export interface PaymentMethod {
  id: string; type: 'card' | 'wallet' | 'apple_pay' | 'google_pay' | 'bank_transfer' | 'cash'
  last4?: string; brand?: string; expiryMonth?: number; expiryYear?: number
  isDefault: boolean; isActive: boolean
}
export interface PaymentIntent {
  id: string; amount: number; currency: string
  status: string; clientSecret?: string
  paymentMethod?: PaymentMethod; invoiceId: string
}

// ---- Notifications ----
export interface Notification {
  id: string; userId: string; type: NotificationType
  title: string; body: string; data?: Record<string, any>
  channel: 'push' | 'sms' | 'email' | 'whatsapp' | 'in_app'
  isRead: boolean; readAt?: string; createdAt: string
}
export type NotificationType = 'appointment_reminder' | 'result_ready' | 'queue_update'
  | 'payment_receipt' | 'promotion' | 'system' | 'security_alert' | 'medicine_reminder';

// ---- AI Assistant ----
export interface AIChatMessage {
  id: string; role: 'user' | 'assistant' | 'system'
  content: string; timestamp: string
  metadata?: { actions?: AISuggestedAction[] }
}
export interface AISuggestedAction {
  type: 'book_appointment' | 'view_result' | 'call_branch' | 'navigate' | 'refill'
  label: string; payload: Record<string, any>
}

// ---- Voice Search ----
export interface VoiceSearchResult {
  query: string; transcript: string; confidence: number
  intent: 'search_test' | 'book_appointment' | 'find_branch' | 'view_result' | 'general'
  entities: Record<string, string>; results: any[]
}

// ---- Medicine Reminder ----
export interface MedicineReminder {
  id: string; patientId: string; medicineName: string
  dosage: string; frequency: 'daily' | 'twice_daily' | 'weekly' | 'custom'
  times: string[]; notes?: string; isActive: boolean
  startDate: string; endDate?: string; refillReminder?: boolean
  nextRefillDate?: string; createdAt: string
}

// ---- Generic API Response ----
export interface ApiResponse<T = any> {
  success: boolean; data?: T; message?: string
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}
export interface PaginatedQuery {
  page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'
  search?: string; status?: string
}

// ---- API Endpoints Map ----
export const ENDPOINTS = {
  auth: {
    login: '/auth/login', register: '/auth/register', logout: '/auth/logout',
    refresh: '/auth/refresh', profile: '/auth/me',
    forgotPassword: '/auth/forgot-password', resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email', changePassword: '/auth/change-password',
    enable2FA: '/auth/2fa/enable', confirm2FA: '/auth/2fa/confirm',
    disable2FA: '/auth/2fa/disable', verify2FA: '/auth/2fa/verify',
    backupCodes: '/auth/2fa/backup-codes',
    sessions: '/auth/sessions', session: (id: string) => `/auth/sessions/${id}`,
    devices: '/auth/devices', device: (id: string) => `/auth/devices/${id}`,
    trustDevice: (id: string) => `/auth/devices/${id}/trust`,
    securityAlerts: '/auth/security/alerts',
  },
  appointments: {
    list: '/appointments', create: '/appointments',
    get: (id: string) => `/appointments/${id}`,
    update: (id: string) => `/appointments/${id}`,
    cancel: (id: string) => `/appointments/${id}/cancel`,
    reschedule: (id: string) => `/appointments/${id}/reschedule`,
    checkIn: (id: string) => `/appointments/${id}/check-in`,
    availableSlots: '/appointments/slots/available',
  },
  queue: {
    ticket: '/queue/tickets', ticketById: (id: string) => `/queue/tickets/${id}`,
    status: (branchId: string) => `/queue/status/${branchId}`,
  },
  branches: {
    list: '/branches', get: (id: string) => `/branches/${id}`,
    nearby: '/branches/nearby',
  },
  results: {
    list: '/results', search: '/results/search',
    get: (id: string) => `/results/${id}`,
    pdf: (id: string) => `/results/${id}/pdf`,
    byOrder: (orderId: string) => `/results/order/${orderId}`,
    byPatient: (patientId: string) => `/results/patient/${patientId}`,
    compare: '/results/compare',
    advancedComparison: '/results/advanced/comparison',
    timeline: (patientId: string) => `/results/advanced/timeline/patient/${patientId}`,
    qrCode: (id: string) => `/results/advanced/${id}/verification/qrcode`,
    barcode: (id: string) => `/results/advanced/${id}/verification/barcode`,
    verificationToken: (id: string) => `/results/advanced/${id}/verification/token`,
    verify: (token: string) => `/results/advanced/verification/verify/${token}`,
  },
  payments: {
    invoices: '/payments/invoices', invoice: (id: string) => `/payments/invoices/${id}`,
    invoicePdf: (id: string) => `/payments/invoices/${id}/pdf`,
    process: '/payments/process',
    wallet: '/payments/wallet', walletTransactions: '/payments/wallet/transactions',
    giftCards: '/payments/gift-cards', giftCard: (num: string) => `/payments/gift-cards/${num}`,
    installments: '/payments/installments', installment: (id: string) => `/payments/installments/${id}`,
    subscriptions: '/payments/subscriptions',
    coupons: '/payments/coupons', validateCoupon: '/payments/coupons/validate',
  },
  notifications: {
    list: '/notifications', unreadCount: '/notifications/unread-count',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    preferences: '/notifications/preferences',
  },
  family: {
    list: '/family-members', create: '/family-members',
    get: (id: string) => `/family-members/${id}`,
    update: (id: string) => `/family-members/${id}`,
    delete: (id: string) => `/family-members/${id}`,
  },
  medicine: {
    reminders: '/medicine-reminders', reminder: (id: string) => `/medicine-reminders/${id}`,
  },
  ai: {
    chat: '/ai/chat', stream: '/ai/chat/stream', voice: '/ai/voice',
  },
} as const;
