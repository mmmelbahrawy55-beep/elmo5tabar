export interface Branch {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;

  // Location
  address: {
    street: string;
    district: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  addressAr: string;
  addressEn: string;
  coordinates: { lat: number; lng: number };
  mapUrl: string;
  googlePlaceId?: string;

  // Contact
  phone: string;
  whatsapp: string;
  email: string;
  fax?: string;

  // Manager
  manager: {
    nameAr: string;
    nameEn: string;
    title: string;
    phone: string;
    email: string;
    avatar?: string;
    since: string;
  };

  // Operations
  type: 'main' | 'branch' | 'specialty' | 'express';
  status: 'active' | 'maintenance' | 'closed' | 'coming-soon';
  openingHours: DayHours[];
  is24Hours: boolean;
  holidaySchedule?: {
    date: string;
    nameAr: string;
    closed: boolean;
    specialHours?: string;
  }[];

  // Capacity & Queue
  capacity: {
    total: number;
    current: number;
    percentage: number;
  };
  queueStatus: {
    waiting: number;
    averageWait: string;
    walkInAvailable: boolean;
    appointmentSlots: number;
  };

  // Services & Tests
  services: BranchService[];
  availableTests: string[];
  specialServices: string[];
  departments: string[];

  // Facilities
  parking: {
    available: boolean;
    spots: number;
    type: 'free' | 'paid' | 'both';
    valet?: boolean;
  };
  accessibility: {
    wheelchair: boolean;
    ramp: boolean;
    elevator: boolean;
    handicappedParking: boolean;
    audioGuide: boolean;
  };
  amenities: string[];

  // Media
  images: BranchImage[];
  virtualTourUrl?: string;
  coverImage: string;
  logo?: string;

  // Stats
  established: string;
  totalPatients: number;
  rating: number;
  reviewCount: number;
  certifications: string[];

  // Emergency
  emergencyContact: {
    phone: string;
    available24h: boolean;
  };

  // Network
  region: string;
  timezone: string;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  lastSynced: string;
  realtimeEnabled: boolean;
}

export interface DayHours {
  day:
    | 'saturday'
    | 'sunday'
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday';
  dayAr: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface BranchService {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  description: string;
  available: boolean;
  requiresBooking: boolean;
  estimatedTime: string;
}

export interface BranchImage {
  id: string;
  url: string;
  alt: string;
  type:
    | 'exterior'
    | 'interior'
    | 'equipment'
    | 'team'
    | 'waiting'
    | 'virtual-tour'
    | 'parking';
  isPrimary: boolean;
}

export interface BranchFilter {
  cities: string[];
  regions: string[];
  types: Branch['type'][];
  services: string[];
  isOpen: boolean | null;
  hasParking: boolean | null;
  isAccessible: boolean | null;
  acceptWalkIn: boolean | null;
  radius: number;
  sortBy: 'distance' | 'rating' | 'name' | 'capacity' | 'newest';
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface BranchDistance {
  branchId: string;
  distanceKm: number;
  travelTimeMinutes: number;
  travelMode: 'driving' | 'walking' | 'transit';
}
