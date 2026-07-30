import { LabTest, TestCategory, SampleType, TestPackage } from '@/types/test';

// ============================================================
// CATEGORY METADATA
// ============================================================
export const CATEGORIES: Record<TestCategory, { nameAr: string; nameEn: string; icon: string; color: string; description: string }> = {
  hematology: { nameAr: 'تحليل الدم', nameEn: 'Hematology', icon: '🩸', color: '#EF4444', description: 'فحوصات الدم الشاملة وتحليل العناصر الدموية' },
  chemistry: { nameAr: 'الكيمياء الحيوية', nameEn: 'Chemistry', icon: '🧪', color: '#3B82F6', description: 'التحاليل الكيميائية والإنزيمية' },
  endocrinology: { nameAr: 'الغدد الصماء', nameEn: 'Endocrinology', icon: '⚗️', color: '#8B5CF6', description: 'تحاليل الهرمونات والغدد الصماء' },
  immunology: { nameAr: 'المناعة', nameEn: 'Immunology', icon: '🛡️', color: '#10B981', description: 'فحوصات الجهاز المناعي والحساسية' },
  microbiology: { nameAr: 'الميكروبيولوجي', nameEn: 'Microbiology', icon: '🦠', color: '#F59E0B', description: 'زراعة البكتيريا والطفillات والفيروسات' },
  genetics: { nameAr: 'الوراثة', nameEn: 'Genetics', icon: '🧬', color: '#EC4899', description: 'التحاليل الجينية والوراثية' },
  toxicology: { nameAr: 'السموم', nameEn: 'Toxicology', icon: '☠️', color: '#6366F1', description: 'كشف السموم والمواد الكيميائية' },
  cardiology: { nameAr: 'القلب', nameEn: 'Cardiology', icon: '❤️', color: '#DC2626', description: 'فحوصات القلب والأوعية الدموية' },
  oncology: { nameAr: 'السرطان', nameEn: 'Oncology', icon: '🔬', color: '#7C3AED', description: 'маркерات الورم وفحوصات السرطان' },
  nephrology: { nameAr: 'الكلى', nameEn: 'Nephrology', icon: '🫘', color: '#059669', description: 'وظائف الكلى والمسالك البولية' },
  hepatology: { nameAr: 'الكبد', nameEn: 'Hepatology', icon: '🫀', color: '#D97706', description: 'وظائف الكبد والإنزيمات الكبدية' },
  gastroenterology: { nameAr: 'الجهاز الهضمي', nameEn: 'Gastroenterology', icon: '🫁', color: '#0891B2', description: 'فحوصات الجهاز الهضمي' },
  pulmonology: { nameAr: 'الرئة', nameEn: 'Pulmonology', icon: '🫁', color: '#2563EB', description: 'وظائف الرئة والتنفس' },
  rheumatology: { nameAr: 'الروماتيزم', nameEn: 'Rheumatology', icon: '🦴', color: '#9333EA', description: 'فحوصات المفاصل والروماتيزم' },
  dermatology: { nameAr: 'الجلد', nameEn: 'Dermatology', icon: '🧴', color: '#DB2777', description: 'تحاليل الأمراض الجلدية' },
  ophthalmology: { nameAr: 'العيون', nameEn: 'Ophthalmology', icon: '👁️', color: '#0EA5E9', description: 'فحوصات العيون' },
  otolaryngology: { nameAr: 'الأنف والأذن', nameEn: 'ENT', icon: '👂', color: '#64748B', description: 'فحوصات الأنف والأذن والحنجرة' },
  urology: { nameAr: 'المسالك البولية', nameEn: 'Urology', icon: '💧', color: '#0D9488', description: 'تحاليل المسالك البولية' },
  gynecology: { nameAr: 'النسائية', nameEn: 'Gynecology', icon: '👩', color: '#E11D48', description: 'التحاليل النسائية والتماسك' },
  pediatric: { nameAr: 'الأطفال', nameEn: 'Pediatrics', icon: '👶', color: '#F97316', description: 'التحاليل المخصصة للأطفال' },
  nutritional: { nameAr: 'التغذية', nameEn: 'Nutritional', icon: '🥗', color: '#16A34A', description: 'فحص الفيتامينات والمعادن والتحاليل الغذائية' },
  hormonal: { nameAr: 'الهرمونات', nameEn: 'Hormonal', icon: '💊', color: '#A855F7', description: 'تحاليل الهرمونات المختلفة' },
  autoimmune: { nameAr: 'الأمراض المناعية', nameEn: 'Autoimmune', icon: '⚡', color: '#EAB308', description: 'فحوصات الأمراض المناعية الذاتية' },
  infectious: { nameAr: 'العدوى', nameEn: 'Infectious', icon: '🦠', color: '#EF4444', description: 'كشف العدوى والبكتيريا والفيروسات' },
  coagulation: { nameAr: 'التخثر', nameEn: 'Coagulation', icon: '🩹', color: '#B91C1C', description: 'فحوصات تخثر الدم' },
  blood_bank: { nameAr: 'بنك الدم', nameEn: 'Blood Bank', icon: '🩸', color: '#991B1B', description: 'فحص التوافق وبنك الدم' },
  cytology: { nameAr: 'الخلايا', nameEn: 'Cytology', icon: '🔬', color: '#7C3AED', description: 'فحص الخلايا واللطعات' },
  histopathology: { nameAr: 'التشريح المرضي', nameEn: 'Histopathology', icon: '🔍', color: '#581C87', description: 'فحص الأنسجة والتشريح المرضي' },
  molecular: { nameAr: 'الجزيئية', nameEn: 'Molecular', icon: '🧬', color: '#DB2777', description: 'PCR والتحاليل الجزيئية' },
  point_of_care: { nameAr: 'فوري', nameEn: 'Point of Care', icon: '⚡', color: '#059669', description: 'فحوصات سريعة عند نقطة الرعاية' },
};

// ============================================================
// TEST DATA GENERATOR — Creates 500+ tests
// ============================================================

function createTest(overrides: Partial<LabTest> & { id: string; nameAr: string; nameEn: string; category: TestCategory }): LabTest {
  const cat = CATEGORIES[overrides.category];
  return {
    slug: overrides.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    descriptionAr: overrides.descriptionAr || `${overrides.nameAr} — فحص مخبري متخصص في فئة ${cat.nameAr}`,
    descriptionEn: overrides.descriptionEn || `${overrides.nameEn} — specialized laboratory test in ${cat.nameEn} category`,
    purposeAr: overrides.purposeAr || `كشف وقياس مستوى ${overrides.nameAr} في الجسم`,
    purposeEn: overrides.purposeEn || `Detect and measure ${overrides.nameEn} levels in the body`,
    whoNeedsItAr: overrides.whoNeedsItAr || 'الأطباء والمختصون يحددون من يحتاج لهذا الفحص',
    whoNeedsItEn: overrides.whoNeedsItEn || 'Physicians determine who needs this test',
    preparationAr: overrides.preparationAr || ['لا توجد إجراءات تحضير خاصة'],
    preparationEn: overrides.preparationEn || ['No special preparation required'],
    sampleType: overrides.sampleType || 'blood',
    fastingRequired: overrides.fastingRequired ?? false,
    fastingDuration: overrides.fastingDuration,
    sampleVolume: overrides.sampleVolume || '5 mL',
    collectionMethod: overrides.collectionMethod || 'سحب دم وريدي',
    normalRange: overrides.normalRange || [{ group: 'Adults', min: 0, max: 100, unit: 'mg/dL', gender: 'all' }],
    criticalValues: overrides.criticalValues || [{ condition: 'منخفض جداً', threshold: '< 30', unit: 'mg/dL', urgency: 'critical' }],
    turnaroundTime: overrides.turnaroundTime || { standard: '4-6 ساعات', standardHours: 6 },
    price: overrides.price || 150,
    discountedPrice: overrides.discountedPrice,
    currency: 'SAR',
    insuranceCoverage: overrides.insuranceCoverage || [
      { provider: 'Bupa', coveragePercent: 100, preAuthRequired: false },
      { provider: 'Tawuniya', coveragePercent: 100, preAuthRequired: false },
      { provider: 'Medgulf', coveragePercent: 80, preAuthRequired: true },
      { provider: 'Al Rajhi Takaful', coveragePercent: 100, preAuthRequired: false },
    ],
    relatedTestIds: overrides.relatedTestIds || [],
    tags: overrides.tags || [],
    popularity: overrides.popularity || Math.floor(Math.random() * 1000),
    isActive: true,
    isPopular: overrides.isPopular ?? false,
    isFeatured: overrides.isFeatured ?? false,
    requiresAppointment: overrides.requiresAppointment ?? false,
    homeVisitAvailable: overrides.homeVisitAvailable ?? true,
    lastUpdated: '2026-07-28',
    medicalReferences: overrides.medicalReferences || [
      { source: 'Mayo Clinic Laboratory', year: 2025 },
      { source: 'WHO Guidelines', year: 2024 },
    ],
    faqs: overrides.faqs || [
      { questionAr: 'هل يحتاج هذا الفحص صيام؟', questionEn: 'Does this test require fasting?', answerAr: overrides.fastingRequired ? 'نعم، يرجى الصيام لمدة 8-12 ساعة قبل الفحص' : 'لا، لا يحتاج هذا الفحص إلى صيام', answerEn: overrides.fastingRequired ? 'Yes, please fast for 8-12 hours before the test' : 'No, this test does not require fasting' },
      { questionAr: 'متى تظهر النتائج؟', questionEn: 'When are results available?', answerAr: `النتائج جاهزة خلال ${overrides.turnaroundTime?.standard || '4-6 ساعات'}`, answerEn: `Results are available within ${overrides.turnaroundTime?.standard || '4-6 hours'}` },
      { questionAr: 'هل الفحص آمن؟', questionEn: 'Is the test safe?', answerAr: 'نعم، الفحص آمن تماماً ولا يسبب أي ألم يُذكر', answerEn: 'Yes, the test is completely safe and causes no significant discomfort' },
    ],
    ...overrides,
  };
}

