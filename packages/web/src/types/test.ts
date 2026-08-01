// ============================================================
// LABORATORY TEST TYPES — Complete Data Model
// ============================================================

export interface LabTest {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  category: TestCategory;
  subcategory?: string;
  descriptionAr: string;
  descriptionEn: string;
  purposeAr: string;
  purposeEn: string;
  whoNeedsItAr: string;
  whoNeedsItEn: string;
  preparationAr: string[];
  preparationEn: string[];
  sampleType: SampleType;
  fastingRequired: boolean;
  fastingDuration?: string;
  sampleVolume: string;
  collectionMethod: string;
  normalRange: ReferenceRange[];
  criticalValues: CriticalValue[];
  turnaroundTime: TurnaroundTime;
  price: number;
  discountedPrice?: number;
  currency: string;
  insuranceCoverage: InsuranceCoverage[];
  relatedTestIds: string[];
  packageIds?: string[];
  tags: string[];
  popularity: number;
  isActive: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  requiresAppointment: boolean;
  homeVisitAvailable: boolean;
  lastUpdated: string;
  medicalReferences: MedicalReference[];
  faqs: FAQ[];
}

export type TestCategory =
  | 'hematology'
  | 'chemistry'
  | 'endocrinology'
  | 'immunology'
  | 'microbiology'
  | 'genetics'
  | 'toxicology'
  | 'cardiology'
  | 'oncology'
  | 'nephrology'
  | 'hepatology'
  | 'gastroenterology'
  | 'pulmonology'
  | 'rheumatology'
  | 'dermatology'
  | 'ophthalmology'
  | 'otolaryngology'
  | 'urology'
  | 'gynecology'
  | 'pediatrics'
  | 'nutritional'
  | 'hormonal'
  | 'autoimmune'
  | 'infectious'
  | 'coagulation'
  | 'blood_bank'
  | 'cytology'
  | 'histopathology'
  | 'molecular'
  | 'point_of_care';

export type SampleType =
  | 'blood'
  | 'serum'
  | 'plasma'
  | 'urine'
  | 'stool'
  | 'saliva'
  | 'csf'
  | 'sputum'
  | 'tissue'
  | 'swab'
  | 'bone_marrow'
  | 'synovial_fluid'
  | 'pleural_fluid'
  | 'peritoneal_fluid'
  | 'seminal_fluid'
  | 'nail'
  | 'hair'
  | 'other';

export interface ReferenceRange {
  group: string;
  min: number;
  max: number;
  unit: string;
  gender?: 'male' | 'female' | 'all';
  ageGroup?: string;
}

export interface CriticalValue {
  condition: string;
  threshold: string;
  unit: string;
  urgency: 'high' | 'critical';
}

export interface TurnaroundTime {
  standard: string;
  rush?: string;
  standardHours: number;
  rushHours?: number;
}

export interface InsuranceCoverage {
  provider: string;
  coveragePercent: number;
  preAuthRequired: boolean;
  maxAmount?: number;
}

export interface MedicalReference {
  source: string;
  url?: string;
  year: number;
}

export interface FAQ {
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

export interface TestPackage {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  testIds: string[];
  originalPrice: number;
  packagePrice: number;
  discount: number;
  popularity: number;
  tags: string[];
  category: string;
}

export interface TestFilter {
  categories: TestCategory[];
  priceRange: [number, number];
  sampleTypes: SampleType[];
  fastingRequired: boolean | null;
  turnaroundTime: 'any' | 'fast' | 'normal' | 'slow';
  popularity: 'any' | 'popular' | 'trending';
  sortBy: 'name' | 'price' | 'popularity' | 'turnaround' | 'category';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
}

export interface CompareItem {
  testId: string;
  addedAt: number;
}

export interface UserPreferences {
  favorites: string[];
  recentlyViewed: string[];
  compareList: string[];
}
