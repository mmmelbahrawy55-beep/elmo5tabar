import { PrismaClient, UserRole, Gender, BloodType, TestCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const patientPasswordHash = await bcrypt.hash('Patient@123', 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@almokhtabar.com' },
    update: {},
    create: {
      email: 'admin@almokhtabar.com',
      phone: '+966501234567',
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      profile: {
        create: {
          firstNameAr: 'مدير',
          lastNameAr: 'النظام',
          firstNameEn: 'System',
          lastNameEn: 'Admin',
          gender: 'MALE',
          country: 'SA',
        },
      },
    },
  });

  // Create sample doctor
  const doctor = await prisma.user.upsert({
    where: { email: 'dr.ahmed@almokhtabar.com' },
    update: {},
    create: {
      email: 'dr.ahmed@almokhtabar.com',
      phone: '+966509876543',
      passwordHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      emailVerified: true,
      profile: {
        create: {
          firstNameAr: 'أحمد',
          lastNameAr: 'الدكتور',
          firstNameEn: 'Ahmed',
          lastNameEn: 'Doctor',
          gender: 'MALE',
          country: 'SA',
        },
      },
    },
  });

  // Create sample patient user
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: {},
    create: {
      email: 'patient@example.com',
      phone: '+966551112233',
      passwordHash: patientPasswordHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      emailVerified: true,
      profile: {
        create: {
          firstNameAr: 'محمد',
          lastNameAr: 'العميل',
          firstNameEn: 'Mohammed',
          lastNameEn: 'Customer',
          gender: 'MALE',
          dateOfBirth: new Date('1990-05-15'),
          nationality: 'SA',
          country: 'SA',
        },
      },
    },
  });

  // Create branches
  const branches = [
    {
      nameAr: 'الفرع الرئيسي - الرياض',
      nameEn: 'Main Branch - Riyadh',
      code: 'RUH-001',
      phone: '+966112345678',
      email: 'riyadh@almokhtabar.com',
      addressAr: 'طريق التحلية، حي العليا، الرياض',
      addressEn: 'Olaya Street, Al Olaya, Riyadh',
      city: 'الرياض',
      region: 'منطقة الرياض',
      latitude: 24.7136,
      longitude: 46.6753,
      operatingHours: {
        saturday_thursday: { open: '07:00', close: '23:00' },
        friday: { open: '14:00', close: '23:00' },
      },
    },
    {
      nameAr: 'فرع جدة - الروضة',
      nameEn: 'Jeddah Branch - Al Rawdah',
      code: 'JED-001',
      phone: '+966122345678',
      email: 'jeddah@almokhtabar.com',
      addressAr: 'شارع الأمير سلطان، حي الروضة، جدة',
      addressEn: 'Prince Sultan Street, Al Rawdah, Jeddah',
      city: 'جدة',
      region: 'منطقة مكة المكرمة',
      latitude: 21.5433,
      longitude: 39.1728,
      operatingHours: {
        saturday_thursday: { open: '07:00', close: '23:00' },
        friday: { open: '14:00', close: '23:00' },
      },
    },
    {
      nameAr: 'فرع الدمام',
      nameEn: 'Dammam Branch',
      code: 'DMM-001',
      phone: '+966132345678',
      email: 'dammam@almokhtabar.com',
      addressAr: 'شارع الملك سعود، حي الفيحاء، الدمام',
      addressEn: 'King Saud Street, Al Faisaliyah, Dammam',
      city: 'الدمام',
      region: 'المنطقة الشرقية',
      latitude: 26.4207,
      longitude: 50.0888,
      operatingHours: {
        saturday_thursday: { open: '07:00', close: '23:00' },
        friday: { open: '14:00', close: '23:00' },
      },
    },
  ];

  const createdBranches = [];
  for (const branch of branches) {
    const created = await prisma.branch.upsert({
      where: { code: branch.code },
      update: {},
      create: branch,
    });
    createdBranches.push(created);
  }

  // Create test categories
  const categoriesData = [
    {
      nameAr: 'التحاليل الدموية الشاملة',
      nameEn: 'Complete Blood Count',
      slug: 'cbc',
      descriptionAr: 'تحاليل الدم الشاملة لفحصHealth العامة',
      sortOrder: 1,
    },
    {
      nameAr: 'الكيمياء الحيوية',
      nameEn: 'Biochemistry',
      slug: 'biochemistry',
      descriptionAr: 'تحاليل الكيمياء الحيوية والوظائف Organs',
      sortOrder: 2,
    },
    {
      nameAr: 'الهرمونات',
      nameEn: 'Hormones',
      slug: 'hormones',
      descriptionAr: 'تحليلات الهرمونات والغدد الصماء',
      sortOrder: 3,
    },
    {
      nameAr: 'التحاليل البولية',
      nameEn: 'Urinalysis',
      slug: 'urinalysis',
      descriptionAr: 'فحص وتحليل البول',
      sortOrder: 4,
    },
    {
      nameAr: 'التحاليل المعدنية وفيتامينات',
      nameEn: 'Minerals & Vitamins',
      slug: 'minerals-vitamins',
      descriptionAr: 'قياس المعادن والفيتامينات في الجسم',
      sortOrder: 5,
    },
    {
      nameAr: 'التحاليل المناعية',
      nameEn: 'Immunology',
      slug: 'immunology',
      descriptionAr: 'تحاليل الجهاز المناعي',
      sortOrder: 6,
    },
    {
      nameAr: 'markers الورمية',
      nameEn: 'Tumor Markers',
      slug: 'tumor-markers',
      descriptionAr: ' marqueurs السرطان',
      sortOrder: 7,
    },
    {
      nameAr: 'التحاليل الجرثومية',
      nameEn: 'Microbiology',
      slug: 'microbiology',
      descriptionAr: 'زراعة وفحص البكتيريا والفطريات',
      sortOrder: 8,
    },
    {
      nameAr: 'الفحوصات الشاملة',
      nameEn: 'Health Packages',
      slug: 'packages',
      descriptionAr: 'باقات الفحوصات الصحية الشاملة',
      sortOrder: 9,
    },
    {
      nameAr: 'التحاليل الوراثية',
      nameEn: 'Genetics',
      slug: 'genetics',
      descriptionAr: 'التحاليل الوراثية والجينية',
      sortOrder: 10,
    },
  ];

  const createdCategories = [];
  for (const cat of categoriesData) {
    const created = await prisma.testCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(created);
  }

  // Create lab tests
  const testsData = [
    {
      nameAr: 'صورة الدم الشاملة (CBC)',
      nameEn: 'Complete Blood Count (CBC)',
      code: 'CBC-001',
      categoryId: createdCategories[0].id,
      descriptionAr: 'فحص شامل لخلايا الدم包括 الأكملة، الكريات الحمراء، الكريات البيضاء، والصفائح الدموية',
      sampleType: 'دم',
      tubeType: 'EDTA',
      fastingRequired: false,
      turnaroundTimeHours: 4,
      price: 45,
      popular: true,
      featured: true,
      homeCollection: true,
      referenceRange: {
        wbc: { min: 4000, max: 11000, unit: 'μL' },
        rbc: { min: 4.5, max: 5.5, unit: 'M/μL' },
        hgb: { min: 13.5, max: 17.5, unit: 'g/dL' },
        plt: { min: 150000, max: 400000, unit: 'μL' },
      },
    },
    {
      nameAr: 'الجلوكونوز (السكر التراكمي)',
      nameEn: 'HbA1c (Glycated Hemoglobin)',
      code: 'HBA1C-001',
      categoryId: createdCategories[1].id,
      descriptionAr: 'قياس متوسط مستوى السكر في الدم خلال آخر ٣ أشهر',
      sampleType: 'دم',
      tubeType: 'EDTA',
      fastingRequired: false,
      turnaroundTimeHours: 24,
      price: 85,
      popular: true,
      featured: true,
      homeCollection: true,
      referenceRange: {
        normal: { max: 5.7, unit: '%', label: 'طبيعي' },
        prediabetes: { min: 5.7, max: 6.4, unit: '%', label: 'سكري قبل سريري' },
        diabetes: { min: 6.5, unit: '%', label: 'سكري' },
      },
    },
    {
      nameAr: 'الوظائف الكبدية (LFT)',
      nameEn: 'Liver Function Tests',
      code: 'LFT-001',
      categoryId: createdCategories[1].id,
      descriptionAr: 'فحص وظائف الكبد شامل ALT, AST, ALP, Bilirubin, Albumin',
      sampleType: 'دم',
      tubeType: 'سيرا',
      fastingRequired: true,
      fastingHours: 8,
      turnaroundTimeHours: 24,
      price: 120,
      popular: true,
      homeCollection: true,
    },
    {
      nameAr: 'الوظائف الكلوية (RFT)',
      nameEn: 'Renal Function Tests',
      code: 'RFT-001',
      categoryId: createdCategories[1].id,
      descriptionAr: 'فحص وظائف الكلى شامل Creatinine, BUN, Uric Acid, eGFR',
      sampleType: 'دم',
      tubeType: 'سيرا',
      fastingRequired: true,
      fastingHours: 8,
      turnaroundTimeHours: 24,
      price: 110,
      homeCollection: true,
    },
    {
      nameAr: 'الكوليسترول الكامل (Lipid Profile)',
      nameEn: 'Lipid Profile',
      code: 'LIPID-001',
      categoryId: createdCategories[1].id,
      descriptionAr: 'فحص الدهون في الدم: الكوليسترول الكلي، HDL، LDL، التريغليسريدات',
      sampleType: 'دم',
      tubeType: 'سيرا',
      fastingRequired: true,
      fastingHours: 12,
      turnaroundTimeHours: 24,
      price: 95,
      popular: true,
      featured: true,
      homeCollection: true,
    },
    {
      nameAr: 'هرمون الغدة الدرقية (TSH)',
      nameEn: 'Thyroid Stimulating Hormone',
      code: 'TSH-001',
      categoryId: createdCategories[2].id,
      descriptionAr: 'قياس هرمون TSH لفحص وظائف الغدة الدرقية',
      sampleType: 'دم',
      tubeType: 'سيرا',
      fastingRequired: false,
      turnaroundTimeHours: 24,
      price: 75,
      popular: true,
      homeCollection: true,
    },
    {
      nameAr: 'فيتامين د (Vitamin D)',
      nameEn: 'Vitamin D (25-OH)',
      code: 'VITD-001',
      categoryId: createdCategories[4].id,
      descriptionAr: 'قياس مستوى فيتامين د في الدم',
      sampleType: 'دم',
      tubeType: 'سيرا',
      fastingRequired: false,
      turnaroundTimeHours: 48,
      price: 140,
      popular: true,
      featured: true,
      homeCollection: true,
    },
    {
      nameAr: 'فحص البول الشامل',
      nameEn: 'Complete Urinalysis',
      code: 'UA-001',
      categoryId: createdCategories[3].id,
      descriptionAr: 'فحص شامل للبول يشمل الفيزيائي والكيميائي والمجهر',
      sampleType: 'بول',
      fastingRequired: false,
      turnaroundTimeHours: 4,
      price: 35,
      popular: true,
      homeCollection: true,
    },
    {
      nameAr: 'فحص الحمل (Beta HCG)',
      nameEn: 'Pregnancy Test (Beta HCG)',
      code: 'HCG-001',
      categoryId: createdCategories[2].id,
      descriptionAr: ' xácيد أو نفي الحمل عبر قياس هرمون HCG',
      sampleType: 'دم',
      tubeType: 'سيرا',
      fastingRequired: false,
      turnaroundTimeHours: 4,
      price: 50,
      homeCollection: true,
    },
    {
      nameAr: '铁蛋白 (Ferritin)',
      nameEn: 'Ferritin',
      code: 'FERR-001',
      categoryId: createdCategories[4].id,
      descriptionAr: 'قياس مخزون الحديد في الجسم',
      sampleType: 'دم',
      tubeType: 'سيرا',
      fastingRequired: false,
      turnaroundTimeHours: 24,
      price: 70,
      homeCollection: true,
    },
    {
      nameAr: 'الباقي البولي (BUN)',
      nameEn: 'Blood Urea Nitrogen',
      code: 'BUN-001',
      categoryId: createdCategories[1].id,
      descriptionAr: 'فحص نيتروجين اليوريا في الدم',
      sampleType: 'دم',
      tubeType: 'سيرا',
      fastingRequired: true,
      fastingHours: 8,
      turnaroundTimeHours: 24,
      price: 40,
      homeCollection: true,
    },
    {
      nameAr: 'الحديد و TIBC',
      nameEn: 'Iron & TIBC',
      code: 'IRON-001',
      categoryId: createdCategories[4].id,
      descriptionAr: 'قياس الحديد والسعة الحديدية الكلية',
      sampleType: 'دم',
      tubeType: 'سيرا',
      fastingRequired: true,
      fastingHours: 12,
      turnaroundTimeHours: 24,
      price: 80,
      homeCollection: true,
    },
    {
      nameAr: 'فحص البروستاتا PSA',
      nameEn: 'Prostate Specific Antigen',
      code: 'PSA-001',
      categoryId: createdCategories[6].id,
      descriptionAr: 'فحص marqueur البروستاتا',
      sampleType: 'دم',
      tubeType: 'سيرا',
      fastingRequired: false,
      turnaroundTimeHours: 24,
      price: 100,
      homeCollection: true,
    },
    {
      nameAr: 'باقتي الفحص الشامل (رجال)',
      nameEn: 'Comprehensive Health Check (Men)',
      code: 'PKG-M-001',
      categoryId: createdCategories[8].id,
      descriptionAr: 'باقتي شاملة تشمل CBC + Chem16 + Thyroid + Lipids + Urine + HbA1c',
      sampleType: 'دم + بول',
      fastingRequired: true,
      fastingHours: 12,
      turnaroundTimeHours: 48,
      price: 599,
      discountedPrice: 499,
      popular: true,
      featured: true,
      homeCollection: true,
    },
    {
      nameAr: 'باقتي الفحص الشامل (نساء)',
      nameEn: 'Comprehensive Health Check (Women)',
      code: 'PKG-F-001',
      categoryId: createdCategories[8].id,
      descriptionAr: 'باقتي شاملة تشمل CBC + Chem16 + Thyroid + Lipids + Iron + Vitamin D + Urine',
      sampleType: 'دم + بول',
      fastingRequired: true,
      fastingHours: 12,
      turnaroundTimeHours: 48,
      price: 699,
      discountedPrice: 579,
      popular: true,
      featured: true,
      homeCollection: true,
    },
  ];

  for (const test of testsData) {
    await prisma.labTest.upsert({
      where: { code: test.code },
      update: {},
      create: test as any,
    });
  }

  // Create a sample patient record
  await prisma.patient.upsert({
    where: { nationalId: '1234567890' },
    update: {},
    create: {
      userId: patientUser.id,
      firstNameAr: 'محمد',
      lastNameAr: 'العميل',
      firstNameEn: 'Mohammed',
      lastNameEn: 'Customer',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'MALE',
      phone: '+966551112233',
      email: 'patient@example.com',
      nationalId: '1234567890',
      nationality: 'SA',
      bloodType: 'O_POSITIVE',
      insuranceProvider: 'العالمية للتأمين',
      insuranceNumber: 'INS-123456',
    },
  });

  console.log('✅ Seed data created successfully!');
  console.log('📧 Admin login: admin@almokhtabar.com / Admin@123');
  console.log('📧 Patient login: patient@example.com / Patient@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
