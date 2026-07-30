import type {
  Branch,
  BranchService,
  DayHours,
} from '../types/branch';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeHours(
  s = '07:00',
  f = '23:00',
  fridayOpen = '16:00',
  fridayClose = '23:00',
): DayHours[] {
  return [
    { day: 'saturday', dayAr: 'السبت', open: s, close: f, isClosed: false },
    { day: 'sunday', dayAr: 'الأحد', open: s, close: f, isClosed: false },
    { day: 'monday', dayAr: 'الاثنين', open: s, close: f, isClosed: false },
    { day: 'tuesday', dayAr: 'الثلاثاء', open: s, close: f, isClosed: false },
    { day: 'wednesday', dayAr: 'الأربعاء', open: s, close: f, isClosed: false },
    { day: 'thursday', dayAr: 'الخميس', open: s, close: f, isClosed: false },
    { day: 'friday', dayAr: 'الجمعة', open: fridayOpen, close: fridayClose, isClosed: false },
  ];
}

function hours24(): DayHours[] {
  return [
    { day: 'saturday', dayAr: 'السبت', open: '00:00', close: '23:59', isClosed: false },
    { day: 'sunday', dayAr: 'الأحد', open: '00:00', close: '23:59', isClosed: false },
    { day: 'monday', dayAr: 'الاثنين', open: '00:00', close: '23:59', isClosed: false },
    { day: 'tuesday', dayAr: 'الثلاثاء', open: '00:00', close: '23:59', isClosed: false },
    { day: 'wednesday', dayAr: 'الأربعاء', open: '00:00', close: '23:59', isClosed: false },
    { day: 'thursday', dayAr: 'الخميس', open: '00:00', close: '23:59', isClosed: false },
    { day: 'friday', dayAr: 'الجمعة', open: '16:00', close: '23:59', isClosed: false },
  ];
}

const COMMON_SERVICES: BranchService[] = [
  {
    id: 'svc-blood-image',
    nameAr: 'صورة دم كاملة',
    nameEn: 'Complete Blood Count',
    icon: 'droplet',
    description: 'فحص شامل لمكونات الدم الأساسية',
    available: true,
    requiresBooking: false,
    estimatedTime: '30 دقيقة',
  },
  {
    id: 'svc-chemical',
    nameAr: 'تحاليل كيميائية',
    nameEn: 'Chemical Analyses',
    icon: 'flask',
    description: 'تحليل وظائف الكلى والكبد والدهون والسكري',
    available: true,
    requiresBooking: false,
    estimatedTime: '45 دقيقة',
  },
  {
    id: 'svc-hormonal',
    nameAr: 'تحاليل هرمونية',
    nameEn: 'Hormonal Analyses',
    icon: 'activity',
    description: 'قياس مستويات الهرمونات المختلفة',
    available: true,
    requiresBooking: true,
    estimatedTime: 'ساعة',
  },
  {
    id: 'svc-immunology',
    nameAr: 'تحاليل مناعية',
    nameEn: 'Immunology Analyses',
    icon: 'shield',
    description: 'تقييم جهاز المناعة والأجسام المضادة',
    available: true,
    requiresBooking: false,
    estimatedTime: 'ساعة',
  },
  {
    id: 'svc-microbiology',
    nameAr: 'ميكروبيولوجي',
    nameEn: 'Microbiology',
    icon: 'microscope',
    description: 'زراعة وبكتيريا وحساسية المضادات',
    available: true,
    requiresBooking: false,
    estimatedTime: '3 أيام',
  },
  {
    id: 'svc-urine',
    nameAr: 'تحاليل بول',
    nameEn: 'Urine Analyses',
    icon: 'test-tube',
    description: 'تحليل شامل للبول والوظائف الكلوية',
    available: true,
    requiresBooking: false,
    estimatedTime: '30 دقيقة',
  },
  {
    id: 'svc-genetic',
    nameAr: 'تحاليل وراثية',
    nameEn: 'Genetic Analyses',
    icon: 'dna',
    description: 'فحوصات الحمض النووي والأمراض الوراثية',
    available: true,
    requiresBooking: true,
    estimatedTime: 'أسبوع',
  },
  {
    id: 'svc-culture',
    nameAr: 'زرع بكتيري',
    nameEn: 'Bacterial Culture',
    icon: 'petri-dish',
    description: 'زراعة وتحديد نوع البكتيريا وحساسيتها',
    available: true,
    requiresBooking: false,
    estimatedTime: '3 أيام',
  },
  {
    id: 'svc-virus',
    nameAr: 'فحص فيروسات',
    nameEn: 'Virus Testing',
    icon: 'bug',
    description: 'كشف العدوى الفيروسية مثل فيروس الكبد والإنفلونزا',
    available: true,
    requiresBooking: true,
    estimatedTime: 'ساعتان',
  },
  {
    id: 'svc-emergency',
    nameAr: 'تحاليل طوارئ',
    nameEn: 'Emergency Analyses',
    icon: 'alert-triangle',
    description: 'فحوصات عاجلة للمحاليل الطارئة',
    available: true,
    requiresBooking: false,
    estimatedTime: '15 دقيقة',
  },
  {
    id: 'svc-home',
    nameAr: 'زيارة منزلية',
    nameEn: 'Home Visit',
    icon: 'home',
    description: 'سحب عينات في المنزل للمرضى والعجزة',
    available: true,
    requiresBooking: true,
    estimatedTime: 'ساعة',
  },
  {
    id: 'svc-checkup',
    nameAr: 'فحص شامل',
    nameEn: 'Comprehensive Checkup',
    icon: 'clipboard-check',
    description: 'حزمة تحاليل شاملة للصحة العامة',
    available: true,
    requiresBooking: true,
    estimatedTime: 'ساعتان',
  },
  {
    id: 'svc-neonatal',
    nameAr: 'تحاليل حديثي الولاد',
    nameEn: 'Neonatal Analyses',
    icon: 'baby',
    description: 'فحوصات مخصصة لحديثي الولادة',
    available: true,
    requiresBooking: true,
    estimatedTime: 'ساعة',
  },
  {
    id: 'svc-diabetes',
    nameAr: 'تحاليل السكري',
    nameEn: 'Diabetes Analyses',
    icon: 'droplet',
    description: 'فحص السكر التراكمي وال Nz و HbA1c',
    available: true,
    requiresBooking: false,
    estimatedTime: '30 دقيقة',
  },
];

const EXPRESS_SERVICES: BranchService[] = [
  COMMON_SERVICES[0],
  COMMON_SERVICES[1],
  COMMON_SERVICES[5],
  COMMON_SERVICES[9],
  COMMON_SERVICES[13],
];

const CERTIFICATIONS = [
  'معتمد من وزارة الصحة',
  'ISO 15189',
  'CAP Accredited',
];

const AMENITIES_BASE = ['واي فاي', 'غرفة صلاة', 'منطقة ألعاب أطفال'];

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

