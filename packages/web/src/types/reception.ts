// ============================================================
// QUEUE MANAGEMENT TYPES
// ============================================================

export type QueuePriority = 'normal' | 'priority' | 'vip' | 'emergency';
export type QueueStatus = 'waiting' | 'serving' | 'completed' | 'no-show' | 'cancelled' | 'transferred';
export type ServiceType = 'walk-in' | 'appointment' | 'home-visit' | 'consultation';
export type TicketPrefix = 'Q' | 'O' | 'P' | 'V' | 'E';

export interface QueueEntry {
  id: string;
  ticketNumber: string; // Q-20260728-0001
  branchId: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientNationalId?: string;
  serviceType: ServiceType;
  priority: QueuePriority;
  status: QueueStatus;
  servicePoint?: string;
  phlebotomistId?: string;
  calledAt?: string;
  startedServingAt?: string;
  completedAt?: string;
  estimatedWaitMinutes?: number;
  actualWaitMinutes?: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  waitTimeMinutes?: number;
  position?: number;
  isOverdue?: boolean;
}

export interface QueueServicePoint {
  id: string;
  branchId: string;
  name: string;
  type: 'counter' | 'desk' | 'vip' | 'emergency' | 'consultation';
  status: 'active' | 'inactive' | 'maintenance';
  currentQueueEntryId?: string;
  assignedUserId?: string;
  maxConcurrent: number;
  averageServiceMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueueSettings {
  id: string;
  branchId: string;
  maxWaitTargetMinutes: number;
  autoAssignEnabled: boolean;
  priorityBoostMinutes: number;
  vipMaxWaitMinutes: number;
  emergencyOverride: boolean;
  announceOnScreen: boolean;
  announceAudio: boolean;
  ticketPrinterEnabled: boolean;
  operatingHours?: Record<string, { open: string; close: string; isOpen: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface QueueStats {
  totalWaiting: number;
  totalServing: number;
  totalCompletedToday: number;
  totalNoShow: number;
  averageWaitMinutes: number;
  longestWaitMinutes: number;
  estimatedNextWait: number;
  byPriority: {
    emergency: number;
    vip: number;
    priority: number;
    normal: number;
  };
  byServiceType: {
    walkIn: number;
    appointment: number;
    homeVisit: number;
    consultation: number;
  };
  servicePoints: {
    total: number;
    active: number;
    busy: number;
    idle: number;
  };
  hourlyDistribution: { hour: string; count: number }[];
}

// ============================================================
// WALK-IN REGISTRATION TYPES
// ============================================================

export type WalkInReferralSource = 'walk-in' | 'online' | 'doctor-referral' | 'corporate';

export interface WalkInRegistration {
  id: string;
  registrationNumber: string;
  branchId: string;
  patientId?: string;
  queueEntryId?: string;
  appointmentId?: string;
  isNewPatient: boolean;
  patientName: string;
  patientPhone: string;
  patientNationalId?: string;
  patientDob?: string;
  patientGender?: 'male' | 'female';
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  requestedServices: string[];
  referralSource: WalkInReferralSource;
  notes?: string;
  barcode?: string;
  qrCode?: string;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// INSURANCE VERIFICATION TYPES
// ============================================================

export type InsuranceVerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired' | 'partial';

export interface InsuranceVerification {
  id: string;
  verificationNumber: string;
  branchId: string;
  patientId: string;
  walkInId?: string;
  insuranceProvider: string;
  insuranceNumber: string;
  insuranceExpiry?: string;
  verificationStatus: InsuranceVerificationStatus;
  coveragePercentage?: number;
  coveredAmount?: number;
  totalAmount?: number;
  approvalCode?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  apiResponse?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// BRANCH TRANSFER TYPES
// ============================================================

export type TransferStatus = 'pending' | 'accepted' | 'in-transit' | 'completed' | 'rejected';

export interface BranchTransfer {
  id: string;
  transferNumber: string;
  fromBranchId: string;
  fromBranchName?: string;
  toBranchId: string;
  toBranchName?: string;
  patientId: string;
  patientName?: string;
  queueEntryId?: string;
  walkInId?: string;
  orderId?: string;
  reason: string;
  status: TransferStatus;
  priority: 'normal' | 'urgent';
  notes?: string;
  transferredBy: string;
  acceptedBy?: string;
  transferredAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// HOME VISIT TYPES
// ============================================================

export type HomeVisitStatus = 'pending' | 'assigned' | 'en-route' | 'sample-collected' | 'completed' | 'cancelled';

export interface HomeVisitRequest {
  id: string;
  requestNumber: string;
  branchId: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  orderId?: string;
  queueEntryId?: string;
  status: HomeVisitStatus;
  priority: 'normal' | 'urgent' | 'vip';
  patientAddress: string;
  patientCity?: string;
  patientLat?: number;
  patientLng?: number;
  preferredDate?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  assignedPhlebotomistId?: string;
  assignedPhlebotomistName?: string;
  assignedAt?: string;
  enRouteAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  specialInstructions?: string;
  accessNotes?: string;
  distanceKm?: number;
  estimatedArrivalMinutes?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// VIP & PRIORITY TYPES
// ============================================================

export type VipTier = 'silver' | 'gold' | 'platinum' | 'diamond';

export interface VipMember {
  id: string;
  patientId: string;
  patientName?: string;
  vipTier: VipTier;
  reason?: string;
  grantedBy?: string;
  grantedAt: string;
  expiresAt?: string;
  benefits?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriorityRule {
  id: string;
  branchId?: string;
  ruleName: string;
  conditionType: string;
  conditionValue: Record<string, any>;
  priorityLevel: 'priority' | 'vip';
  autoApply: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// EMERGENCY TYPES
// ============================================================

export type EmergencySeverity = 'critical' | 'urgent' | 'moderate';
export type EmergencyStatus = 'triaged' | 'in-treatment' | 'stabilized' | 'transferred' | 'completed';

export interface EmergencyCase {
  id: string;
  caseNumber: string;
  branchId: string;
  patientId?: string;
  patientName?: string;
  queueEntryId?: string;
  severityLevel: EmergencySeverity;
  symptoms: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
    weight?: number;
  };
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  status: EmergencyStatus;
  transferredTo?: string;
  transferNotes?: string;
  triageNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// BARCODE / QR TYPES
// ============================================================

export type BarcodeEntityType = 'patient' | 'order' | 'appointment' | 'walk-in' | 'sample' | 'queue-ticket';
export type BarcodeType = 'code128' | 'qr' | 'datamatrix';

export interface BarcodePrintJob {
  id: string;
  branchId: string;
  entityType: BarcodeEntityType;
  entityId: string;
  barcodeData: string;
  barcodeType: BarcodeType;
  printerId?: string;
  printedBy: string;
  printedAt: string;
  status: 'queued' | 'printing' | 'printed' | 'failed';
  copies: number;
  createdAt: string;
}

// ============================================================
// RECEPTION DASHBOARD COMPOSITE TYPES
// ============================================================

export interface ReceptionDashboardData {
  queueStats: QueueStats;
  recentWalkIns: WalkInRegistration[];
  pendingVerifications: InsuranceVerification[];
  activeTransfers: BranchTransfer[];
  pendingHomeVisits: HomeVisitRequest[];
  emergencyAlerts: EmergencyCase[];
  servicePoints: QueueServicePoint[];
  todayStats: {
    totalWalkIns: number;
    totalAppointments: number;
    totalQueueEntries: number;
    totalInsuranceVerifications: number;
    totalTransfers: number;
    totalHomeVisits: number;
    totalEmergencyCases: number;
    revenue: number;
    averageWaitTime: number;
  };
}

// ============================================================
// SEARCH & FILTER TYPES
// ============================================================

export interface PatientSearchResult {
  id: string;
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn?: string;
  lastNameEn?: string;
  phone: string;
  nationalId?: string;
  dateOfBirth: string;
  gender: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  isVip?: boolean;
  vipTier?: VipTier;
  lastVisit?: string;
  totalVisits: number;
}

export interface ReceptionFilters {
  status?: string;
  priority?: string;
  serviceType?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

// ============================================================
// KEYBOARD SHORTCUT TYPES
// ============================================================

export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  descriptionAr: string;
  action: string;
  category: 'queue' | 'walk-in' | 'search' | 'navigation' | 'general';
}

// ============================================================
// PRINTER TYPES
// ============================================================

export interface TicketData {
  ticketNumber: string;
  patientName: string;
  serviceType: string;
  priority: QueuePriority;
  queuePosition: number;
  estimatedWait: number;
  branchName: string;
  timestamp: string;
  barcodeData: string;
}

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'thermal' | 'laser' | 'label';
  connection: 'usb' | 'network' | 'bluetooth';
  paperSize: '58mm' | '80mm' | 'a4' | 'label';
  isActive: boolean;
  lastUsed?: string;
}