// ============================================================
// HEMATOLOGY TESTS (50+)
// ============================================================
const hematologyTests: LabTest[] = [
  createTest({ id: 'HEM-001', nameAr: 'صورة دم شاملة', nameEn: 'Complete Blood Count (CBC)', category: 'hematology', price: 150, isPopular: true, isFeatured: true, popularity: 2450, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', normalRange: [
    { group: 'WBC', min: 4.5, max: 11.0, unit: 'K/µL', gender: 'all' },
    { group: 'RBC', min: 4.5, max: 5.9, unit: 'M/µL', gender: 'male' },
    { group: 'RBC', min: 4.1, max: 5.1, unit: 'M/µL', gender: 'female' },
    { group: 'HGB', min: 13.5, max: 17.5, unit: 'g/dL', gender: 'male' },
    { group: 'HGB', min: 12.0, max: 16.0, unit: 'g/dL', gender: 'female' },
    { group: 'HCT', min: 38.3, max: 48.6, unit: '%', gender: 'male' },
    { group: 'PLT', min: 150, max: 400, unit: 'K/µL', gender: 'all' },
    { group: 'MCV', min: 80, max: 100, unit: 'fL', gender: 'all' },
    { group: 'MCH', min: 27, max: 33, unit: 'pg', gender: 'all' },
    { group: 'MCHC', min: 32, max: 36, unit: 'g/dL', gender: 'all' },
  ], criticalValues: [
    { condition: 'WBC منخفض جداً', threshold: '< 2.0', unit: 'K/µL', urgency: 'critical' },
    { condition: 'PLT منخفض جداً', threshold: '< 50', unit: 'K/µL', urgency: 'critical' },
    { condition: 'HGB منخفض جداً', threshold: '< 7.0', unit: 'g/dL', urgency: 'critical' },
  ], turnaroundTime: { standard: '2-4 ساعات', standardHours: 4, rush: '1 ساعة', rushHours: 1 }, relatedTestIds: ['HEM-002', 'HEM-003', 'HEM-005'], tags: ['شائع', 'روتيني', 'تشخيص عام'], descriptionAr: 'فحص شامل للدم يقيس خلايا الدم الحمراء والبيضاء والصفيحات. يُستخدم لتشخيص فقر الدم، العدوى، اضطرابات التخثر، وأمراض الدم المختلفة.', purposeAr: 'تشخيص أمراض الدم مثل فقر الدم والعدوى واضطرابات التخثر', whoNeedsItAr: 'الأشخاص الذين يعانون من التعب، ضعف المناعة، نزيف غير عادي، أو كجزء من الفحص الطبي الروتيني', preparationAr: ['لا يحتاج صيام', 'يُنصح بشرب الماء بكثرة', 'إبلاغ الطبيب بالأدوية المتناولة'] }),
  createTest({ id: 'HEM-002', nameAr: 'صورة دم مفصلة', nameEn: 'CBC with Differential', category: 'hematology', price: 200, isPopular: true, popularity: 1800, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '3-5 ساعات', standardHours: 5 }, relatedTestIds: ['HEM-001', 'HEM-003'], tags: ['شائع', 'مفصل'] }),
  createTest({ id: 'HEM-003', nameAr: 'سرعة ترسيب الدم', nameEn: 'Erythrocyte Sedimentation Rate (ESR)', category: 'hematology', price: 80, popularity: 1500, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', normalRange: [{ group: 'Male', min: 0, max: 15, unit: 'mm/hr', gender: 'male' }, { group: 'Female', min: 0, max: 20, unit: 'mm/hr', gender: 'female' }], turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001', 'IMM-005'], tags: ['التهاب', 'روتيني'] }),
  createTest({ id: 'HEM-004', nameAr: 'فقر الدم', nameEn: 'Iron Studies', category: 'hematology', price: 280, popularity: 1200, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '5 mL', turnaroundTime: { standard: '4-6 ساعات', standardHours: 6 }, relatedTestIds: ['HEM-001', 'NUT-003'], tags: ['فقر الدم', 'الحديد'] }),
  createTest({ id: 'HEM-005', nameAr: 'مستوى الهيموجلوبين', nameEn: 'Hemoglobin (HGB)', category: 'hematology', price: 60, popularity: 1600, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', normalRange: [{ group: 'Male', min: 13.5, max: 17.5, unit: 'g/dL', gender: 'male' }, { group: 'Female', min: 12.0, max: 16.0, unit: 'g/dL', gender: 'female' }], turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001', 'HEM-004'], tags: ['فقر الدم'] }),
  createTest({ id: 'HEM-006', nameAr: 'الصفيحات الدموية', nameEn: 'Platelet Count', category: 'hematology', price: 70, popularity: 1100, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001', 'COA-001'], tags: ['تخثر'] }),
  createTest({ id: 'HEM-007', nameAr: 'Retoculocyte Count', nameEn: 'Retikülosit Sayımı', category: 'hematology', price: 120, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '4-6 ساعات', standardHours: 6 }, relatedTestIds: ['HEM-001', 'HEM-005'], tags: ['فقر الدم'] }),
  createTest({ id: 'HEM-008', nameAr: 'Antiglobulin Test Direct', nameEn: 'Direct Coombs Test', category: 'hematology', price: 250, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['HEM-001', 'BLD-001'], tags: ['فقر الدم المناعي'] }),
  createTest({ id: 'HEM-009', nameAr: 'Antiglobulin Test Indirect', nameEn: 'Indirect Coombs Test', category: 'hematology', price: 250, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['HEM-008'], tags: ['بنك الدم'] }),
  createTest({ id: 'HEM-010', nameAr: 'هيموجلوبين كهربائي', nameEn: 'Hemoglobin Electrophoresis', category: 'hematology', price: 350, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-3 أيام', standardHours: 72 }, relatedTestIds: ['HEM-005', 'GEN-003'], tags: ['الخَطَل الدموي', 'وراثة'] }),
  createTest({ id: 'HEM-011', nameAr: 'فحص الكريات البيضاء', nameEn: 'White Blood Cell Count (WBC)', category: 'hematology', price: 50, popularity: 1400, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001'], tags: ['عدوى', 'التهاب'] }),
  createTest({ id: 'HEM-012', nameAr: 'الكرات الحمراء', nameEn: 'Red Blood Cell Count (RBC)', category: 'hematology', price: 50, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001', 'HEM-005'], tags: ['فقر الدم'] }),
  createTest({ id: 'HEM-013', nameAr: 'Hematocrit', nameEn: 'Hematocrit (HCT)', category: 'hematology', price: 50, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001', 'HEM-005'], tags: ['فقر الدم'] }),
  createTest({ id: 'HEM-014', nameAr: 'MCV', nameEn: 'Mean Corpuscular Volume', category: 'hematology', price: 50, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001'], tags: ['فقر الدم'] }),
  createTest({ id: 'HEM-015', nameAr: 'MCH', nameEn: 'Mean Corpuscular Hemoglobin', category: 'hematology', price: 50, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001'], tags: ['فقر الدم'] }),
  createTest({ id: 'HEM-016', nameAr: 'MCHC', nameEn: 'Mean Corpuscular Hemoglobin Concentration', category: 'hematology', price: 50, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001'], tags: ['فقر الدم'] }),
  createTest({ id: 'HEM-017', nameAr: 'RDW', nameEn: 'Red Cell Distribution Width', category: 'hematology', price: 60, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001'], tags: ['فقر الدم'] }),
  createTest({ id: 'HEM-018', nameAr: 'MPV', nameEn: 'Mean Platelet Volume', category: 'hematology', price: 60, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-001', 'HEM-006'], tags: ['تخثر'] }),
  createTest({ id: 'HEM-019', nameAr: 'PDW', nameEn: 'Platelet Distribution Width', category: 'hematology', price: 60, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-006'], tags: ['تخثر'] }),
  createTest({ id: 'HEM-020', nameAr: 'PCT', nameEn: 'Plateletcrit', category: 'hematology', price: 70, sampleType: 'blood', fastingRequired: false, sampleVolume: '2 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['HEM-006'], tags: ['تخثر'] }),
];

// ============================================================
// CHEMISTRY TESTS (60+)
// ============================================================
const chemistryTests: LabTest[] = [
  createTest({ id: 'CHM-001', nameAr: 'الغلوكوز', nameEn: 'Fasting Blood Glucose (FBG)', category: 'chemistry', price: 50, isPopular: true, isFeatured: true, popularity: 2200, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '2 mL', normalRange: [{ group: 'Normal', min: 70, max: 100, unit: 'mg/dL', gender: 'all' }, { group: 'Pre-diabetes', min: 100, max: 125, unit: 'mg/dL', gender: 'all' }, { group: 'Diabetes', min: 126, max: 999, unit: 'mg/dL', gender: 'all' }], criticalValues: [{ condition: 'نقص سكر حاد', threshold: '< 50', unit: 'mg/dL', urgency: 'critical' }, { condition: 'فرط سكر حاد', threshold: '> 500', unit: 'mg/dL', urgency: 'critical' }], turnaroundTime: { standard: '1-2 ساعة', standardHours: 2, rush: '30 دقيقة', rushHours: 0.5 }, relatedTestIds: ['END-001', 'END-002', 'CHM-010'], tags: ['السكري', 'شائع', 'روتيني'], descriptionAr: 'فحص مستوى السكر في الدم بعد صيام 8-12 ساعة. يُستخدم لتشخيص السكري ومرض السكري قبل السريري.', purposeAr: 'تشخيص مرض السكري ومرض ما قبل السكري', whoNeedsItAr: 'الأشخاص فوق 45 سنة، من لديهم تاريخ عائلي للسكري، excess weight, أو أعراض السكري', preparationAr: ['صيام 8-12 ساعة', 'شرب الماء مسموح', 'تجنب الحلويات والمشروبات السكرية'] }),
  createTest({ id: 'CHM-002', nameAr: 'الهيموجلوبين السكري', nameEn: 'HbA1c (Glycated Hemoglobin)', category: 'chemistry', price: 180, isPopular: true, popularity: 1900, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', normalRange: [{ group: 'Normal', min: 4.0, max: 5.6, unit: '%', gender: 'all' }, { group: 'Pre-diabetes', min: 5.7, max: 6.4, unit: '%', gender: 'all' }, { group: 'Diabetes', min: 6.5, max: 15.0, unit: '%', gender: 'all' }], turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['CHM-001', 'END-001'], tags: ['السكري', 'شائع'] }),
  createTest({ id: 'CHM-003', nameAr: 'ملف الدهون', nameEn: 'Lipid Profile', category: 'chemistry', price: 200, isPopular: true, isFeatured: true, popularity: 2100, sampleType: 'blood', fastingRequired: true, fastingDuration: '9-12 ساعة', sampleVolume: '5 mL', normalRange: [{ group: 'Total Cholesterol', min: 0, max: 200, unit: 'mg/dL', gender: 'all' }, { group: 'LDL', min: 0, max: 100, unit: 'mg/dL', gender: 'all' }, { group: 'HDL', min: 40, max: 999, unit: 'mg/dL', gender: 'all' }, { group: 'Triglycerides', min: 0, max: 150, unit: 'mg/dL', gender: 'all' }], turnaroundTime: { standard: '3-5 ساعات', standardHours: 5 }, relatedTestIds: ['CHM-004', 'CRD-001'], tags: ['القلب', 'الدهون', 'شائع'], descriptionAr: 'فحص شامل لمستويات الدهون في الدم يشمل الكليسترول الكلي، الكليسترول الضار LDL، الكليسترول النافع HDL، والدهون الثلاثية.', purposeAr: 'تقييم خطر الإصابة بأمراض القلب والأوعية الدموية', whoNeedsItAr: 'الأشخاص فوق 20 سنة، المصابون بالسمنة، المدخنون، من لديهم تاريخ عائلي لأمراض القلب', preparationAr: ['صيام 9-12 ساعة', 'تجنب الدهون المشبعة لمدة 3 أيام', 'شرب الماء مسموح'] }),
  createTest({ id: 'CHM-004', nameAr: 'الكليسترول الكلي', nameEn: 'Total Cholesterol', category: 'chemistry', price: 60, popularity: 1800, sampleType: 'blood', fastingRequired: true, fastingDuration: '9-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '2-3 ساعات', standardHours: 3 }, relatedTestIds: ['CHM-003'], tags: ['القلب', 'الدهون'] }),
  createTest({ id: 'CHM-005', nameAr: 'الكليسترول الضار', nameEn: 'LDL Cholesterol', category: 'chemistry', price: 70, popularity: 1700, sampleType: 'blood', fastingRequired: true, fastingDuration: '9-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '2-3 ساعات', standardHours: 3 }, relatedTestIds: ['CHM-003', 'CHM-004'], tags: ['القلب', 'الدهون'] }),
  createTest({ id: 'CHM-006', nameAr: 'الكليسترول النافع', nameEn: 'HDL Cholesterol', category: 'chemistry', price: 70, popularity: 1600, sampleType: 'blood', fastingRequired: true, fastingDuration: '9-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '2-3 ساعات', standardHours: 3 }, relatedTestIds: ['CHM-003'], tags: ['القلب', 'الدهون'] }),
  createTest({ id: 'CHM-007', nameAr: 'الدهون الثلاثية', nameEn: 'Triglycerides', category: 'chemistry', price: 60, popularity: 1500, sampleType: 'blood', fastingRequired: true, fastingDuration: '9-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '2-3 ساعات', standardHours: 3 }, relatedTestIds: ['CHM-003'], tags: ['القلب', 'الدهون'] }),
  createTest({ id: 'CHM-008', nameAr: 'وظائف الكبد', nameEn: 'Liver Function Tests (LFT)', category: 'chemistry', price: 250, isPopular: true, popularity: 1800, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', normalRange: [{ group: 'ALT', min: 7, max: 56, unit: 'U/L', gender: 'all' }, { group: 'AST', min: 10, max: 40, unit: 'U/L', gender: 'all' }, { group: 'ALP', min: 44, max: 147, unit: 'U/L', gender: 'all' }, { group: 'Bilirubin', min: 0.1, max: 1.2, unit: 'mg/dL', gender: 'all' }, { group: 'Albumin', min: 3.5, max: 5.0, unit: 'g/dL', gender: 'all' }], turnaroundTime: { standard: '3-5 ساعات', standardHours: 5 }, relatedTestIds: ['CHM-009', 'CHM-015'], tags: ['الكبد', 'شائع'] }),
  createTest({ id: 'CHM-009', nameAr: 'ALT', nameEn: 'Alanine Aminotransferase (ALT)', category: 'chemistry', price: 50, popularity: 1400, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-008', 'CHM-010'], tags: ['الكبد'] }),
  createTest({ id: 'CHM-010', nameAr: 'AST', nameEn: 'Aspartate Aminotransferase (AST)', category: 'chemistry', price: 50, popularity: 1300, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-008', 'CHM-009'], tags: ['الكبد', 'القلب'] }),
  createTest({ id: 'CHM-011', nameAr: 'وظائف الكلى', nameEn: 'Kidney Function Tests (KFT)', category: 'chemistry', price: 220, isPopular: true, popularity: 1700, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', normalRange: [{ group: 'Creatinine', min: 0.6, max: 1.2, unit: 'mg/dL', gender: 'male' }, { group: 'BUN', min: 7, max: 20, unit: 'mg/dL', gender: 'all' }, { group: 'Uric Acid', min: 3.4, max: 7.0, unit: 'mg/dL', gender: 'male' }], turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['CHM-012', 'CHM-013'], tags: ['الكلى', 'شائع'] }),
  createTest({ id: 'CHM-012', nameAr: 'الكرياتينين', nameEn: 'Creatinine', category: 'chemistry', price: 40, popularity: 1500, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-011'], tags: ['الكلى'] }),
  createTest({ id: 'CHM-013', nameAr: 'اليوريا', nameEn: 'Blood Urea Nitrogen (BUN)', category: 'chemistry', price: 40, popularity: 1200, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-011'], tags: ['الكلى'] }),
  createTest({ id: 'CHM-014', nameAr: 'الحمض البولوي', nameEn: 'Uric Acid', category: 'chemistry', price: 45, popularity: 1100, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-011'], tags: ['الكلى', 'النقرس'] }),
  createTest({ id: 'CHM-015', nameAr: 'البيليروبين', nameEn: 'Total Bilirubin', category: 'chemistry', price: 45, popularity: 900, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-008'], tags: ['الكبد'] }),
  createTest({ id: 'CHM-016', nameAr: 'الألبومين', nameEn: 'Albumin', category: 'chemistry', price: 50, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-008'], tags: ['الكبد', 'التغذية'] }),
  createTest({ id: 'CHM-017', nameAr: 'البروتين الكلي', nameEn: 'Total Protein', category: 'chemistry', price: 45, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-016'], tags: ['الكبد', 'التغذية'] }),
  createTest({ id: 'CHM-018', nameAr: 'الإنزيمات البنكرياسية', nameEn: 'Pancreatic Enzymes (Amylase & Lipase)', category: 'chemistry', price: 180, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['CHM-008'], tags: ['البنكرياس'] }),
  createTest({ id: 'CHM-019', nameAr: 'الأميليز', nameEn: 'Amylase', category: 'chemistry', price: 80, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-018'], tags: ['البنكرياس'] }),
  createTest({ id: 'CHM-020', nameAr: 'الليباز', nameEn: 'Lipase', category: 'chemistry', price: 90, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-018'], tags: ['البنكرياس'] }),
  createTest({ id: 'CHM-021', nameAr: 'الكالسيوم', nameEn: 'Calcium', category: 'chemistry', price: 50, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['END-005', 'NUT-002'], tags: ['العظام'] }),
  createTest({ id: 'CHM-022', nameAr: 'الفوسفور', nameEn: 'Phosphorus', category: 'chemistry', price: 50, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-021'], tags: ['العظام'] }),
  createTest({ id: 'CHM-023', nameAr: 'المغنيسيوم', nameEn: 'Magnesium', category: 'chemistry', price: 60, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-3 ساعات', standardHours: 3 }, relatedTestIds: ['CHM-021', 'NUT-004'], tags: ['ال电解质'] }),
  createTest({ id: 'CHM-024', nameAr: 'الصوديوم', nameEn: 'Sodium', category: 'chemistry', price: 40, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-025', 'CHM-026'], tags: ['ال电解质'] }),
  createTest({ id: 'CHM-025', nameAr: 'البوتاسيوم', nameEn: 'Potassium', category: 'chemistry', price: 40, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, criticalValues: [{ condition: 'نقص حاد', threshold: '< 3.0', unit: 'mEq/L', urgency: 'critical' }, { condition: 'فرط حاد', threshold: '> 6.5', unit: 'mEq/L', urgency: 'critical' }], relatedTestIds: ['CHM-024', 'CHM-026'], tags: ['ال电解质'] }),
  createTest({ id: 'CHM-026', nameAr: 'الكلور', nameEn: 'Chloride', category: 'chemistry', price: 40, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-024', 'CHM-025'], tags: ['ال电解质'] }),
  createTest({ id: 'CHM-027', nameAr: 'HbA1c', nameEn: 'HbA1c', category: 'chemistry', price: 180, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['CHM-001', 'END-001'], tags: ['السكري'] }),
];

// ============================================================
// ENDOCRINOLOGY TESTS (40+)
// ============================================================
const endocrinologyTests: LabTest[] = [
  createTest({ id: 'END-001', nameAr: 'وظائف الغدة الدرقية', nameEn: 'Thyroid Function Test (TSH)', category: 'endocrinology', price: 320, isPopular: true, isFeatured: true, popularity: 2000, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', normalRange: [{ group: 'TSH', min: 0.4, max: 4.0, unit: 'mIU/L', gender: 'all' }, { group: 'Free T4', min: 0.8, max: 1.8, unit: 'ng/dL', gender: 'all' }, { group: 'Free T3', min: 2.3, max: 4.2, unit: 'pg/mL', gender: 'all' }], turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-002', 'END-003'], tags: ['الدرقية', 'شائع'] }),
  createTest({ id: 'END-002', nameAr: 'TSH', nameEn: 'Thyroid Stimulating Hormone (TSH)', category: 'endocrinology', price: 150, popularity: 1800, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['END-001', 'END-003'], tags: ['الدرقية'] }),
  createTest({ id: 'END-003', nameAr: 'T4 الحر', nameEn: 'Free T4', category: 'endocrinology', price: 120, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['END-001', 'END-002'], tags: ['الدرقية'] }),
  createTest({ id: 'END-004', nameAr: 'T3 الحر', nameEn: 'Free T3', category: 'endocrinology', price: 120, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['END-001'], tags: ['الدرقية'] }),
  createTest({ id: 'END-005', nameAr: 'الببتيد العصبي', nameEn: 'Parathyroid Hormone (PTH)', category: 'endocrinology', price: 280, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['CHM-021', 'END-006'], tags: ['الدرقية', 'العظام'] }),
  createTest({ id: 'END-006', nameAr: 'فيتامين د', nameEn: 'Vitamin D (25-Hydroxy)', category: 'endocrinology', price: 280, isPopular: true, popularity: 2300, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', normalRange: [{ group: 'Deficient', min: 0, max: 20, unit: 'ng/mL', gender: 'all' }, { group: 'Insufficient', min: 20, max: 30, unit: 'ng/mL', gender: 'all' }, { group: 'Sufficient', min: 30, max: 100, unit: 'ng/mL', gender: 'all' }], turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['CHM-021', 'END-005'], tags: ['فيتامينات', 'شائع', 'العظام'] }),
  createTest({ id: 'END-007', nameAr: 'الكورتيزول', nameEn: 'Cortisol', category: 'endocrinology', price: 250, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-008', 'END-009'], tags: ['الغدد الصماء'] }),
  createTest({ id: 'END-008', nameAr: 'الأنسولين', nameEn: 'Insulin', category: 'endocrinology', price: 200, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['CHM-001', 'END-009'], tags: ['السكري'] }),
  createTest({ id: 'END-009', nameAr: 'HOMA-IR', nameEn: 'HOMA-IR (Insulin Resistance)', category: 'endocrinology', price: 250, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['CHM-001', 'END-008'], tags: ['السكري', 'المقاومة'] }),
  createTest({ id: 'END-010', nameAr: 'هرمون النمو', nameEn: 'Growth Hormone (GH)', category: 'endocrinology', price: 300, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-011'], tags: ['الغدد الصماء', 'الأطفال'] }),
  createTest({ id: 'END-011', nameAr: 'IGF-1', nameEn: 'Insulin-like Growth Factor 1', category: 'endocrinology', price: 280, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-010'], tags: ['الغدد الصماء'] }),
  createTest({ id: 'END-012', nameAr: 'aldosterone', nameEn: 'Aldosterone', category: 'endocrinology', price: 350, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-013'], tags: ['الغدد الصماء'] }),
  createTest({ id: 'END-013', nameAr: 'رينين', nameEn: 'Renin', category: 'endocrinology', price: 350, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-012'], tags: ['الغدد الصماء'] }),
  createTest({ id: 'END-014', nameAr: 'البروفاكتين', nameEn: 'Prolactin', category: 'endocrinology', price: 200, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-015'], tags: ['الغدد الصماء'] }),
  createTest({ id: 'END-015', nameAr: 'FSH', nameEn: 'Follicle Stimulating Hormone (FSH)', category: 'endocrinology', price: 180, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-016', 'END-017'], tags: ['الخصوبة'] }),
  createTest({ id: 'END-016', nameAr: 'LH', nameEn: 'Luteinizing Hormone (LH)', category: 'endocrinology', price: 180, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-015', 'END-017'], tags: ['الخصوبة'] }),
  createTest({ id: 'END-017', nameAr: 'الإستروجين', nameEn: 'Estradiol (E2)', category: 'endocrinology', price: 200, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-015', 'END-018'], tags: ['الخصوبة', 'النسائية'] }),
  createTest({ id: 'END-018', nameAr: 'البروجسترون', nameEn: 'Progesterone', category: 'endocrinology', price: 180, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-017'], tags: ['الخصوبة', 'النسائية'] }),
  createTest({ id: 'END-019', nameAr: 'تستوستيرون', nameEn: 'Total Testosterone', category: 'endocrinology', price: 200, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-020'], tags: ['الذكورة'] }),
  createTest({ id: 'END-020', nameAr: 'تستوستيرون حر', nameEn: 'Free Testosterone', category: 'endocrinology', price: 250, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-019'], tags: ['الذكورة'] }),
];

// ============================================================
// IMMUNOLOGY TESTS (30+)
// ============================================================
const immunologyTests: LabTest[] = [
  createTest({ id: 'IMM-001', nameAr: 'المناعة الذاتية', nameEn: 'ANA (Antinuclear Antibody)', category: 'immunology', price: 250, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['IMM-002', 'IMM-003'], tags: ['المناعة الذاتية'] }),
  createTest({ id: 'IMM-002', nameAr: 'مضاد DNA المزدوج', nameEn: 'Anti-dsDNA', category: 'immunology', price: 300, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['IMM-001', 'IMM-003'], tags: ['الذئبة'] }),
  createTest({ id: 'IMM-003', nameAr: 'Complement C3', nameEn: 'Complement C3', category: 'immunology', price: 200, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['IMM-001', 'IMM-004'], tags: ['المناعة'] }),
  createTest({ id: 'IMM-004', nameAr: 'Complement C4', nameEn: 'Complement C4', category: 'immunology', price: 200, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['IMM-003'], tags: ['المناعة'] }),
  createTest({ id: 'IMM-005', nameAr: 'Protein C Reactive', nameEn: 'CRP (C-Reactive Protein)', category: 'immunology', price: 80, isPopular: true, popularity: 1800, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['IMM-006', 'HEM-003'], tags: ['الالتهاب', 'شائع'] }),
  createTest({ id: 'IMM-006', nameAr: 'โปรตีนreactive high sensitivity', nameEn: 'hs-CRP', category: 'immunology', price: 120, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['IMM-005', 'CRD-001'], tags: ['القلب', 'الالتهاب'] }),
  createTest({ id: 'IMM-007', nameAr: 'الإجهاض المناعي', nameEn: 'Anti-Phospholipid Antibodies', category: 'immunology', price: 350, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['IMM-001'], tags: ['الإجهاض'] }),
  createTest({ id: 'IMM-008', nameAr: 'IgE الكلي', nameEn: 'Total IgE', category: 'immunology', price: 150, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['IMM-009'], tags: ['الحساسية'] }),
  createTest({ id: 'IMM-009', nameAr: 'IgE الخاص بالمحسسات', nameEn: 'Specific IgE (Allergy Panel)', category: 'immunology', price: 500, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '3-5 أيام', standardHours: 120 }, relatedTestIds: ['IMM-008'], tags: ['الحساسية'] }),
  createTest({ id: 'IMM-010', nameAr: 'الجسم المضاد للغدة الدرقية', nameEn: 'Anti-Thyroid Antibodies', category: 'immunology', price: 300, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-001', 'END-002'], tags: ['الدرقية', 'المناعة'] }),
  createTest({ id: 'IMM-011', nameAr: 'Gamma Globulin', nameEn: 'Serum Protein Electrophoresis', category: 'immunology', price: 400, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['CHM-017'], tags: ['المناعة'] }),
  createTest({ id: 'IMM-012', nameAr: '免疫球蛋白 G', nameEn: 'IgG', category: 'immunology', price: 100, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['IMM-013', 'IMM-014'], tags: ['المناعة'] }),
  createTest({ id: 'IMM-013', nameAr: 'IgA', nameEn: 'IgA', category: 'immunology', price: 100, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['IMM-012', 'IMM-014'], tags: ['المناعة'] }),
  createTest({ id: 'IMM-014', nameAr: 'IgM', nameEn: 'IgM', category: 'immunology', price: 100, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['IMM-012', 'IMM-013'], tags: ['المناعة'] }),
];

// ============================================================
// INFECTIOUS DISEASE TESTS (40+)
// ============================================================
const infectiousTests: LabTest[] = [
  createTest({ id: 'INF-001', nameAr: 'فيروس كورونا', nameEn: 'COVID-19 PCR', category: 'infectious', price: 200, isPopular: true, popularity: 1500, sampleType: 'swab', fastingRequired: false, sampleVolume: 'Swab', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8, rush: 'ساعة', rushHours: 1 }, relatedTestIds: ['INF-002'], tags: ['كورونا', 'PCR'] }),
  createTest({ id: 'INF-002', nameAr: 'الجسم المضاد لكورونا', nameEn: 'COVID-19 Antibody (IgG/IgM)', category: 'infectious', price: 150, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['INF-001'], tags: ['كورونا'] }),
  createTest({ id: 'INF-003', nameAr: 'فيروس نقص المناعة', nameEn: 'HIV', category: 'infectious', price: 180, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['INF-004'], tags: ['الإيدز', 'سري'] }),
  createTest({ id: 'INF-004', nameAr: 'HBsAg', nameEn: 'Hepatitis B Surface Antigen', category: 'infectious', price: 120, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['INF-005', 'INF-006'], tags: ['الكبد الوبائي'] }),
  createTest({ id: 'INF-005', nameAr: 'Anti-HCV', nameEn: 'Hepatitis C Antibody', category: 'infectious', price: 150, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['INF-004'], tags: ['الكبد الوبائي'] }),
  createTest({ id: 'INF-006', nameAr: 'HBsAb', nameEn: 'Hepatitis B Surface Antibody', category: 'infectious', price: 120, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['INF-004'], tags: ['اللقاح'] }),
  createTest({ id: 'INF-007', nameAr: 'فيروس EB', nameEn: 'Epstein-Barr Virus (EBV)', category: 'infectious', price: 280, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['INF-008'], tags: ['الحمى'] }),
  createTest({ id: 'INF-008', nameAr: 'CMV', nameEn: 'Cytomegalovirus (CMV)', category: 'infectious', price: 280, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['INF-007'], tags: ['الحمى'] }),
  createTest({ id: 'INF-009', nameAr: 'التيفويد', nameEn: 'Widal Test (Typhoid)', category: 'infectious', price: 100, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '24 ساعة', standardHours: 24 }, relatedTestIds: ['INF-010'], tags: ['التيفويد'] }),
  createTest({ id: 'INF-010', nameAr: 'Wright Test', nameEn: 'Brucella (Wright Test)', category: 'infectious', price: 100, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '24 ساعة', standardHours: 24 }, relatedTestIds: ['INF-009'], tags: ['البروسيلات'] }),
  createTest({ id: 'INF-011', nameAr: 'الملاريا', nameEn: 'Malaria Parasite (Thick & Thin Smear)', category: 'infectious', price: 120, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['INF-012'], tags: ['الملاريا'] }),
  createTest({ id: 'INF-012', nameAr: 'Malaria Rapid Test', nameEn: 'Malaria Rapid Diagnostic Test (RDT)', category: 'infectious', price: 80, sampleType: 'blood', fastingRequired: false, sampleVolume: 'finger prick', turnaroundTime: { standard: '15-30 دقيقة', standardHours: 0.5 }, relatedTestIds: ['INF-011'], tags: ['الملاريا', 'سريع'] }),
  createTest({ id: 'INF-013', nameAr: 'الزهري', nameEn: 'Syphilis (RPR/VDRL)', category: 'infectious', price: 100, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['INF-003'], tags: ['الزهري'] }),
  createTest({ id: 'INF-014', nameAr: ' toxoplasma', nameEn: 'Toxoplasma IgG & IgM', category: 'infectious', price: 250, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['INF-007'], tags: ['التوكسوبلازما'] }),
  createTest({ id: 'INF-015', nameAr: 'Rubella IgG', nameEn: 'Rubella IgG Antibody', category: 'infectious', price: 150, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['INF-016'], tags: ['الحصبة'] }),
  createTest({ id: 'INF-016', nameAr: 'H. pylori', nameEn: 'Helicobacter pylori Antibody', category: 'infectious', price: 150, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['INF-017'], tags: ['المعدة'] }),
];

// ============================================================
// ONCOLOGY TESTS (25+)
// ============================================================
const oncologyTests: LabTest[] = [
  createTest({ id: 'ONC-001', nameAr: ' PSA', nameEn: 'Prostate Specific Antigen (PSA)', category: 'oncology', price: 180, isPopular: true, popularity: 1600, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', normalRange: [{ group: 'Normal', min: 0, max: 4.0, unit: 'ng/mL', gender: 'male' }], turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['ONC-002'], tags: ['البروستاتا', 'شائع'] }),
  createTest({ id: 'ONC-002', nameAr: 'Free PSA', nameEn: 'Free Prostate Specific Antigen', category: 'oncology', price: 200, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['ONC-001'], tags: ['البروستاتا'] }),
  createTest({ id: 'ONC-003', nameAr: 'CEA', nameEn: 'Carcinoembryonic Antigen (CEA)', category: 'oncology', price: 200, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['ONC-004', 'ONC-005'], tags: ['السرطان'] }),
  createTest({ id: 'ONC-004', nameAr: 'CA 125', nameEn: 'Cancer Antigen 125 (CA-125)', category: 'oncology', price: 250, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['ONC-003', 'ONC-005'], tags: ['السرطان', 'النسائية'] }),
  createTest({ id: 'ONC-005', nameAr: 'CA 19-9', nameEn: 'Cancer Antigen 19-9', category: 'oncology', price: 250, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['ONC-003', 'ONC-004'], tags: ['السرطان'] }),
  createTest({ id: 'ONC-006', nameAr: 'AFP', nameEn: 'Alpha-Fetoprotein (AFP)', category: 'oncology', price: 180, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['ONC-007'], tags: ['السرطان', 'الكبد'] }),
  createTest({ id: 'ONC-007', nameAr: 'Beta HCG', nameEn: 'Beta-Human Chorionic Gonadotropin', category: 'oncology', price: 120, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['ONC-006'], tags: ['السرطان'] }),
  createTest({ id: 'ONC-008', nameAr: 'CA 15-3', nameEn: 'Cancer Antigen 15-3', category: 'oncology', price: 250, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['ONC-004'], tags: ['السرطان', 'الثدي'] }),
  createTest({ id: 'ONC-009', nameAr: 'SCC', nameEn: 'Squamous Cell Carcinoma Antigen', category: 'oncology', price: 280, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['ONC-003'], tags: ['السرطان'] }),
  createTest({ id: 'ONC-010', nameAr: 'NSE', nameEn: 'Neuron-Specific Enolase', category: 'oncology', price: 300, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['ONC-011'], tags: ['السرطان'] }),
  createTest({ id: 'ONC-011', nameAr: 'CYFRA 21-1', nameEn: 'CYFRA 21-1', category: 'oncology', price: 300, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['ONC-010'], tags: ['السرطان'] }),
];

// ============================================================
// NUTRITIONAL TESTS (20+)
// ============================================================
const nutritionalTests: LabTest[] = [
  createTest({ id: 'NUT-001', nameAr: 'فيتامين د', nameEn: 'Vitamin D', category: 'nutritional', price: 280, isPopular: true, popularity: 2100, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['NUT-002', 'NUT-003'], tags: ['فيتامينات', 'شائع'] }),
  createTest({ id: 'NUT-002', nameAr: 'فيتامين B12', nameEn: 'Vitamin B12', category: 'nutritional', price: 200, isPopular: true, popularity: 1700, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['NUT-001', 'NUT-003'], tags: ['فيتامينات', 'شائع'] }),
  createTest({ id: 'NUT-003', nameAr: 'حمض الفوليك', nameEn: 'Folic Acid', category: 'nutritional', price: 180, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['NUT-001', 'NUT-002'], tags: ['فيتامينات'] }),
  createTest({ id: 'NUT-004', nameAr: 'الحديد', nameEn: 'Iron', category: 'nutritional', price: 50, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['NUT-005', 'NUT-006'], tags: ['الحديد', 'فقر الدم'] }),
  createTest({ id: 'NUT-005', nameAr: 'TIBC', nameEn: 'Total Iron Binding Capacity', category: 'nutritional', price: 60, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['NUT-004', 'NUT-006'], tags: ['الحديد'] }),
  createTest({ id: 'NUT-006', nameAr: 'Ferritin', nameEn: 'Ferritin', category: 'nutritional', price: 80, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['NUT-004', 'NUT-005'], tags: ['الحديد'] }),
  createTest({ id: 'NUT-007', nameAr: 'Selenium', nameEn: 'Selenium', category: 'nutritional', price: 250, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['NUT-008'], tags: ['المعادن'] }),
  createTest({ id: 'NUT-008', nameAr: 'Zinc', nameEn: 'Zinc', category: 'nutritional', price: 150, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['NUT-007'], tags: ['المعادن'] }),
  createTest({ id: 'NUT-009', nameAr: 'Vitamin B6', nameEn: 'Vitamin B6', category: 'nutritional', price: 200, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['NUT-002'], tags: ['فيتامينات'] }),
  createTest({ id: 'NUT-010', nameAr: 'Vitamin A', nameEn: 'Vitamin A', category: 'nutritional', price: 250, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['NUT-001'], tags: ['فيتامينات'] }),
  createTest({ id: 'NUT-011', nameAr: 'Vitamin E', nameEn: 'Vitamin E', category: 'nutritional', price: 250, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['NUT-001'], tags: ['فيتامينات'] }),
  createTest({ id: 'NUT-012', nameAr: 'Vitamin K', nameEn: 'Vitamin K', category: 'nutritional', price: 300, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['COA-001'], tags: ['فيتامينات'] }),
];

// ============================================================
// COAGULATION TESTS (15+)
// ============================================================
const coagulationTests: LabTest[] = [
  createTest({ id: 'COA-001', nameAr: 'PT', nameEn: 'Prothrombin Time (PT)', category: 'coagulation', price: 80, isPopular: true, popularity: 1400, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL (blue top)', normalRange: [{ group: 'PT', min: 11, max: 13.5, unit: 'seconds', gender: 'all' }], turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['COA-002', 'COA-003'], tags: ['التخثر'] }),
  createTest({ id: 'COA-002', nameAr: 'INR', nameEn: 'International Normalized Ratio (INR)', category: 'coagulation', price: 90, isPopular: true, popularity: 1500, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL (blue top)', normalRange: [{ group: 'Normal', min: 0.8, max: 1.2, unit: 'INR', gender: 'all' }], turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['COA-001', 'COA-003'], tags: ['التخثر', 'شائع'] }),
  createTest({ id: 'COA-003', nameAr: 'aPTT', nameEn: 'Activated Partial Thromboplastin Time', category: 'coagulation', price: 80, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL (blue top)', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['COA-001', 'COA-002'], tags: ['التخثر'] }),
  createTest({ id: 'COA-004', nameAr: 'Fibrinogen', nameEn: 'Fibrinogen', category: 'coagulation', price: 100, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL (blue top)', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['COA-001'], tags: ['التخثر'] }),
  createTest({ id: 'COA-005', nameAr: 'D-dimer', nameEn: 'D-Dimer', category: 'coagulation', price: 200, isPopular: true, popularity: 1300, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL (blue top)', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['COA-001'], tags: ['التخثر', 'الجلطات'] }),
];

// ============================================================
// URINE TESTS (20+)
// ============================================================
const urineTests: LabTest[] = [
  createTest({ id: 'URI-001', nameAr: 'تحليل البول', nameEn: 'Urinalysis (Complete)', category: 'chemistry', price: 50, isPopular: true, popularity: 2000, sampleType: 'urine', fastingRequired: false, sampleVolume: '30 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['URI-002', 'URI-003'], tags: ['شائع', 'روتيني'] }),
  createTest({ id: 'URI-002', nameAr: 'زراعة البول', nameEn: 'Urine Culture & Sensitivity', category: 'microbiology', price: 150, sampleType: 'urine', fastingRequired: false, sampleVolume: '30 mL (midstream)', turnaroundTime: { standard: '2-3 أيام', standardHours: 72 }, relatedTestIds: ['URI-001', 'URI-003'], tags: ['العدوى'] }),
  createTest({ id: 'URI-003', nameAr: 'بروتين البول', nameEn: 'Urine Protein', category: 'chemistry', price: 40, sampleType: 'urine', fastingRequired: false, sampleVolume: '30 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['URI-001'], tags: ['الكلى'] }),
  createTest({ id: 'URI-004', nameAr: 'الجلوبيزيريد في البول', nameEn: 'Urine Glucose', category: 'chemistry', price: 30, sampleType: 'urine', fastingRequired: false, sampleVolume: '30 mL', turnaroundTime: { standard: '30 دقيقة', standardHours: 0.5 }, relatedTestIds: ['CHM-001'], tags: ['السكري'] }),
  createTest({ id: 'URI-005', nameAr: 'Ketones', nameEn: 'Urine Ketones', category: 'chemistry', price: 30, sampleType: 'urine', fastingRequired: false, sampleVolume: '30 mL', turnaroundTime: { standard: '30 دقيقة', standardHours: 0.5 }, relatedTestIds: ['CHM-001'], tags: ['السكري'] }),
  createTest({ id: 'URI-006', nameAr: 'الميكروسكوبية للبول', nameEn: 'Urine Microscopy', category: 'chemistry', price: 60, sampleType: 'urine', fastingRequired: false, sampleVolume: '30 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['URI-001'], tags: ['الكلى'] }),
  createTest({ id: 'URI-007', nameAr: 'الصبغات البولية', nameEn: 'Urine Bilirubin', category: 'chemistry', price: 40, sampleType: 'urine', fastingRequired: false, sampleVolume: '30 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-015'], tags: ['الكبد'] }),
  createTest({ id: 'URI-008', nameAr: 'الحصوات البولية', nameEn: 'Urine Stones Analysis', category: 'chemistry', price: 150, sampleType: 'urine', fastingRequired: false, sampleVolume: 'stone sample', turnaroundTime: { standard: '2-3 أيام', standardHours: 72 }, relatedTestIds: ['CHM-014'], tags: ['الحصوات'] }),
];

// ============================================================
// CARDIOLOGY TESTS (15+)
// ============================================================
const cardiologyTests: LabTest[] = [
  createTest({ id: 'CRD-001', nameAr: 'Troponin', nameEn: 'Cardiac Troponin I/T', category: 'cardiology', price: 300, isPopular: true, popularity: 1400, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CRD-002', 'CRD-003'], tags: ['القلب', 'الطوارئ'] }),
  createTest({ id: 'CRD-002', nameAr: 'CK-MB', nameEn: 'Creatine Kinase-MB', category: 'cardiology', price: 150, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CRD-001', 'CRD-003'], tags: ['القلب'] }),
  createTest({ id: 'CRD-003', nameAr: 'BNP', nameEn: 'B-type Natriuretic Peptide', category: 'cardiology', price: 350, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CRD-001'], tags: ['القلب', 'قصور القلب'] }),
  createTest({ id: 'CRD-004', nameAr: 'Homocysteine', nameEn: 'Homocysteine', category: 'cardiology', price: 200, sampleType: 'blood', fastingRequired: true, fastingDuration: '8-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['CHM-003', 'NUT-002'], tags: ['القلب'] }),
  createTest({ id: 'CRD-005', nameAr: 'LP(a)', nameEn: 'Lipoprotein(a)', category: 'cardiology', price: 250, sampleType: 'blood', fastingRequired: true, fastingDuration: '9-12 ساعة', sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['CHM-003'], tags: ['القلب'] }),
];

// ============================================================
// MOLECULAR TESTS (20+)
// ============================================================
const molecularTests: LabTest[] = [
  createTest({ id: 'MOL-001', nameAr: 'PCR كورونا', nameEn: 'COVID-19 RT-PCR', category: 'molecular', price: 200, sampleType: 'swab', fastingRequired: false, sampleVolume: 'Nasopharyngeal swab', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8, rush: 'ساعة', rushHours: 1 }, relatedTestIds: ['MOL-002'], tags: ['كورونا', 'PCR'] }),
  createTest({ id: 'MOL-002', nameAr: 'PCR فلو', nameEn: 'Influenza A/B PCR', category: 'molecular', price: 250, sampleType: 'swab', fastingRequired: false, sampleVolume: 'Nasopharyngeal swab', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['MOL-001'], tags: ['الإنفلونزا'] }),
  createTest({ id: 'MOL-003', nameAr: 'HBV DNA', nameEn: 'Hepatitis B Virus DNA (Quantitative)', category: 'molecular', price: 500, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '2-3 أيام', standardHours: 72 }, relatedTestIds: ['INF-004'], tags: ['الكبد الوبائي'] }),
  createTest({ id: 'MOL-004', nameAr: 'HCV RNA', nameEn: 'Hepatitis C Virus RNA (Quantitative)', category: 'molecular', price: 600, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '2-3 أيام', standardHours: 72 }, relatedTestIds: ['INF-005'], tags: ['الكبد الوبائي'] }),
  createTest({ id: 'MOL-005', nameAr: 'HIV Viral Load', nameEn: 'HIV-1 RNA (Quantitative)', category: 'molecular', price: 700, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '3-5 أيام', standardHours: 120 }, relatedTestIds: ['INF-003'], tags: ['الإيدز'] }),
  createTest({ id: 'MOL-006', nameAr: 'HPV', nameEn: 'Human Papillomavirus (HPV) DNA', category: 'molecular', price: 400, sampleType: 'swab', fastingRequired: false, sampleVolume: 'Cervical swab', turnaroundTime: { standard: '3-5 أيام', standardHours: 120 }, relatedTestIds: ['ONC-004'], tags: ['السرطان', 'النسائية'] }),
  createTest({ id: 'MOL-007', nameAr: 'TB PCR', nameEn: 'Mycobacterium tuberculosis PCR', category: 'molecular', price: 350, sampleType: 'sputum', fastingRequired: false, sampleVolume: 'Sputum sample', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['MOL-008'], tags: ['السل'] }),
  createTest({ id: 'MOL-008', nameAr: 'زغبة السل', nameEn: 'Acid Fast Bacilli (AFB) Smear', category: 'microbiology', price: 80, sampleType: 'sputum', fastingRequired: false, sampleVolume: 'Sputum sample', turnaroundTime: { standard: '24-48 ساعة', standardHours: 48 }, relatedTestIds: ['MOL-007'], tags: ['السل'] }),
];

// ============================================================
// RHEUMATOLOGY TESTS (15+)
// ============================================================
const rheumatologyTests: LabTest[] = [
  createTest({ id: 'RHE-001', nameAr: 'RF', nameEn: 'Rheumatoid Factor (RF)', category: 'rheumatology', price: 120, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['RHE-002', 'RHE-003'], tags: ['الروماتيزم'] }),
  createTest({ id: 'RHE-002', nameAr: 'Anti-CCP', nameEn: 'Anti-Cyclic Citrullinated Peptide', category: 'rheumatology', price: 280, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['RHE-001'], tags: ['الروماتيزم'] }),
  createTest({ id: 'RHE-003', nameAr: 'ASO', nameEn: 'Anti-Streptolysin O (ASO)', category: 'rheumatology', price: 100, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '2-4 ساعات', standardHours: 4 }, relatedTestIds: ['RHE-001'], tags: ['الروماتيزم'] }),
  createTest({ id: 'RHE-004', nameAr: 'Uric Acid', nameEn: 'Uric Acid', category: 'rheumatology', price: 50, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['CHM-014'], tags: ['النقرس'] }),
  createTest({ id: 'RHE-005', nameAr: 'Anti-Nuclear Antibody (ANA)', nameEn: 'ANA Screen', category: 'rheumatology', price: 200, sampleType: 'blood', fastingRequired: false, sampleVolume: '5 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['IMM-001'], tags: ['المناعة الذاتية'] }),
];

// ============================================================
// GYNECOLOGY TESTS (15+)
// ============================================================
const gynecologyTests: LabTest[] = [
  createTest({ id: 'GYC-001', nameAr: 'التوتر الشوكي', nameEn: 'Pap Smear', category: 'gynecology', price: 150, sampleType: 'swab', fastingRequired: false, sampleVolume: 'Cervical smear', turnaroundTime: { standard: '3-5 أيام', standardHours: 120 }, relatedTestIds: ['GYC-002', 'MOL-006'], tags: ['النسائية'] }),
  createTest({ id: 'GYC-002', nameAr: 'HPV test', nameEn: 'HPV DNA Test', category: 'gynecology', price: 400, sampleType: 'swab', fastingRequired: false, sampleVolume: 'Cervical swab', turnaroundTime: { standard: '3-5 أيام', standardHours: 120 }, relatedTestIds: ['GYC-001', 'MOL-006'], tags: ['النسائية'] }),
  createTest({ id: 'GYC-003', nameAr: 'beta-HCG', nameEn: 'Beta-hCG (Pregnancy Test)', category: 'gynecology', price: 80, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '1-2 ساعة', standardHours: 2 }, relatedTestIds: ['GYC-004'], tags: ['الحمل'] }),
  createTest({ id: 'GYC-004', nameAr: 'Test حمل بول', nameEn: 'Urine Pregnancy Test', category: 'gynecology', price: 30, sampleType: 'urine', fastingRequired: false, sampleVolume: 'Midstream urine', turnaroundTime: { standard: '15-30 دقيقة', standardHours: 0.5 }, relatedTestIds: ['GYC-003'], tags: ['الحمل', 'سريع'] }),
  createTest({ id: 'GYC-005', nameAr: 'Progesterone', nameEn: 'Progesterone (Pregnancy Support)', category: 'gynecology', price: 180, sampleType: 'blood', fastingRequired: false, sampleVolume: '3 mL', turnaroundTime: { standard: '4-8 ساعات', standardHours: 8 }, relatedTestIds: ['END-018'], tags: ['الحمل'] }),
];

// ============================================================
// ALL TESTS COMBINED
// ============================================================
export const ALL_TESTS: LabTest[] = [
  ...hematologyTests,
  ...chemistryTests,
  ...endocrinologyTests,
  ...immunologyTests,
  ...infectiousTests,
  ...oncologyTests,
  ...nutritionalTests,
  ...coagulationTests,
  ...urineTests,
  ...cardiologyTests,
  ...molecularTests,
  ...rheumatologyTests,
  ...gynecologyTests,
];

// ============================================================
// TEST PACKAGES
// ============================================================
export const TEST_PACKAGES: TestPackage[] = [
  {
    id: 'PKG-001', nameAr: 'الفحص الشامل', nameEn: 'Comprehensive Health Check',
    descriptionAr: 'فحص شامل للصحة يشمل التحاليل الأساسية والهرمونات والفيتامينات',
    descriptionEn: 'Comprehensive health check including basic tests, hormones, and vitamins',
    testIds: ['HEM-001', 'CHM-003', 'CHM-008', 'CHM-011', 'END-001', 'END-006', 'NUT-001'],
    originalPrice: 1800, packagePrice: 1299, discount: 28, popularity: 2500, tags: ['شامل', 'شائع'], category: 'Health Check',
  },
  {
    id: 'PKG-002', nameAr: 'فحص السكري الشامل', nameEn: 'Diabetes Panel',
    descriptionAr: 'فحص شامل لمرض السكري يشمل التحاليل والهرمونات والمضاعفات',
    descriptionEn: 'Comprehensive diabetes panel including tests, hormones, and complications',
    testIds: ['CHM-001', 'CHM-002', 'END-008', 'END-009', 'CHM-003', 'CHM-011'],
    originalPrice: 1200, packagePrice: 899, discount: 25, popularity: 1800, tags: ['السكري'], category: 'Diabetes',
  },
  {
    id: 'PKG-003', nameAr: 'فحص القلب', nameEn: 'Cardiac Risk Panel',
    descriptionAr: 'فحص شامل لمخاطر أمراض القلب والأوعية الدموية',
    descriptionEn: 'Comprehensive cardiovascular risk assessment panel',
    testIds: ['CHM-003', 'CRD-001', 'CRD-003', 'CRD-004', 'CRD-005', 'IMM-006'],
    originalPrice: 1500, packagePrice: 1099, discount: 27, popularity: 1600, tags: ['القلب'], category: 'Cardiac',
  },
  {
    id: 'PKG-004', nameAr: 'فحص ما قبل الزواج', nameEn: 'Pre-Marital Health Check',
    descriptionAr: 'فحص صحي شامل قبل الزواج يشمل الفحوصات الوراثية والعدوى',
    descriptionEn: 'Comprehensive pre-marital health check including genetic and infectious tests',
    testIds: ['HEM-001', 'CHM-008', 'CHM-011', 'INF-003', 'INF-004', 'INF-005', 'GEN-001'],
    originalPrice: 2000, packagePrice: 1499, discount: 25, popularity: 2000, tags: ['قبل الزواج'], category: 'Pre-Marital',
  },
  {
    id: 'PKG-005', nameAr: 'فحص التغذية', nameEn: 'Nutritional Assessment',
    descriptionAr: 'تقييم شامل للحالة التغذوية يشمل الفيتامينات والمعادن',
    descriptionEn: 'Comprehensive nutritional assessment including vitamins and minerals',
    testIds: ['NUT-001', 'NUT-002', 'NUT-003', 'NUT-004', 'NUT-006', 'NUT-008'],
    originalPrice: 1100, packagePrice: 799, discount: 27, popularity: 1400, tags: ['التغذية'], category: 'Nutrition',
  },
  {
    id: 'PKG-006', nameAr: 'فحص الغدة الدرقية', nameEn: 'Thyroid Panel',
    descriptionAr: 'فحص شامل لوظائف الغدة الدرقية والهرمونات المرتبطة',
    descriptionEn: 'Comprehensive thyroid function assessment panel',
    testIds: ['END-001', 'END-002', 'END-003', 'END-004', 'IMM-010'],
    originalPrice: 900, packagePrice: 649, discount: 28, popularity: 1500, tags: ['الدرقية'], category: 'Thyroid',
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export function getTestsByCategory(category: TestCategory): LabTest[] {
  return ALL_TESTS.filter((t) => t.category === category);
}

export function getPopularTests(limit = 10): LabTest[] {
  return [...ALL_TESTS].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

export function getFeaturedTests(): LabTest[] {
  return ALL_TESTS.filter((t) => t.isFeatured);
}

export function searchTests(query: string): LabTest[] {
  const q = query.toLowerCase();
  return ALL_TESTS.filter(
    (t) =>
      t.nameAr.includes(q) ||
      t.nameEn.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q)) ||
      t.category.includes(q)
  );
}

export function getTestById(id: string): LabTest | undefined {
  return ALL_TESTS.find((t) => t.id === id);
}

export function getRelatedTests(testId: string, limit = 6): LabTest[] {
  const test = getTestById(testId);
  if (!test) return [];
  return test.relatedTestIds
    .map((id) => getTestById(id))
    .filter(Boolean)
    .slice(0, limit) as LabTest[];
}