export const ALL_BRANCHES: Branch[] = [
  // -----------------------------------------------------------------------
  // 1. Main Branch – Riyadh
  // -----------------------------------------------------------------------
  {
    id: 'br-main-riyadh',
    slug: 'main-riyadh',
    nameAr: 'الفرع الرئيسي – الرياض',
    nameEn: 'Main Branch – Riyadh',

    address: {
      street: 'طريق الملك فهد',
      district: 'حي العليا',
      city: 'الرياض',
      region: 'منطقة الرياض',
      postalCode: '11564',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'طريق الملك فهد، حي العليا، الرياض',
    addressEn: 'King Fahd Road, Al Olaya, Riyadh',
    coordinates: { lat: 24.7136, lng: 46.6753 },
    mapUrl: 'https://maps.google.com/?q=24.7136,46.6753',
    googlePlaceId: 'ChIJAlMokhtabar-Main-Riyadh',

    phone: '+966112345678',
    whatsapp: '+966501234567',
    email: 'main.riyadh@mokhtabar.com',
    fax: '+966112345679',

    manager: {
      nameAr: 'أ. محمد بن سعد الحربي',
      nameEn: 'Mohammed bin Saad Al Harbi',
      title: 'مدير الفرع الرئيسي',
      phone: '+966509876543',
      email: 'm.harbi@mokhtabar.com',
      avatar: '/images/managers/m-harbi.jpg',
      since: '2018-03-01',
    },

    type: 'main',
    status: 'active',
    openingHours: hours24(),
    is24Hours: true,
    holidaySchedule: [
      { date: '2026-01-01', nameAr: 'رأس السنة الميلادية', closed: false, specialHours: '08:00 - 22:00' },
      { date: '2026-09-23', nameAr: 'اليوم الوطني', closed: false, specialHours: '08:00 - 22:00' },
      { date: '2026-03-30', nameAr: 'عيد الفطر المبارك', closed: true },
      { date: '2026-06-06', nameAr: 'عيد الأضحى المبارك', closed: true },
    ],

    capacity: { total: 60, current: 42, percentage: 70 },
    queueStatus: {
      waiting: 8,
      averageWait: '15 دقيقة',
      walkInAvailable: true,
      appointmentSlots: 25,
    },

    services: [
      ...COMMON_SERVICES,
      {
        id: 'svc-prenatal',
        nameAr: 'تحاليل الحمل',
        nameEn: 'Prenatal Analyses',
        icon: 'heart',
        description: 'فحوصات متابعة الحمل والجنين',
        available: true,
        requiresBooking: true,
        estimatedTime: 'ساعة',
      },
      {
        id: 'svc-allergy',
        nameAr: 'فحوصات الحساسية',
        nameEn: 'Allergy Testing',
        icon: 'wind',
        description: 'كشف أنواع الحساسية المختلفة',
        available: true,
        requiresBooking: true,
        estimatedTime: 'ساعتان',
      },
    ],
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Free T3', 'Free T4', 'Testosterone', 'Progesterone',
      'Vitamin D', 'Vitamin B12', 'Iron Studies', 'Calcium',
      'CRP', 'ESR', 'ANA', 'RF', 'HBsAg', 'Anti-HCV',
      'HIV', 'Urinalysis', 'Stool Analysis', 'Culture & Sensitivity',
      'Pregnancy Test (β-HCG)', 'AFP', 'PSA', 'Cortisol',
    ],
    specialServices: [
      'خدمة VIP', 'استشارة طبية', 'توصيل النتائج',
      'سحب عينات منزلي', 'فحص جيني متقدم',
    ],
    departments: [
      'التحاليل السريرية', 'الكيمياء الحيوية', 'المناعة',
      'الميكروبيولوجي', ' banking الدم', 'الهرمونات',
      'الوراثة', ' banking الدم المتقدمة',
    ],

    parking: { available: true, spots: 120, type: 'free', valet: true },
    accessibility: {
      wheelchair: true, ramp: true, elevator: true,
      handicappedParking: true, audioGuide: true,
    },
    amenities: [...AMENITIES_BASE, 'كافيه', 'معرض رقمي', 'خدمة ذكية'],

    images: [
      { id: 'img-main-ext', url: '/images/branches/main-exterior.jpg', alt: 'واجهة المعمل الرئيسي بالرياض', type: 'exterior', isPrimary: true },
      { id: 'img-main-int', url: '/images/branches/main-interior.jpg', alt: 'داخل المعمل الرئيسي', type: 'interior', isPrimary: false },
      { id: 'img-main-eq', url: '/images/branches/main-equipment.jpg', alt: 'أجهزة المعمل الرئيسي', type: 'equipment', isPrimary: false },
      { id: 'img-main-wt', url: '/images/branches/main-waiting.jpg', alt: 'منطقة الانتظار الرئيسية', type: 'waiting', isPrimary: false },
    ],
    virtualTourUrl: 'https://tour.mokhtabar.com/main-riyadh',
    coverImage: '/images/branches/main-cover.jpg',

    established: '2010-01-01',
    totalPatients: 458920,
    rating: 4.9,
    reviewCount: 12450,
    certifications: [...CERTIFICATIONS, 'JCI Accredited'],

    emergencyContact: { phone: '+966112345600', available24h: true },

    region: 'منطقة الرياض',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T10:30:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 2. Al Olaya Branch – Riyadh (Express)
  // -----------------------------------------------------------------------
  {
    id: 'br-olaya-riyadh',
    slug: 'olaya-riyadh',
    nameAr: 'فرع العليا – الرياض',
    nameEn: 'Al Olaya Branch – Riyadh',

    address: {
      street: 'شارع العليا',
      district: 'حي العليا',
      city: 'الرياض',
      region: 'منطقة الرياض',
      postalCode: '11524',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع العليا، حي العليا، الرياض',
    addressEn: 'Olaya Street, Al Olaya, Riyadh',
    coordinates: { lat: 24.6877, lng: 46.6853 },
    mapUrl: 'https://maps.google.com/?q=24.6877,46.6853',
    googlePlaceId: 'ChIJAlMokhtabar-Olaya-Riyadh',

    phone: '+966112345680',
    whatsapp: '+966501234568',
    email: 'olaya.riyadh@mokhtabar.com',

    manager: {
      nameAr: 'أ. نورة بنت فهد القحطاني',
      nameEn: 'Noura bint Fahd Al Qahtani',
      title: 'مديرة فرع العليا',
      phone: '+966509876544',
      email: 'n.qahtani@mokhtabar.com',
      avatar: '/images/managers/n-qahtani.jpg',
      since: '2020-06-15',
    },

    type: 'express',
    status: 'active',
    openingHours: makeHours('06:00', '22:00', '16:00', '22:00'),
    is24Hours: false,

    capacity: { total: 30, current: 18, percentage: 60 },
    queueStatus: {
      waiting: 4,
      averageWait: '10 دقائق',
      walkInAvailable: true,
      appointmentSlots: 15,
    },

    services: [...EXPRESS_SERVICES],
    availableTests: ['CBC', 'KFT', 'LFT', 'HbA1c', 'Fasting Glucose', 'Urinalysis', 'Pregnancy Test (β-HCG)'],
    specialServices: ['خدمة سريعة', 'نتيجة خلال ساعة'],
    departments: ['التحاليل السريرية', 'الكيمياء الحيوية'],

    parking: { available: true, spots: 30, type: 'paid' },
    accessibility: { wheelchair: true, ramp: true, elevator: false, handicappedParking: true, audioGuide: false },
    amenities: ['واي فاي', 'غرفة صلاة'],

    images: [
      { id: 'img-olaya-ext', url: '/images/branches/olaya-exterior.jpg', alt: 'واجهة فرع العليا', type: 'exterior', isPrimary: true },
      { id: 'img-olaya-int', url: '/images/branches/olaya-interior.jpg', alt: 'داخل فرع العليا', type: 'interior', isPrimary: false },
      { id: 'img-olaya-eq', url: '/images/branches/olaya-equipment.jpg', alt: 'أجهزة فرع العليا', type: 'equipment', isPrimary: false },
      { id: 'img-olaya-wt', url: '/images/branches/olaya-waiting.jpg', alt: 'منطقة الانتظار – فرع العليا', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/olaya-cover.jpg',

    established: '2020-08-01',
    totalPatients: 87340,
    rating: 4.7,
    reviewCount: 3420,
    certifications: ['معتمد من وزارة الصحة', 'ISO 15189'],

    emergencyContact: { phone: '+966112345681', available24h: false },

    region: 'منطقة الرياض',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T10:25:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 3. Jeddah – Al Hamra
  // -----------------------------------------------------------------------
  {
    id: 'br-jeddah',
    slug: 'jeddah-al-hamra',
    nameAr: 'فرع جدة – الحمراء',
    nameEn: 'Jeddah Branch – Al Hamra',

    address: {
      street: 'شارع الأمير سلطان',
      district: 'الحمراء',
      city: 'جدة',
      region: 'منطقة مكة المكرمة',
      postalCode: '31511',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع الأمير سلطان، حي الحمراء، جدة',
    addressEn: 'Prince Sultan Street, Al Hamra, Jeddah',
    coordinates: { lat: 21.5433, lng: 39.1728 },
    mapUrl: 'https://maps.google.com/?q=21.5433,39.1728',
    googlePlaceId: 'ChIJAlMokhtabar-Jeddah',

    phone: '+966122345678',
    whatsapp: '+966502234567',
    email: 'jeddah@mokhtabar.com',
    fax: '+966122345679',

    manager: {
      nameAr: 'أ. عبدالرحمن بن أحمد السبيعي',
      nameEn: 'Abdulrahman bin Ahmed Al Subaie',
      title: 'مدير فرع جدة',
      phone: '+966502234570',
      email: 'a.subaie@mokhtabar.com',
      avatar: '/images/managers/a-subaie.jpg',
      since: '2019-01-10',
    },

    type: 'branch',
    status: 'active',
    openingHours: makeHours('07:00', '23:00', '16:00', '23:00'),
    is24Hours: false,
    holidaySchedule: [
      { date: '2026-03-30', nameAr: 'عيد الفطر المبارك', closed: true },
      { date: '2026-06-06', nameAr: 'عيد الأضحى المبارك', closed: true },
    ],

    capacity: { total: 45, current: 30, percentage: 67 },
    queueStatus: {
      waiting: 6,
      averageWait: '12 دقيقة',
      walkInAvailable: true,
      appointmentSlots: 20,
    },

    services: COMMON_SERVICES.filter((s) => s.id !== 'svc-genetic' && s.id !== 'svc-neonatal'),
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Free T3', 'Free T4', 'Vitamin D', 'Vitamin B12', 'Iron Studies',
      'CRP', 'ESR', 'HBsAg', 'Anti-HCV', 'HIV', 'Urinalysis',
      'Culture & Sensitivity', 'PSA',
    ],
    specialServices: ['خدمة سريعة', 'توصيل النتائج بالبريد'],
    departments: [
      'التحاليل السريرية', 'الكيمياء الحيوية', 'المناعة',
      'الميكروبيولوجي', ' الهرمونات',
    ],

    parking: { available: true, spots: 60, type: 'free' },
    accessibility: { wheelchair: true, ramp: true, elevator: true, handicappedParking: true, audioGuide: false },
    amenities: [...AMENITIES_BASE, 'كافيه'],

    images: [
      { id: 'img-jed-ext', url: '/images/branches/jeddah-exterior.jpg', alt: 'واجهة فرع جدة', type: 'exterior', isPrimary: true },
      { id: 'img-jed-int', url: '/images/branches/jeddah-interior.jpg', alt: 'داخل فرع جدة', type: 'interior', isPrimary: false },
      { id: 'img-jed-eq', url: '/images/branches/jeddah-equipment.jpg', alt: 'أجهزة فرع جدة', type: 'equipment', isPrimary: false },
      { id: 'img-jed-wt', url: '/images/branches/jeddah-waiting.jpg', alt: 'منطقة الانتظار – فرع جدة', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/jeddah-cover.jpg',

    established: '2014-06-01',
    totalPatients: 312450,
    rating: 4.8,
    reviewCount: 8790,
    certifications: [...CERTIFICATIONS],

    emergencyContact: { phone: '+966122345680', available24h: true },

    region: 'منطقة مكة المكرمة',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T10:20:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 4. Dammam
  // -----------------------------------------------------------------------
  {
    id: 'br-dammam',
    slug: 'dammam',
    nameAr: 'فرع الدمام',
    nameEn: 'Dammam Branch',

    address: {
      street: 'شارع الأمير سلطان بن عبدالعزيز',
      district: 'حي الفيحاء',
      city: 'الدمام',
      region: 'المنطقة الشرقية',
      postalCode: '31411',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع الأمير سلطان بن عبدالعزيز، حي الفيحاء، الدمام',
    addressEn: 'Prince Sultan bin Abdulaziz St, Al Faisaliah, Dammam',
    coordinates: { lat: 26.4207, lng: 50.0888 },
    mapUrl: 'https://maps.google.com/?q=26.4207,50.0888',
    googlePlaceId: 'ChIJAlMokhtabar-Dammam',

    phone: '+966132345678',
    whatsapp: '+966503234567',
    email: 'dammam@mokhtabar.com',

    manager: {
      nameAr: 'أ. فهد بن خالد العنزي',
      nameEn: 'Fahd bin Khalid Al Enzi',
      title: 'مدير فرع الدمام',
      phone: '+966503234570',
      email: 'f.anzi@mokhtabar.com',
      avatar: '/images/managers/f-anzi.jpg',
      since: '2017-09-01',
    },

    type: 'branch',
    status: 'active',
    openingHours: makeHours('07:00', '23:00', '16:00', '23:00'),
    is24Hours: false,

    capacity: { total: 40, current: 22, percentage: 55 },
    queueStatus: {
      waiting: 3,
      averageWait: '10 دقائق',
      walkInAvailable: true,
      appointmentSlots: 18,
    },

    services: COMMON_SERVICES.filter((s) => s.id !== 'svc-genetic'),
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Free T3', 'Free T4', 'Testosterone', 'Vitamin D',
      'Vitamin B12', 'Iron Studies', 'CRP', 'ESR', 'ANA',
      'HBsAg', 'Anti-HCV', 'HIV', 'Urinalysis', 'Culture & Sensitivity',
      'PSA', 'Cortisol',
    ],
    specialServices: ['خدمة عائلية', 'حجز أونلاين'],
    departments: [
      'التحاليل السريرية', 'الكيمياء الحيوية', 'المناعة',
      'الميكروبيولوجي', ' banking الدم', 'الهرمونات',
    ],

    parking: { available: true, spots: 50, type: 'free' },
    accessibility: { wheelchair: true, ramp: true, elevator: true, handicappedParking: true, audioGuide: false },
    amenities: [...AMENITIES_BASE, 'كافيه', 'شاشة معلومات'],

    images: [
      { id: 'img-dam-ext', url: '/images/branches/dammam-exterior.jpg', alt: 'واجهة فرع الدمام', type: 'exterior', isPrimary: true },
      { id: 'img-dam-int', url: '/images/branches/dammam-interior.jpg', alt: 'داخل فرع الدمام', type: 'interior', isPrimary: false },
      { id: 'img-dam-eq', url: '/images/branches/dammam-equipment.jpg', alt: 'أجهزة فرع الدمام', type: 'equipment', isPrimary: false },
      { id: 'img-dam-wt', url: '/images/branches/dammam-waiting.jpg', alt: 'منطقة الانتظار – فرع الدمام', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/dammam-cover.jpg',

    established: '2016-02-01',
    totalPatients: 198760,
    rating: 4.7,
    reviewCount: 5890,
    certifications: [...CERTIFICATIONS],

    emergencyContact: { phone: '+966132345680', available24h: true },

    region: 'المنطقة الشرقية',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T10:15:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 5. Mecca
  // -----------------------------------------------------------------------
  {
    id: 'br-mecca',
    slug: 'mecca',
    nameAr: 'فرع مكة المكرمة',
    nameEn: 'Mecca Branch',

    address: {
      street: 'شارع المسجد الحرام',
      district: 'حي العزيزية',
      city: 'مكة المكرمة',
      region: 'منطقة مكة المكرمة',
      postalCode: '24231',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع المسجد الحرام، حي العزيزية، مكة المكرمة',
    addressEn: 'Al Masjid Al Haram St, Al Aziziyah, Mecca',
    coordinates: { lat: 21.3891, lng: 39.8579 },
    mapUrl: 'https://maps.google.com/?q=21.3891,39.8579',
    googlePlaceId: 'ChIJAlMokhtabar-Mecca',

    phone: '+966122345682',
    whatsapp: '+966504234567',
    email: 'mecca@mokhtabar.com',

    manager: {
      nameAr: 'أ. عبدالعزيز بن محمد المطيري',
      nameEn: 'Abdulaziz bin Mohammed Al Mutairi',
      title: 'مدير فرع مكة المكرمة',
      phone: '+966504234570',
      email: 'az.mutairi@mokhtabar.com',
      avatar: '/images/managers/az-mutairi.jpg',
      since: '2019-07-01',
    },

    type: 'branch',
    status: 'active',
    openingHours: makeHours('06:30', '23:30', '16:00', '23:30'),
    is24Hours: false,
    holidaySchedule: [
      { date: '2026-03-30', nameAr: 'عيد الفطر المبارك', closed: true },
      { date: '2026-06-06', nameAr: 'عيد الأضحى المبارك', closed: true },
      { date: '2026-05-04', nameAr: 'موسم الحج – يوم التروية', closed: true },
      { date: '2026-05-05', nameAr: 'يوم عرفة', closed: true },
      { date: '2026-05-06', nameAr: 'أول أيام عيد الأضحى (الحج)', closed: true },
      { date: '2026-05-07', nameAr: 'ثاني أيام الحج', closed: false, specialHours: '05:00 - 23:00' },
    ],

    capacity: { total: 35, current: 20, percentage: 57 },
    queueStatus: {
      waiting: 2,
      averageWait: '8 دقائق',
      walkInAvailable: true,
      appointmentSlots: 15,
    },

    services: COMMON_SERVICES.filter((s) => s.id !== 'svc-genetic' && s.id !== 'svc-allergy'),
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Vitamin D', 'CRP', 'ESR', 'HBsAg', 'Anti-HCV',
      'HIV', 'Urinalysis', 'Culture & Sensitivity',
      'Pregnancy Test (β-HCG)',
    ],
    specialServices: ['خدمة الحجاج', 'ترجمة النتائج', 'خدمة متعددة اللغات'],
    departments: [
      'التحاليل السريرية', 'الكيمياء الحيوية', 'الميكروبيولوجي',
      'banking الدم',
    ],

    parking: { available: true, spots: 40, type: 'paid' },
    accessibility: { wheelchair: true, ramp: true, elevator: true, handicappedParking: true, audioGuide: false },
    amenities: [...AMENITIES_BASE, 'صالة متعددة اللغات'],

    images: [
      { id: 'img-mek-ext', url: '/images/branches/mecca-exterior.jpg', alt: 'واجهة فرع مكة المكرمة', type: 'exterior', isPrimary: true },
      { id: 'img-mek-int', url: '/images/branches/mecca-interior.jpg', alt: 'داخل فرع مكة المكرمة', type: 'interior', isPrimary: false },
      { id: 'img-mek-eq', url: '/images/branches/mecca-equipment.jpg', alt: 'أجهزة فرع مكة المكرمة', type: 'equipment', isPrimary: false },
      { id: 'img-mek-wt', url: '/images/branches/mecca-waiting.jpg', alt: 'منطقة الانتظار – فرع مكة المكرمة', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/mecca-cover.jpg',

    established: '2018-01-15',
    totalPatients: 176540,
    rating: 4.6,
    reviewCount: 4320,
    certifications: [...CERTIFICATIONS],

    emergencyContact: { phone: '+966122345683', available24h: true },

    region: 'منطقة مكة المكرمة',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T10:10:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 6. Medina
  // -----------------------------------------------------------------------
  {
    id: 'br-medina',
    slug: 'medina',
    nameAr: 'فرع المدينة المنورة',
    nameEn: 'Medina Branch',

    address: {
      street: 'شارع سيد الشهداء',
      district: 'حي قباء',
      city: 'المدينة المنورة',
      region: 'منطقة المدينة المنورة',
      postalCode: '42311',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع سيد الشهداء، حي قباء، المدينة المنورة',
    addressEn: 'Sayed Al Shuhada St, Quba, Medina',
    coordinates: { lat: 24.4672, lng: 39.6112 },
    mapUrl: 'https://maps.google.com/?q=24.4672,39.6112',
    googlePlaceId: 'ChIJAlMokhtabar-Medina',

    phone: '+966142345678',
    whatsapp: '+966505234567',
    email: 'medina@mokhtabar.com',

    manager: {
      nameAr: 'أ. سعد بن عبدالله الهاجري',
      nameEn: 'Saad bin Abdullah Al Hajri',
      title: 'مدير فرع المدينة المنورة',
      phone: '+966505234570',
      email: 's.hajri@mokhtabar.com',
      avatar: '/images/managers/s-hajri.jpg',
      since: '2019-11-01',
    },

    type: 'branch',
    status: 'active',
    openingHours: makeHours('07:00', '23:00', '16:30', '23:00'),
    is24Hours: false,

    capacity: { total: 35, current: 15, percentage: 43 },
    queueStatus: {
      waiting: 1,
      averageWait: '5 دقائق',
      walkInAvailable: true,
      appointmentSlots: 18,
    },

    services: COMMON_SERVICES.filter((s) => s.id !== 'svc-genetic' && s.id !== 'svc-allergy'),
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Vitamin D', 'Vitamin B12', 'CRP', 'ESR',
      'HBsAg', 'Anti-HCV', 'HIV', 'Urinalysis', 'Culture & Sensitivity',
      'PSA',
    ],
    specialServices: ['خدمة الحجاج والمعتمرين', 'ترجمة النتائج بالإنجليزية'],
    departments: [
      'التحاليل السريرية', 'الكيمياء الحيوية', 'الميكروبيولوجي',
      ' banking الدم',
    ],

    parking: { available: true, spots: 35, type: 'free' },
    accessibility: { wheelchair: true, ramp: true, elevator: false, handicappedParking: true, audioGuide: false },
    amenities: [...AMENITIES_BASE],

    images: [
      { id: 'img-med-ext', url: '/images/branches/medina-exterior.jpg', alt: 'واجهة فرع المدينة المنورة', type: 'exterior', isPrimary: true },
      { id: 'img-med-int', url: '/images/branches/medina-interior.jpg', alt: 'داخل فرع المدينة المنورة', type: 'interior', isPrimary: false },
      { id: 'img-med-eq', url: '/images/branches/medina-equipment.jpg', alt: 'أجهزة فرع المدينة المنورة', type: 'equipment', isPrimary: false },
      { id: 'img-med-wt', url: '/images/branches/medina-waiting.jpg', alt: 'منطقة الانتظار – فرع المدينة المنورة', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/medina-cover.jpg',

    established: '2020-03-01',
    totalPatients: 98230,
    rating: 4.6,
    reviewCount: 2890,
    certifications: ['معتمد من وزارة الصحة', 'ISO 15189'],

    emergencyContact: { phone: '+966142345680', available24h: true },

    region: 'منطقة المدينة المنورة',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T10:05:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 7. Al Khobar
  // -----------------------------------------------------------------------
  {
    id: 'br-khobar',
    slug: 'al-khobar',
    nameAr: 'فرع الخبر',
    nameEn: 'Al Khobar Branch',

    address: {
      street: 'شارع الأمير سلطان بن عبدالعزيز',
      district: 'الفيصلية',
      city: 'الخبر',
      region: 'المنطقة الشرقية',
      postalCode: '31952',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع الأمير سلطان بن عبدالعزيز، حي الفيصلية، الخبر',
    addressEn: 'Prince Sultan bin Abdulaziz St, Al Faisaliah, Al Khobar',
    coordinates: { lat: 26.2172, lng: 50.1971 },
    mapUrl: 'https://maps.google.com/?q=26.2172,50.1971',
    googlePlaceId: 'ChIJAlMokhtabar-Khobar',

    phone: '+966132345684',
    whatsapp: '+966506234567',
    email: 'khobar@mokhtabar.com',

    manager: {
      nameAr: 'أ. خالد بن عبدالعزيز الشمري',
      nameEn: 'Khalid bin Abdulaziz Al Shammari',
      title: 'مدير فرع الخبر',
      phone: '+966506234570',
      email: 'k.shammari@mokhtabar.com',
      avatar: '/images/managers/k-shammari.jpg',
      since: '2020-02-15',
    },

    type: 'branch',
    status: 'active',
    openingHours: makeHours('07:00', '22:00', '16:00', '22:00'),
    is24Hours: false,

    capacity: { total: 35, current: 20, percentage: 57 },
    queueStatus: {
      waiting: 3,
      averageWait: '10 دقائق',
      walkInAvailable: true,
      appointmentSlots: 15,
    },

    services: COMMON_SERVICES.filter((s) => s.id !== 'svc-genetic' && s.id !== 'svc-neonatal'),
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Free T3', 'Free T4', 'Vitamin D', 'Iron Studies',
      'CRP', 'ESR', 'HBsAg', 'Anti-HCV', 'HIV', 'Urinalysis',
      'Culture & Sensitivity',
    ],
    specialServices: ['خدمة عائلية', 'نتائج سريعة'],
    departments: [
      'التحاليل السريرية', 'الكيمياء الحيوية', 'الميكروبيولوجي',
    ],

    parking: { available: true, spots: 35, type: 'free' },
    accessibility: { wheelchair: true, ramp: true, elevator: false, handicappedParking: true, audioGuide: false },
    amenities: [...AMENITIES_BASE, 'كافيه'],

    images: [
      { id: 'img-kho-ext', url: '/images/branches/khobar-exterior.jpg', alt: 'واجهة فرع الخبر', type: 'exterior', isPrimary: true },
      { id: 'img-kho-int', url: '/images/branches/khobar-interior.jpg', alt: 'داخل فرع الخبر', type: 'interior', isPrimary: false },
      { id: 'img-kho-eq', url: '/images/branches/khobar-equipment.jpg', alt: 'أجهزة فرع الخبر', type: 'equipment', isPrimary: false },
      { id: 'img-kho-wt', url: '/images/branches/khobar-waiting.jpg', alt: 'منطقة الانتظار – فرع الخبر', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/khobar-cover.jpg',

    established: '2021-01-10',
    totalPatients: 76540,
    rating: 4.5,
    reviewCount: 2130,
    certifications: ['معتمد من وزارة الصحة', 'ISO 15189'],

    emergencyContact: { phone: '+966132345685', available24h: true },

    region: 'المنطقة الشرقية',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T10:00:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 8. Abha
  // -----------------------------------------------------------------------
  {
    id: 'br-abha',
    slug: 'abha',
    nameAr: 'فرع أبها',
    nameEn: 'Abha Branch',

    address: {
      street: 'شارع الملك عبدالعزيز',
      district: 'حي العارض',
      city: 'أبها',
      region: 'منطقة عسير',
      postalCode: '62521',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع الملك عبدالعزيز، حي العارض، أبها',
    addressEn: 'King Abdulaziz St, Al Aridh, Abha',
    coordinates: { lat: 18.2164, lng: 42.5053 },
    mapUrl: 'https://maps.google.com/?q=18.2164,42.5053',
    googlePlaceId: 'ChIJAlMokhtabar-Abha',

    phone: '+966172345678',
    whatsapp: '+966507234567',
    email: 'abha@mokhtabar.com',

    manager: {
      nameAr: 'أ. منال بنت عبدالرحمن الحربي',
      nameEn: 'Manal bint Abdulrahman Al Harbi',
      title: 'مديرة فرع أبها',
      phone: '+966507234570',
      email: 'm.harbi2@mokhtabar.com',
      avatar: '/images/managers/m-harbi2.jpg',
      since: '2021-05-01',
    },

    type: 'branch',
    status: 'active',
    openingHours: makeHours('07:00', '22:00', '16:00', '22:00'),
    is24Hours: false,

    capacity: { total: 25, current: 10, percentage: 40 },
    queueStatus: {
      waiting: 0,
      averageWait: '5 دقائق',
      walkInAvailable: true,
      appointmentSlots: 12,
    },

    services: COMMON_SERVICES.filter(
      (s) =>
        s.id !== 'svc-genetic' &&
        s.id !== 'svc-allergy' &&
        s.id !== 'svc-neonatal',
    ),
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Vitamin D', 'CRP', 'ESR', 'HBsAg', 'Anti-HCV',
      'Urinalysis',
    ],
    specialServices: ['خدمة شاملة'],
    departments: ['التحاليل السريرية', 'الكيمياء الحيوية'],

    parking: { available: true, spots: 25, type: 'free' },
    accessibility: { wheelchair: true, ramp: true, elevator: false, handicappedParking: true, audioGuide: false },
    amenities: ['واي فاي', 'غرفة صلاة'],

    images: [
      { id: 'img-abh-ext', url: '/images/branches/abha-exterior.jpg', alt: 'واجهة فرع أبها', type: 'exterior', isPrimary: true },
      { id: 'img-abh-int', url: '/images/branches/abha-interior.jpg', alt: 'داخل فرع أبها', type: 'interior', isPrimary: false },
      { id: 'img-abh-eq', url: '/images/branches/abha-equipment.jpg', alt: 'أجهزة فرع أبها', type: 'equipment', isPrimary: false },
      { id: 'img-abh-wt', url: '/images/branches/abha-waiting.jpg', alt: 'منطقة الانتظار – فرع أبها', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/abha-cover.jpg',

    established: '2021-06-01',
    totalPatients: 42310,
    rating: 4.4,
    reviewCount: 1560,
    certifications: ['معتمد من وزارة الصحة'],

    emergencyContact: { phone: '+966172345680', available24h: false },

    region: 'منطقة عسير',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T09:55:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 9. Tabuk (Express)
  // -----------------------------------------------------------------------
  {
    id: 'br-tabuk',
    slug: 'tabuk',
    nameAr: 'فرع تبوك',
    nameEn: 'Tabuk Branch',

    address: {
      street: 'شارع الملك عبدالعزيز',
      district: 'حي الشفا',
      city: 'تبوك',
      region: 'منطقة تبوك',
      postalCode: '47511',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع الملك عبدالعزيز، حي الشفا، تبوك',
    addressEn: 'King Abdulaziz St, Al Shifa, Tabuk',
    coordinates: { lat: 28.3838, lng: 36.5550 },
    mapUrl: 'https://maps.google.com/?q=28.3838,36.5550',
    googlePlaceId: 'ChIJAlMokhtabar-Tabuk',

    phone: '+966142345686',
    whatsapp: '+966508234567',
    email: 'tabuk@mokhtabar.com',

    manager: {
      nameAr: 'أ. عبدالرحمن بن ناصر العمري',
      nameEn: 'Abdulrahman bin Nasser Al Omari',
      title: 'مدير فرع تبوك',
      phone: '+966508234570',
      email: 'ar.omari@mokhtabar.com',
      avatar: '/images/managers/ar-omari.jpg',
      since: '2022-03-01',
    },

    type: 'express',
    status: 'active',
    openingHours: makeHours('08:00', '22:00', '16:00', '22:00'),
    is24Hours: false,

    capacity: { total: 20, current: 8, percentage: 40 },
    queueStatus: {
      waiting: 0,
      averageWait: '5 دقائق',
      walkInAvailable: true,
      appointmentSlots: 10,
    },

    services: EXPRESS_SERVICES,
    availableTests: ['CBC', 'KFT', 'LFT', 'HbA1c', 'Fasting Glucose', 'Urinalysis', 'Pregnancy Test (β-HCG)'],
    specialServices: ['خدمة سريعة', 'نتيجة خلال ساعة'],
    departments: ['التحاليل السريرية', 'الكيمياء الحيوية'],

    parking: { available: true, spots: 20, type: 'free' },
    accessibility: { wheelchair: true, ramp: true, elevator: false, handicappedParking: true, audioGuide: false },
    amenities: ['واي فاي', 'غرفة صلاة'],

    images: [
      { id: 'img-tab-ext', url: '/images/branches/tabuk-exterior.jpg', alt: 'واجهة فرع تبوك', type: 'exterior', isPrimary: true },
      { id: 'img-tab-int', url: '/images/branches/tabuk-interior.jpg', alt: 'داخل فرع تبوك', type: 'interior', isPrimary: false },
      { id: 'img-tab-eq', url: '/images/branches/tabuk-equipment.jpg', alt: 'أجهزة فرع تبوك', type: 'equipment', isPrimary: false },
      { id: 'img-tab-wt', url: '/images/branches/tabuk-waiting.jpg', alt: 'منطقة الانتظار – فرع تبوك', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/tabuk-cover.jpg',

    established: '2022-04-01',
    totalPatients: 23450,
    rating: 4.3,
    reviewCount: 870,
    certifications: ['معتمد من وزارة الصحة'],

    emergencyContact: { phone: '+966142345687', available24h: false },

    region: 'منطقة تبوك',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T09:50:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 10. Jubail – Specialty (Industrial Zone)
  // -----------------------------------------------------------------------
  {
    id: 'br-jubail',
    slug: 'jubail',
    nameAr: 'فرع الجبيل',
    nameEn: 'Jubail Branch',

    address: {
      street: 'شارع الملك عبدالله بن عبدالعزيز',
      district: 'المنطقة الصناعية',
      city: 'الجبيل',
      region: 'المنطقة الشرقية',
      postalCode: '31961',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع الملك عبدالله بن عبدالعزيز، المنطقة الصناعية، الجبيل',
    addressEn: 'King Abdullah bin Abdulaziz St, Industrial Area, Jubail',
    coordinates: { lat: 27.0046, lng: 49.6225 },
    mapUrl: 'https://maps.google.com/?q=27.0046,49.6225',
    googlePlaceId: 'ChIJAlMokhtabar-Jubail',

    phone: '+966132345688',
    whatsapp: '+966509234567',
    email: 'jubail@mokhtabar.com',

    manager: {
      nameAr: 'أ. ياسر بن ماجد الدوسري',
      nameEn: 'Yasser bin Majed Al Dosari',
      title: 'مدير فرع الجبيل',
      phone: '+966509234570',
      email: 'y.dosari@mokhtabar.com',
      avatar: '/images/managers/y-dosari.jpg',
      since: '2020-09-01',
    },

    type: 'specialty',
    status: 'active',
    openingHours: makeHours('06:00', '22:00', '16:00', '22:00'),
    is24Hours: false,

    capacity: { total: 30, current: 12, percentage: 40 },
    queueStatus: {
      waiting: 1,
      averageWait: '5 دقائق',
      walkInAvailable: true,
      appointmentSlots: 15,
    },

    services: [
      ...COMMON_SERVICES.filter(
        (s) => s.id !== 'svc-allergy' && s.id !== 'svc-neonatal',
      ),
      {
        id: 'svc-occupational',
        nameAr: 'فحوصات مهنية',
        nameEn: 'Occupational Health',
        icon: 'briefcase',
        description: 'فحوصات طبية مهنية للعاملين في القطاع الصناعي',
        available: true,
        requiresBooking: true,
        estimatedTime: 'ساعتان',
      },
    ],
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Vitamin D', 'Iron Studies', 'CRP', 'ESR',
      'HBsAg', 'Anti-HCV', 'HIV', 'Urinalysis',
      'Culture & Sensitivity', 'Lead Level', 'Liver Function Panel',
      'Pulmonary Function Test',
    ],
    specialServices: ['فحوصات مهنية', 'خدمات الشركات', 'حزم صحية للشركات'],
    departments: [
      'التحاليل السريرية', 'الكيمياء الحيوية', 'الميكروبيولوجي',
      'banking الدم', 'banking الدم المتقدمة',
    ],

    parking: { available: true, spots: 40, type: 'free' },
    accessibility: { wheelchair: true, ramp: true, elevator: false, handicappedParking: true, audioGuide: false },
    amenities: [...AMENITIES_BASE, 'صالة اجتماعات'],

    images: [
      { id: 'img-jub-ext', url: '/images/branches/jubail-exterior.jpg', alt: 'واجهة فرع الجبيل', type: 'exterior', isPrimary: true },
      { id: 'img-jub-int', url: '/images/branches/jubail-interior.jpg', alt: 'داخل فرع الجبيل', type: 'interior', isPrimary: false },
      { id: 'img-jub-eq', url: '/images/branches/jubail-equipment.jpg', alt: 'أجهزة فرع الجبيل', type: 'equipment', isPrimary: false },
      { id: 'img-jub-wt', url: '/images/branches/jubail-waiting.jpg', alt: 'منطقة الانتظار – فرع الجبيل', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/jubail-cover.jpg',

    established: '2019-06-01',
    totalPatients: 67890,
    rating: 4.6,
    reviewCount: 2100,
    certifications: [...CERTIFICATIONS],

    emergencyContact: { phone: '+966132345689', available24h: true },

    region: 'المنطقة الشرقية',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T09:45:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 11. NEOM – Coming Soon (Smart Lab)
  // -----------------------------------------------------------------------
  {
    id: 'br-neom',
    slug: 'neom',
    nameAr: 'فرع نيوم',
    nameEn: 'NEOM Branch',

    address: {
      street: 'نيوم – منطقة نيوم',
      district: 'المرجع',
      city: 'المرجع',
      region: 'منطقة تبوك',
      postalCode: '47512',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'نيوم – منطقة المرجع، منطقة تبوك',
    addressEn: 'NEOM – Magna, Tabuk Region',
    coordinates: { lat: 27.9507, lng: 35.5827 },
    mapUrl: 'https://maps.google.com/?q=27.9507,35.5827',

    phone: '+966142345690',
    whatsapp: '+966511234567',
    email: 'neom@mokhtabar.com',

    manager: {
      nameAr: 'د. عائشة بنت فهد الراشد',
      nameEn: 'Dr. Aisha bint Fahd Al Rashid',
      title: 'مديرة فرع نيوم – مختبر المستقبل',
      phone: '+966511234570',
      email: 'a.rashid@mokhtabar.com',
      avatar: '/images/managers/a-rashid.jpg',
      since: '2025-01-01',
    },

    type: 'branch',
    status: 'coming-soon',
    openingHours: makeHours('08:00', '22:00', '16:00', '22:00'),
    is24Hours: false,

    capacity: { total: 50, current: 0, percentage: 0 },
    queueStatus: {
      waiting: 0,
      averageWait: 'قريباً',
      walkInAvailable: false,
      appointmentSlots: 0,
    },

    services: [
      ...COMMON_SERVICES,
      {
        id: 'svc-ai-diagnosis',
        nameAr: 'تشخيص بالذكاء الاصطناعي',
        nameEn: 'AI-Assisted Diagnosis',
        icon: 'cpu',
        description: 'نظام تشخيص متقدم بالذكاء الاصطناعي',
        available: false,
        requiresBooking: true,
        estimatedTime: 'ساعتان',
      },
      {
        id: 'svc-genomic',
        nameAr: 'الطب الجينومي',
        nameEn: 'Genomic Medicine',
        icon: 'dna',
        description: 'تحليل جينومي كامل للتشخيص الدقيق',
        available: false,
        requiresBooking: true,
        estimatedTime: 'أسبوع',
      },
    ],
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Free T3', 'Free T4', 'Testosterone', 'Progesterone',
      'Vitamin D', 'Vitamin B12', 'Iron Studies', 'Calcium',
      'CRP', 'ESR', 'ANA', 'RF', 'HBsAg', 'Anti-HCV',
      'HIV', 'Urinalysis', 'Stool Analysis', 'Culture & Sensitivity',
      'Prenatal Tests', 'Full Genomic Sequencing',
    ],
    specialServices: [
      'مختبر ذكي بالكامل', 'نتائج فورية بالذكاء الاصطناعي',
      'خدمة بدون اتصال', 'روبوت أخذ العينات',
    ],
    departments: [
      'التحاليل السريرية', 'الكيمياء الحيوية', 'المناعة',
      'الميكروبيولوجي', 'banking الدم', 'الهرمونات',
      'الوراثة', 'banking الدم المتقدمة', 'الطب الجينومي',
    ],

    parking: { available: true, spots: 80, type: 'free', valet: true },
    accessibility: { wheelchair: true, ramp: true, elevator: true, handicappedParking: true, audioGuide: true },
    amenities: ['واي فاي', 'غرفة صلاة', 'منطقة ألعاب أطفال', 'مساحات خضراء'],

    images: [
      { id: 'img-neom-ext', url: '/images/branches/neom-exterior.jpg', alt: 'تصميم فرع نيوم', type: 'exterior', isPrimary: true },
      { id: 'img-neom-int', url: '/images/branches/neom-interior.jpg', alt: 'تصور داخلي لفرع نيوم', type: 'interior', isPrimary: false },
      { id: 'img-neom-eq', url: '/images/branches/neom-equipment.jpg', alt: 'أجهزة المختبر الذكي – نيوم', type: 'equipment', isPrimary: false },
      { id: 'img-neom-wt', url: '/images/branches/neom-waiting.jpg', alt: 'منطقة الانتظار – نيوم', type: 'waiting', isPrimary: false },
    ],
    virtualTourUrl: 'https://tour.mokhtabar.com/neom',
    coverImage: '/images/branches/neom-cover.jpg',

    established: '2026-12-01',
    totalPatients: 0,
    rating: 0,
    reviewCount: 0,
    certifications: ['معتمد من وزارة الصحة', 'ISO 15189', 'CAP Accredited'],

    emergencyContact: { phone: '+966142345691', available24h: false },

    region: 'منطقة تبوك',
    timezone: 'Asia/Riyadh',
    syncStatus: 'offline',
    lastSynced: '2026-07-01T00:00:00Z',
    realtimeEnabled: false,
  },

  // -----------------------------------------------------------------------
  // 12. Riyadh – Al Nahda (Express)
  // -----------------------------------------------------------------------
  {
    id: 'br-nahda-riyadh',
    slug: 'nahda-riyadh',
    nameAr: 'فرع الرياض – حي النزهة',
    nameEn: 'Riyadh Branch – Al Nahda',

    address: {
      street: 'شارع الأمير سلطان بن عبدالعزيز',
      district: 'حي النزهة',
      city: 'الرياض',
      region: 'منطقة الرياض',
      postalCode: '14240',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع الأمير سلطان بن عبدالعزيز، حي النزهة، الرياض',
    addressEn: 'Prince Sultan bin Abdulaziz St, Al Nahda, Riyadh',
    coordinates: { lat: 24.7264, lng: 46.7049 },
    mapUrl: 'https://maps.google.com/?q=24.7264,46.7049',
    googlePlaceId: 'ChIJAlMokhtabar-Nahda-Riyadh',

    phone: '+966112345692',
    whatsapp: '+966512234567',
    email: 'nahda.riyadh@mokhtabar.com',

    manager: {
      nameAr: 'أ. ماجد بن سالم العتيبي',
      nameEn: 'Majed bin Saim Al Otaibi',
      title: 'مدير فرع النزهة',
      phone: '+966512234570',
      email: 'm.otaibi@mokhtabar.com',
      avatar: '/images/managers/m-otaibi.jpg',
      since: '2022-09-01',
    },

    type: 'express',
    status: 'active',
    openingHours: makeHours('06:00', '22:00', '16:00', '22:00'),
    is24Hours: false,

    capacity: { total: 25, current: 12, percentage: 48 },
    queueStatus: {
      waiting: 2,
      averageWait: '8 دقائق',
      walkInAvailable: true,
      appointmentSlots: 12,
    },

    services: EXPRESS_SERVICES,
    availableTests: ['CBC', 'KFT', 'LFT', 'HbA1c', 'Fasting Glucose', 'Urinalysis', 'Pregnancy Test (β-HCG)'],
    specialServices: ['خدمة سريعة', 'نتيجة خلال ساعة', 'حجز أونلاين'],
    departments: ['التحاليل السريرية', 'الكيمياء الحيوية'],

    parking: { available: true, spots: 25, type: 'free' },
    accessibility: { wheelchair: true, ramp: true, elevator: false, handicappedParking: true, audioGuide: false },
    amenities: ['واي فاي', 'غرفة صلاة'],

    images: [
      { id: 'img-nah-ext', url: '/images/branches/nahda-exterior.jpg', alt: 'واجهة فرع النزهة', type: 'exterior', isPrimary: true },
      { id: 'img-nah-int', url: '/images/branches/nahda-interior.jpg', alt: 'داخل فرع النزهة', type: 'interior', isPrimary: false },
      { id: 'img-nah-eq', url: '/images/branches/nahda-equipment.jpg', alt: 'أجهزة فرع النزهة', type: 'equipment', isPrimary: false },
      { id: 'img-nah-wt', url: '/images/branches/nahda-waiting.jpg', alt: 'منطقة الانتظار – فرع النزهة', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/nahda-cover.jpg',

    established: '2022-10-01',
    totalPatients: 34560,
    rating: 4.5,
    reviewCount: 1230,
    certifications: ['معتمد من وزارة الصحة'],

    emergencyContact: { phone: '+966112345693', available24h: false },

    region: 'منطقة الرياض',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T10:28:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 13. Jeddah – Al Rawda (Additional branch)
  // -----------------------------------------------------------------------
  {
    id: 'br-jeddah-rawda',
    slug: 'jeddah-al-rawda',
    nameAr: 'فرع جدة – الروضة',
    nameEn: 'Jeddah Branch – Al Rawda',

    address: {
      street: 'شارع فلسطين',
      district: 'حي الروضة',
      city: 'جدة',
      region: 'منطقة مكة المكرمة',
      postalCode: '21411',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'شارع فلسطين، حي الروضة، جدة',
    addressEn: 'Falasteen St, Al Rawda, Jeddah',
    coordinates: { lat: 21.6045, lng: 39.1335 },
    mapUrl: 'https://maps.google.com/?q=21.6045,39.1335',
    googlePlaceId: 'ChIJAlMokhtabar-JeddahRawda',

    phone: '+966122345694',
    whatsapp: '+966513234567',
    email: 'rawda.jeddah@mokhtabar.com',

    manager: {
      nameAr: 'أ. هند بنت محمد الزهراني',
      nameEn: 'Hind bint Mohammed Al Zahrani',
      title: 'مديرة فرع الروضة',
      phone: '+966513234570',
      email: 'h.zahrani@mokhtabar.com',
      avatar: '/images/managers/h-zahrani.jpg',
      since: '2021-11-01',
    },

    type: 'branch',
    status: 'active',
    openingHours: makeHours('07:00', '23:00', '16:00', '23:00'),
    is24Hours: false,

    capacity: { total: 35, current: 25, percentage: 71 },
    queueStatus: {
      waiting: 5,
      averageWait: '12 دقيقة',
      walkInAvailable: true,
      appointmentSlots: 15,
    },

    services: COMMON_SERVICES.filter((s) => s.id !== 'svc-genetic'),
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Free T3', 'Free T4', 'Vitamin D', 'Vitamin B12',
      'Iron Studies', 'CRP', 'ESR', 'ANA', 'HBsAg', 'Anti-HCV',
      'HIV', 'Urinalysis', 'Culture & Sensitivity', 'PSA',
      'Cortisol',
    ],
    specialServices: ['خدمة سريعة', 'توصيل النتائج', 'حجز أونلاين'],
    departments: [
      'التحاليل السريرية', 'الكيمياء الحيوية', 'المناعة',
      'الميكروبيولوجي', 'الهرمونات',
    ],

    parking: { available: true, spots: 40, type: 'both' },
    accessibility: { wheelchair: true, ramp: true, elevator: true, handicappedParking: true, audioGuide: false },
    amenities: [...AMENITIES_BASE, 'كافيه', 'شاشة معلومات'],

    images: [
      { id: 'img-raw-ext', url: '/images/branches/rawda-exterior.jpg', alt: 'واجهة فرع الروضة بجدة', type: 'exterior', isPrimary: true },
      { id: 'img-raw-int', url: '/images/branches/rawda-interior.jpg', alt: 'داخل فرع الروضة بجدة', type: 'interior', isPrimary: false },
      { id: 'img-raw-eq', url: '/images/branches/rawda-equipment.jpg', alt: 'أجهزة فرع الروضة بجدة', type: 'equipment', isPrimary: false },
      { id: 'img-raw-wt', url: '/images/branches/rawda-waiting.jpg', alt: 'منطقة الانتظار – فرع الروضة بجدة', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/rawda-cover.jpg',

    established: '2021-12-15',
    totalPatients: 102340,
    rating: 4.7,
    reviewCount: 3560,
    certifications: [...CERTIFICATIONS],

    emergencyContact: { phone: '+966122345695', available24h: true },

    region: 'منطقة مكة المكرمة',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T10:22:00Z',
    realtimeEnabled: true,
  },

  // -----------------------------------------------------------------------
  // 14. Riyadh – Al Sahafa
  // -----------------------------------------------------------------------
  {
    id: 'br-sahafa-riyadh',
    slug: 'sahafa-riyadh',
    nameAr: 'فرع الرياض – حي الصحافة',
    nameEn: 'Riyadh Branch – Al Sahafa',

    address: {
      street: 'طريق الأمير سلطان بن عبدالعزيز',
      district: 'حي الصحافة',
      city: 'الرياض',
      region: 'منطقة الرياض',
      postalCode: '13315',
      country: 'المملكة العربية السعودية',
    },
    addressAr: 'طريق الأمير سلطان بن عبدالعزيز، حي الصحافة، الرياض',
    addressEn: 'Prince Sultan bin Abdulaziz Rd, Al Sahafa, Riyadh',
    coordinates: { lat: 24.7453, lng: 46.6620 },
    mapUrl: 'https://maps.google.com/?q=24.7453,46.6620',
    googlePlaceId: 'ChIJAlMokhtabar-Sahafa-Riyadh',

    phone: '+966112345694',
    whatsapp: '+966514234567',
    email: 'sahafa.riyadh@mokhtabar.com',

    manager: {
      nameAr: 'أ. رائد بن عبدالعزيز الغامدي',
      nameEn: 'Raeed bin Abdulaziz Al Ghamdi',
      title: 'مدير فرع الصحافة',
      phone: '+966514234570',
      email: 'r.ghamdi@mokhtabar.com',
      avatar: '/images/managers/r-ghamdi.jpg',
      since: '2023-01-15',
    },

    type: 'branch',
    status: 'active',
    openingHours: makeHours('07:00', '23:00', '16:00', '23:00'),
    is24Hours: false,

    capacity: { total: 40, current: 28, percentage: 70 },
    queueStatus: {
      waiting: 7,
      averageWait: '15 دقيقة',
      walkInAvailable: true,
      appointmentSlots: 18,
    },

    services: COMMON_SERVICES.filter((s) => s.id !== 'svc-neonatal'),
    availableTests: [
      'CBC', 'KFT', 'LFT', 'Lipid Profile', 'HbA1c', 'Fasting Glucose',
      'TSH', 'Free T3', 'Free T4', 'Testosterone', 'Progesterone',
      'Vitamin D', 'Vitamin B12', 'Iron Studies', 'Calcium',
      'CRP', 'ESR', 'ANA', 'RF', 'HBsAg', 'Anti-HCV',
      'HIV', 'Urinalysis', 'Stool Analysis', 'Culture & Sensitivity',
      'Pregnancy Test (β-HCG)', 'AFP', 'PSA',
    ],
    specialServices: ['خدمة VIP', 'استشارة طبية', 'توصيل النتائج'],
    departments: [
      'التحاليل السريرية', 'الكيمياء الحيوية', 'المناعة',
      'الميكروبيولوجي', 'banking الدم', 'الهرمونات', 'الوراثة',
    ],

    parking: { available: true, spots: 60, type: 'free', valet: false },
    accessibility: { wheelchair: true, ramp: true, elevator: true, handicappedParking: true, audioGuide: false },
    amenities: [...AMENITIES_BASE, 'كافيه'],

    images: [
      { id: 'img-sah-ext', url: '/images/branches/sahafa-exterior.jpg', alt: 'واجهة فرع الصحافة بالرياض', type: 'exterior', isPrimary: true },
      { id: 'img-sah-int', url: '/images/branches/sahafa-interior.jpg', alt: 'داخل فرع الصحافة بالرياض', type: 'interior', isPrimary: false },
      { id: 'img-sah-eq', url: '/images/branches/sahafa-equipment.jpg', alt: 'أجهزة فرع الصحافة بالرياض', type: 'equipment', isPrimary: false },
      { id: 'img-sah-wt', url: '/images/branches/sahafa-waiting.jpg', alt: 'منطقة الانتظار – فرع الصحافة بالرياض', type: 'waiting', isPrimary: false },
    ],
    coverImage: '/images/branches/sahafa-cover.jpg',

    established: '2023-03-01',
    totalPatients: 54320,
    rating: 4.6,
    reviewCount: 1780,
    certifications: ['معتمد من وزارة الصحة', 'ISO 15189'],

    emergencyContact: { phone: '+966112345695', available24h: true },

    region: 'منطقة الرياض',
    timezone: 'Asia/Riyadh',
    syncStatus: 'synced',
    lastSynced: '2026-07-28T10:30:00Z',
    realtimeEnabled: true,
  },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getBranchById(id: string): Branch | undefined {
  return ALL_BRANCHES.find((b) => b.id === id);
}

export function getBranchBySlug(slug: string): Branch | undefined {
  return ALL_BRANCHES.find((b) => b.slug === slug);
}

export function getMainBranch(): Branch {
  return ALL_BRANCHES.find((b) => b.type === 'main')!;
}

export function getActiveBranches(): Branch[] {
  return ALL_BRANCHES.filter((b) => b.status === 'active');
}

export function getBranchesByCity(city: string): Branch[] {
  return ALL_BRANCHES.filter((b) => b.address.city === city);
}

export function getBranchesByRegion(region: string): Branch[] {
  return ALL_BRANCHES.filter((b) => b.region === region);
}

/**
 * Haversine formula – returns distance in km.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Rough travel time estimate (driving ~40 km/h avg in city, walking 5 km/h).
 */
export function calculateTravelTime(
  distanceKm: number,
  mode: 'driving' | 'walking' = 'driving',
): number {
  const speed = mode === 'driving' ? 40 : 5;
  return Math.ceil((distanceKm / speed) * 60);
}

/**
 * Return branches sorted by proximity to the given point.
 */
export function getNearestBranch(
  lat: number,
  lng: number,
  limit = 3,
): Branch[] {
  return [...ALL_BRANCHES]
    .map((b) => ({
      branch: b,
      dist: calculateDistance(lat, lng, b.coordinates.lat, b.coordinates.lng),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map((e) => e.branch);
}

/**
 * Simple Arabic / English search across branch name, city, region, services.
 */
export function searchBranches(query: string): Branch[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_BRANCHES;

  return ALL_BRANCHES.filter((b) => {
    const hay = [
      b.nameAr,
      b.nameEn,
      b.address.city,
      b.addressAr,
      b.addressEn,
      b.region,
      ...b.services.map((s) => s.nameAr),
      ...b.services.map((s) => s.nameEn),
      ...b.departments,
      ...b.specialServices,
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

/** Unique city names across all branches. */
export const BRANCH_CITIES: string[] = [
  ...new Set(ALL_BRANCHES.map((b) => b.address.city)),
];

/** Unique region names across all branches. */
export const BRANCH_REGIONS: string[] = [
  ...new Set(ALL_BRANCHES.map((b) => b.region)),
];
