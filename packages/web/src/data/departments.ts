export interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  descriptionAr: string;
  descriptionEn: string;
  overviewAr: string;
  heroStats: Array<{ value: string; label: string; labelAr: string }>;
  tests: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    price: number;
    turnaround: string;
    popular: boolean;
  }>;
  medicalTeam: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    titleAr: string;
    titleEn: string;
    qualifications: string[];
    experience: string;
    specialty: string;
  }>;
  equipment: Array<{
    nameAr: string;
    nameEn: string;
    brand: string;
    description: string;
    image?: string;
  }>;
  technology: Array<{ name: string; description: string; icon: string }>;
  preparationGuide: string[];
  expectedTime: { standard: string; rush: string; stat: string };
  insurance: Array<{ provider: string; coverage: string; note: string }>;
  faqs: Array<{ question: string; answer: string }>;
  articles: Array<{
    id: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    category: string;
  }>;
  testimonials: Array<{
    id: string;
    name: string;
    text: string;
    rating: number;
    date: string;
  }>;
  relatedDepartments: string[];
  isPopular: boolean;
  order: number;
  totalTests: number;
  totalPatients: string;
  accuracy: string;
  experience: string;
}

export const ALL_DEPARTMENTS: Department[] = [
  {
    id: 'hematology',
    nameAr: 'تحليل الدم',
    nameEn: 'Hematology',
    icon: '🩸',
    color: '#DC2626',
    gradientFrom: '#DC2626',
    gradientTo: '#991B1B',
    descriptionAr: 'قسم تحليل الدم المتخصص في فحص خلايا الدم الحمراء والبيضاء والصفائح الدموية لتشخيص الأمراض الدموية.',
    descriptionEn: 'Specialized hematology department for examining red blood cells, white blood cells, and platelets.',
    overviewAr: 'يُعد قسم تحليل الدم في مختبر المختبر من أقدم وأكفأ الأقسام في المملكة العربية السعودية، حيث نستخدم أحدث تقنيات التحليل الدموي المتكامل الذي يوفر نتائج دقيقة وموثوقة خلال دقائق معدودة. يشرف على القسم نخبة من أطباء علم الدم المتميزين ذوي الخبرة الدولية الطويلة، وهم يعملون على تقديم تشخيصات استثنائية تساعد الأطباء المعالجين في وضع خطط العلاج المناسبة. يتميز القسم بقدرته على اكتشاف الأنيميا واضطرابات التخثر وأمراض الدم الوراثية بأعلى دقة ممكنة، بالإضافة إلى تقديم استشارات متخصصة في زراعة نخاع العظم وأمراض الدم الخبيثة.',
    heroStats: [
      { value: '15,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '25,000+', label: 'Patients Served', labelAr: 'مريض تم خدمتهم' },
      { value: '99.8%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '20+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'cbc', nameAr: 'صورة الدم المتكاملة', nameEn: 'Complete Blood Count', price: 45, turnaround: 'ساعتان', popular: true },
      { id: 'esr', nameAr: 'سرعة ترسب الدم', nameEn: 'ESR', price: 25, turnaround: 'ساعة واحدة', popular: false },
      { id: 'peripheral-smear', nameAr: 'صبغة الدم المحيطي', nameEn: 'Peripheral Smear', price: 35, turnaround: '4 ساعات', popular: true },
      { id: 'coagulation', nameAr: 'بروفايل التخثر', nameEn: 'Coagulation Profile', price: 85, turnaround: 'ساعتان', popular: true },
      { id: 'reticulocyte', nameAr: 'عدد الخلايا المنقاة', nameEn: 'Reticulocyte Count', price: 55, turnaround: '4 ساعات', popular: false },
      { id: 'hemoglobin-electrophoresis', nameAr: 'كهرلامة الهيموجلوبين', nameEn: 'Hemoglobin Electrophoresis', price: 120, turnaround: '72 ساعة', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-faisal-hema', nameAr: 'د. فيصل بن عبدالله الشمري', nameEn: 'Dr. Faisal Al-Shammari',
        titleAr: 'استشاري علم الدم', titleEn: 'Consultant Hematologist',
        qualifications: ['زمالة الكلية الملكية البريطانية', 'البورد السعودي في علم الدم', 'دكتوراه من جامعة هارفارد'],
        experience: '22 سنة', specialty: 'أمراض الدم الخبيثة وزراعة النخاع',
      },
      {
        id: 'dr-noura-hema', nameAr: 'د. نورة بنت سعد العتيبي', nameEn: 'Dr. Noura Al-Otaibi',
        titleAr: 'أخصائية علم الدم', titleEn: 'Hematology Specialist',
        qualifications: ['البورد السعودي في علم الدم', 'ماجستير من جامعة لندن', 'زمالة أمريكية'],
        experience: '15 سنة', specialty: 'اضطرابات التخثر وأنيميا الأطفال',
      },
    ],
    equipment: [
      { nameAr: 'جهاز تحليل الدم المتكامل', nameEn: 'Hematology Analyzer', brand: 'Sysmex XN-9000', description: 'أحدث جهاز لتحليل صورة الدم الدقيق مع قدرة على التحليل الشامل' },
      { nameAr: 'جهاز دراسة انغلاق الدم', nameEn: 'Blood Film Analyzer', brand: 'Sysmex SP-1000i', description: 'جهاز آلي لإعداد وصبغ الأشرطة الدموية بدقة عالية' },
      { nameAr: 'جهاز قياس التخثر', nameEn: 'Coagulation Analyzer', brand: 'Siemens BCS XP', description: 'جهاز متعدد المعايير لتحليل جميع بارامترات التخثر' },
    ],
    technology: [
      { name: 'Flow Cytometry', description: 'تقنية التدفق السيتومتري لتحليل الخلايا بدقة فائقة', icon: '🔬' },
      { name: 'Automated Screening', description: 'نظام فحص آلي يقلل الأخطاء البشرية', icon: '🤖' },
      { name: 'Digital Morphology', description: 'تقنيات الصور الرقمية لتحليل شكل الخلايا', icon: '📊' },
    ],
    preparationGuide: [
      'يُفضل الصيام لمدة 8-12 ساعة قبل التحليل',
      'تجنب ممارسة الرياضة القوية قبل التحليل بيوم',
      'إبلاغ المختبر بأي أدوية تتناولها بشكل منتظم',
      'جلب عينة الدم صباحاً بين الساعة 7 و10 صباحاً',
    ],
    expectedTime: { standard: '4-6 ساعات', rush: 'ساعة واحدة', stat: '30 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع اختبارات الدم شاملاً' },
      { provider: 'التعاونية', coverage: 'تغطية 80%', note: 'بإجازة الطبيب المعالج' },
      { provider: 'مدجلف', coverage: 'تغطية 75%', note: 'للفحوصات الأساسية فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية كاملة', note: 'بحد أقصى 500 ريال شهرياً' },
    ],
    faqs: [
      { question: 'هل أحتاج للصيام قبل تحليل صورة الدم؟', answer: 'يُنصح بالصيام لمدة 8-12 ساعة للحصول على نتائج أكثر دقة، خاصة عند طلب فحص الدهون والسكري مع صورة الدم.' },
      { question: 'كم من الوقت تستغرق النتائج؟', answer: 'النتائج العادية جاهزة خلال 4-6 ساعات، ويمكن الحصول على نتائج عاجلة خلال ساعة واحدة.' },
      { question: 'ما الأعراض التي تستدعي تحليل الدم العاجل؟', answer: 'الإرهاق الشديد، الشحوب، نزيف غير مبرر، وتردد العدوى يستدعي فحص الدم العاجل.' },
      { question: 'هل يمكنني تحليل الدم أثناء تناول الأدوية؟', answer: 'بعض الأدوية قد تؤثر على النتائج، لذا يُرجى إبلاغ المختبر بكل الأدوية التي تتناولها.' },
    ],
    articles: [
      { id: 'blood-tests-guide', title: 'دليل شامل لاختبارات الدم', excerpt: 'تعرف على أهم اختبارات الدم وأسباب طلبها', date: '2024-01-15', readTime: '5 دقائق', category: 'إرشادات المرضى' },
      { id: 'anemia-types', title: 'أنواع الأنيميا وطرق تشخيصها', excerpt: 'شرح مفصل لأنواع فقر الدم وأفضل اختبارات الدم لتشخيصها', date: '2024-02-20', readTime: '7 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-hema', name: 'محمد بن عبدالله الراشد', text: '取得了非常准确的诊断结果，医生团队专业且耐心，强烈推荐这家实验室！', rating: 5, date: '2024-03-10' },
      { id: 't2-hema', name: 'سارة أحمد المنصور', text: 'الخدمة ممتازة والنتائج سريعة جداً، فريق طبي متميز ومحترف. أنصح الجميع.', rating: 5, date: '2024-02-18' },
      { id: 't3-hema', name: 'خالد بن سعد المالكي', text: 'تحاليل دقيقة وخدمة عملاء ممتازة، التجربة كانت مميزة من حيث الجودة والسرعة.', rating: 4, date: '2024-01-25' },
    ],
    relatedDepartments: ['clinical-chemistry', 'immunology', 'serology'],
    isPopular: true, order: 1, totalTests: 45, totalPatients: '25,000+', accuracy: '99.8%', experience: '20+ سنة',
  },

  {
    id: 'clinical-chemistry',
    nameAr: 'الكيمياء السريرية',
    nameEn: 'Clinical Chemistry',
    icon: '🧪',
    color: '#3B82F6',
    gradientFrom: '#3B82F6',
    gradientTo: '#1D4ED8',
    descriptionAr: 'قسم الكيمياء السريرية المتخصص في تحليل المواد الكيميائية في الدم والسوائل الجسمية المختلفة.',
    descriptionEn: 'Specialized clinical chemistry department for analyzing chemical substances in blood and body fluids.',
    overviewAr: 'يُعد قسم الكيمياء السريرية من أهم الأقسام في مختبر المختبر، حيث نقدم أكثر من 200 اختبار كيميائي متنوع يشمل فحوصات وظائف الأعضاء الرئيسية مثل الكبد والكلى والقلب والغدد الصماء. يتميز القسم بأحدث الأجهزة الأوتوماتيكية التي تضمن سرعة التنفيذ ودقة النتائج على مدار الساعة. يضم القسم نخبة من الكيميائيين والتقنيين المدربين على أعلى مستوى دولي، ويعملون وفقاً لمعايير الجودة الدولية الصارمة. نحرص على توفير بيئة عمل متكاملة تجمع بين الدقة العلمية والخدمة المتميزة للمرضى.',
    heroStats: [
      { value: '200+', label: 'Tests Available', labelAr: 'اختبار متاح' },
      { value: '30,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.9%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '18+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'lft', nameAr: 'وظائف الكبد', nameEn: 'Liver Function Tests', price: 85, turnaround: 'ساعتان', popular: true },
      { id: 'kft', nameAr: 'وظائف الكلى', nameEn: 'Kidney Function Tests', price: 75, turnaround: 'ساعتان', popular: true },
      { id: 'lipid', nameAr: 'بروفايل الدهون', nameEn: 'Lipid Profile', price: 65, turnaround: 'ساعتان', popular: true },
      { id: 'glucose-fasting', nameAr: 'السكر الصائم', nameEn: 'Fasting Glucose', price: 25, turnaround: 'ساعة واحدة', popular: true },
      { id: 'hba1c', nameAr: 'الهيموجلوبين السكري', nameEn: 'HbA1c', price: 55, turnaround: '4 ساعات', popular: true },
      { id: 'uric-acid', nameAr: 'حمض البوليك', nameEn: 'Uric Acid', price: 30, turnaround: 'ساعتان', popular: false },
      { id: 'electrolytes', nameAr: 'الإلكتروليتات', nameEn: 'Electrolytes Panel', price: 45, turnaround: 'ساعة واحدة', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-abdullah-chem', nameAr: 'د. عبدالله بن أحمد القحطاني', nameEn: 'Dr. Abdullah Al-Qahtani',
        titleAr: 'استشاري الكيمياء السريرية', titleEn: 'Consultant Clinical Chemist',
        qualifications: ['البورد الأمريكي في الكيمياء السريرية', 'دكتوراه من جامعة تورنتو', 'زمالة بريطانية'],
        experience: '25 سنة', specialty: 'كيمياء الأنسجة والتشخيص الجزيئي',
      },
      {
        id: 'dr-sara-chem', nameAr: 'د. سارة بنت خالد الدوسري', nameEn: 'Dr. Sara Al-Dosari',
        titleAr: 'أخصائية كيمياء سريرية', titleEn: 'Clinical Chemistry Specialist',
        qualifications: ['البورد السعودي في الكيمياء السريرية', 'ماجستير من جامعة ميشيغان', 'دبلوم عالي في إدارة المختبرات'],
        experience: '14 سنة', specialty: 'كيمياء التحاليل الدموية والسيروم',
      },
    ],
    equipment: [
      { nameAr: 'جهاز التحليل الكيميائي الآلي', nameEn: 'Chemistry Analyzer', brand: 'Roche Cobas 8000', description: 'جهاز متعدد الوحدات لتحليل أكثر من 200 معيار كيميائي بسرعة فائقة' },
      { nameAr: 'جهاز تحليل غازات الدم', nameEn: 'Blood Gas Analyzer', brand: 'ABL90 FLEX PLUS', description: 'جهاز متعدد المعايير لتحليل غازات الدم والأيونات والسكريات' },
      { nameAr: 'جهاز التحليل الآلي المتكامل', nameEn: 'Integrated Analyzer', brand: 'Beckman Coulter AU5800', description: 'نظام متكامل للتحليل الكيميائي السريع والمكونات الدموية' },
    ],
    technology: [
      { name: 'Automated Workflow', description: 'نظام عمل آلي يقلل التدخل البشري ويضمن الدقة', icon: '⚙️' },
      { name: 'Real-time QC', description: 'نظام مراقبة الجودة الفورية لضمان دقة النتائج', icon: '🎯' },
      { name: 'Result Validation', description: 'نظام التحقق الإلكتروني من النتائج قبل الإصدار', icon: '✅' },
    ],
    preparationGuide: [
      'الصيام لمدة 10-12 ساعة قبل تحليل السكر والدهون',
      'تجنب تناول الطعام الغني بالدهون قبل التحليل بيوم',
      'شرب الماء بكميات كافية قبل أخذ العينة',
      'تجنب الكحول قبل التحليل بيوم على الأقل',
    ],
    expectedTime: { standard: '3-5 ساعات', rush: '45 دقيقة', stat: '20 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع الاختبارات الكيميائية' },
      { provider: 'التعاونية', coverage: 'تغطية 85%', note: 'بالإضافة إلى الفحوصات الإضافية' },
      { provider: 'مدجلف', coverage: 'تغطية 80%', note: 'للفحوصات الأساسية والمتقدمة' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 90%', note: 'بحد أقصى 800 ريال شهرياً' },
    ],
    faqs: [
      { question: 'ما الفرق بين وظائف الكبد وظائف الكلى؟', answer: 'وظائف الكبد تقي صحة الكبد وقدرته على أداء وظائفه، بينما وظائف الكلى تقي صحة الكلى وقدرتها على تنقية الدم.' },
      { question: 'هل يمكنني تناول الطعام قبل تحليل الكيمياء السريرية؟', answer: 'لا يُنصح بتناول الطعام قبل تحليل الكيمياء السريرية خاصة السكر والدهون، ويجب الصيام 10-12 ساعة.' },
      { question: 'ما أسباب ارتفاع السكر في الدم؟', answer: 'ارتفاع السكر قد يدل على مرض السكري أو الالتهابات أو بعض الأدوية أو اضطرابات الغدد الصماء.' },
      { question: 'كم من الوقت تستغرق النتائج؟', answer: 'النتائج العادية خلال 3-5 ساعات، والنتائج العاجلة خلال 45 دقيقة، وحالات الطوارئ خلال 20 دقيقة.' },
    ],
    articles: [
      { id: 'cholesterol-guide', title: 'دليل فهم مستوى الكوليسترول', excerpt: 'شرح مفصل لمكونات الكوليسترول وأثرها على صحة القلب', date: '2024-02-10', readTime: '6 دقائق', category: 'مقالات طبية' },
      { id: 'liver-health', title: 'كيفية الحفاظ على صحة الكبد', excerpt: 'نصائح طبية للحفاظ على صحة الكبد وتجنب الأمراض', date: '2024-01-28', readTime: '5 دقائق', category: 'نصائح صحية' },
    ],
    testimonials: [
      { id: 't1-chem', name: 'عبدالرحمن بن فيصل النعيمي', text: 'النتائج دقيقة جداً والخدمة سريعة، أنصح الجميع بتجربة هذا المختبر المتميز.', rating: 5, date: '2024-03-05' },
      { id: 't2-chem', name: 'منال بنت محمد العتيبي', text: 'تجربة ممتازة من حيث الجودة والسرعة، فريق العمل محترف وودود.', rating: 5, date: '2024-02-12' },
      { id: 't3-chem', name: 'عمر بن سلطان الحربي', text: 'خدمات متميزة وأسعار معقولة مقارنة بالجودة العالية التي يقدمها المختبر.', rating: 4, date: '2024-01-20' },
    ],
    relatedDepartments: ['hematology', 'liver-function', 'diabetes'],
    isPopular: true, order: 2, totalTests: 200, totalPatients: '30,000+', accuracy: '99.9%', experience: '18+ سنة',
  },

  {
    id: 'microbiology',
    nameAr: 'الميكروبيولوجي',
    nameEn: 'Microbiology',
    icon: '🦠',
    color: '#F59E0B',
    gradientFrom: '#F59E0B',
    gradientTo: '#D97706',
    descriptionAr: 'قسم الميكروبيولوجي المتخصص في اكتشاف ودراسة الكائنات الدقيقة المسببة للأمراض.',
    descriptionEn: 'Specialized microbiology department for detecting and studying disease-causing microorganisms.',
    overviewAr: 'يُعد قسم الميكروبيولوجي حجر الزاوية في مختبر المختبر لتشخيص الأمراض المعدية، حيث نستخدم أحدث تقنيات الزراعة والتعريف للبكتيريا والفطريات والطفيليات. يتميز القسم بوجود جهاز تعريف الكائنات الدقيقة الآلي الذي يوفر تشخيصاً دقيقاً وسريعاً، بالإضافة إلى مختبر مجهز بالكامل لإجراء اختبارات الحساسية للمضادات الحيوية. يضم القسم فريقاً طبياً متميزاً من أطباء الميكروبيولوجي والتقنيين المدربين على أعلى مستوى.',
    heroStats: [
      { value: '500+', label: 'Pathogens Identified', labelAr: 'مسبب مرضي تم تحديده' },
      { value: '12,000+', label: 'Cultures Monthly', labelAr: 'زراعة شهرياً' },
      { value: '99.5%', label: 'Identification Rate', labelAr: 'معدل التحديد' },
      { value: '22+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'blood-culture', nameAr: 'زراعة الدم', nameEn: 'Blood Culture', price: 95, turnaround: '24-72 ساعة', popular: true },
      { id: 'urine-culture', nameAr: 'زراعة البول', nameEn: 'Urine Culture', price: 55, turnaround: '24-48 ساعة', popular: true },
      { id: 'wound-culture', nameAr: 'زراعة الجروح', nameEn: 'Wound Culture', price: 65, turnaround: '48-72 ساعة', popular: true },
      { id: 'stool-culture', nameAr: 'زراعة البراز', nameEn: 'Stool Culture', price: 50, turnaround: '48-72 ساعة', popular: false },
      { id: 'sputum-culture', nameAr: 'زراعة البلغم', nameEn: 'Sputum Culture', price: 45, turnaround: '48-72 ساعة', popular: false },
      { id: 'antibiotic-sensitivity', nameAr: 'حساسية المضادات الحيوية', nameEn: 'Antibiotic Sensitivity', price: 75, turnaround: '24-48 ساعة', popular: true },
      { id: 'tb-culture', nameAr: 'زراعة السل', nameEn: 'TB Culture', price: 120, turnaround: '2-8 أسابيع', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-mohammed-micro', nameAr: 'د. محمد بن عمر الفيفي', nameEn: 'Dr. Mohammed Al-Fifi',
        titleAr: 'استشاري الميكروبيولوجي', titleEn: 'Consultant Microbiologist',
        qualifications: ['زمالة الكيتنية البريطانية', 'البورد السعودي في الميكروبيولوجي', 'دكتوراه من جامعة أكسفورد'],
        experience: '24 سنة', specialty: 'البكتيريا المقاومة للمضادات',
      },
      {
        id: 'dr-fatima-micro', nameAr: 'د. فاطمة بنت علي الزهراني', nameEn: 'Dr. Fatima Al-Zahrani',
        titleAr: 'أخصائية ميكروبيولوجي', titleEn: 'Microbiology Specialist',
        qualifications: ['البورد السعودي في الميكروبيولوجي', 'ماجستير من جامعة تورنتو', 'دورة في التحديد الجزيئي'],
        experience: '16 سنة', specialty: 'الفطريات والطفيليات',
      },
      {
        id: 'dr-ahmed-micro', nameAr: 'د. أحمد بن يوسف البحيري', nameEn: 'Dr. Ahmed Al-Bahiri',
        titleAr: 'أخصائي ميكروبيولوجي سريري', titleEn: 'Clinical Microbiologist',
        qualifications: ['البورد الأمريكي', 'ماجستير من جامعة جونز هوبكنز', 'زمالة ألمانية'],
        experience: '12 سنة', specialty: 'الميكروبيولوجي الجزيئي',
      },
    ],
    equipment: [
      { nameAr: 'جهاز تعريف الكائنات الدقيقة', nameEn: 'Microbial ID System', brand: 'bioMérieux VITEK 2', description: 'نظام آلي لتحديد الكائنات الدقيقة وفحص الحساسية للمضادات الحيوية' },
      { nameAr: 'جهاز زراعة الدم الآلي', nameEn: 'Automated Blood Culture', brand: 'bioMérieux BacT/ALERT', description: 'نظام مراقبة آلي لكشف نمو الكائنات الدقيقة في زرعات الدم' },
      { nameAr: 'جهاز PCR في الوقت الحقيقي', nameEn: 'Real-Time PCR', brand: 'Applied Biosystems 7500', description: 'جهاز التفاعل البوليميراسي المتسلسل للكشف الجزيئي' },
    ],
    technology: [
      { name: 'MALDI-TOF MS', description: 'تقنية التحليل الجزيئي السريع لتحديد الكائنات الدقيقة', icon: '🧬' },
      { name: 'Automated AST', description: 'نظام الحساسية الآلي للمضادات الحيوية', icon: '💊' },
      { name: 'Molecular Diagnostics', description: 'التشخيص الجزيئي المتطور للكشف المبكر', icon: '🔬' },
    ],
    preparationGuide: [
      'جمع العينة في وعاء نظيف ومعقم من المختبر',
      'تجنب استخدام المضادات الحيوية قبل جمع العينة بيومين على الأقل',
      'التواص مع المختبر لتحديد الطريقة المثلى لجمع العينة',
      'حفظ العينة في درجة حرارة الغرفة حتى وصولها للمختبر',
    ],
    expectedTime: { standard: '48-72 ساعة', rush: '24 ساعة', stat: '12 ساعة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'لجميع زرعات الكائنات الدقيقة' },
      { provider: 'التعاونية', coverage: 'تغطية 75%', note: 'بالإضافة إلى اختبارات الحساسية' },
      { provider: 'مدجلف', coverage: 'تغطية 70%', note: 'للفحوصات الأساسية فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 85%', note: 'بحد أقصى 600 ريال شهرياً' },
    ],
    faqs: [
      { question: 'كم من الوقت تستغرق نتائج الزراعة؟', answer: 'تعتمد على نوع العينة والمسبب المرضي، فالبكتيريا خلال 24-48 ساعة، والفطريات 5-7 أيام، والسل 2-8 أسابيع.' },
      { question: 'لماذا نحتاج لاختبار الحساسية مع الزراعة؟', answer: 'اختبار الحساسية يحدد المضاد الحيوي الفعال ضد البكتيريا المسببة للمرض، مما يساعد في اختيار العلاج المناسب.' },
      { question: 'ما هي البكتيريا المقاومة للمضادات الحيوية؟', answer: 'بكتيريا تطورت لمقاومة المضادات الحيوية التقليدية، ومن أشهرها MRSA وCRE، وهي تحتاج علاجاً خاصاً.' },
      { question: 'هل يمكنني جمع العينة في المنزل؟', answer: 'نعم، يمكن جمع بعض العينات مثل البول والبلغم في المنزل، وسيزودك المختبر بعبوات وتعليمات.' },
    ],
    articles: [
      { id: 'antibiotic-resistance', title: 'مقاومة المضادات الحيوية: التحدي الأكبر', excerpt: 'شرح لظاهرة مقاومة المضادات الحيوية وكيفية مواجهتها', date: '2024-03-05', readTime: '8 دقائق', category: 'مقالات طبية' },
      { id: 'infection-prevention', title: 'طرق الوقاية من العدوى', excerpt: 'نصائح عملية للوقاية من العدوى المستشفيية', date: '2024-02-15', readTime: '6 دقائق', category: 'نصائح صحية' },
    ],
    testimonials: [
      { id: 't1-micro', name: 'سعود بن خالد السبيعي', text: 'الزراعة والحساسية كانتا دقيقة جداً، وساعدتني الطبيب في اختيار العلاج المناسب بسرعة.', rating: 5, date: '2024-03-12' },
      { id: 't2-micro', name: 'هند بنت عبدالعزيز الشمري', text: 'خدمة ممتازة وفريق طبي محترف، النتائج وصلت في الوقت المحدد وبدقة عالية.', rating: 5, date: '2024-02-25' },
      { id: 't3-micro', name: 'ياسر بن محمد الطائي', text: 'تجربة جيدة جداً من حيث الجودة والسرعة، أنصح بالتعامل مع هذا المختبر.', rating: 4, date: '2024-01-30' },
    ],
    relatedDepartments: ['bacteriology', 'virology', 'parasitology'],
    isPopular: true, order: 3, totalTests: 85, totalPatients: '12,000+', accuracy: '99.5%', experience: '22+ سنة',
  },

  {
    id: 'immunology',
    nameAr: 'المناعة',
    nameEn: 'Immunology',
    icon: '🛡️',
    color: '#10B981',
    gradientFrom: '#10B981',
    gradientTo: '#059669',
    descriptionAr: 'قسم المناعة المتخصص في فحص الجهاز المناعي واضطرابات المناعة الذاتية.',
    descriptionEn: 'Specialized immunology department for examining the immune system and autoimmune disorders.',
    overviewAr: 'يُعد قسم المناعة في مختبر المختبر من أكثر الأقسام تطوراً تقنياً، حيث نستخدم أحدث تقنيات التحليل المناعي لتشخيص اضطرابات الجهاز المناعي والأمراض المناعية الذاتية. يشتمل القسم على اختبارات متقدمة مثل تحاليل الأجسام المضادة والبروتينات المناعية والخلايا المناعية، مما يوفر تشخيصاً شاملاً لأمراض مثل التصلب اللويحي والتهاب المفاصل الروماتيدي والذئبة الحمراء. يعمل في القسم فريق من المتخصصين في المناعة السريرية ذوي الخبرة الدولية الطويلة.',
    heroStats: [
      { value: '80+', label: 'Autoimmune Tests', labelAr: 'اختبار مناعي' },
      { value: '8,000+', label: 'Patients Annually', labelAr: 'مريض سنوياً' },
      { value: '99.6%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '16+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'immunoglobulins', nameAr: 'البروتينات المناعية IgG, IgM, IgA', nameEn: 'Immunoglobulins Panel', price: 95, turnaround: '24 ساعة', popular: true },
      { id: 'ana', nameAr: 'الجسم المضاد للنواة', nameEn: 'Antinuclear Antibody', price: 85, turnaround: '48 ساعة', popular: true },
      { id: 'complement', nameAr: 'المكمال المناعي C3, C4', nameEn: 'Complement C3, C4', price: 75, turnaround: '24 ساعة', popular: true },
      { id: 'rf', nameAr: 'العامل الروماتيدي', nameEn: 'Rheumatoid Factor', price: 55, turnaround: '24 ساعة', popular: true },
      { id: 'anti-ds-dna', nameAr: 'المضاد للحمض النووي المزدوج', nameEn: 'Anti-dsDNA', price: 110, turnaround: '72 ساعة', popular: false },
      { id: 'crp-hs', nameAr: 'البروتين التفاعلي عالي الحساسية', nameEn: 'High-Sensitivity CRP', price: 45, turnaround: 'ساعتان', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-khaled-imm', nameAr: 'د. خالد بن عبدالرحمن الحارثي', nameEn: 'Dr. Khaled Al-Harthi',
        titleAr: 'استشاري المناعة السريرية', titleEn: 'Consultant Clinical Immunologist',
        qualifications: ['زمالة أمريكية في المناعة', 'البورد السعودي', 'دكتوراه من جامعة ميشيغان'],
        experience: '20 سنة', specialty: 'الأمراض المناعية الذاتية',
      },
      {
        id: 'dr-lama-imm', nameAr: 'د. لمى بنت عادل المطيري', nameEn: 'Dr. Lama Al-Mutairi',
        titleAr: 'أخصائية مناعة سريرية', titleEn: 'Clinical Immunology Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة مانشستر', 'دورة في الفلوسايتومتري'],
        experience: '13 سنة', specialty: 'الحساسية والمناعة الخلوية',
      },
    ],
    equipment: [
      { nameAr: 'جهاز الفلوسايتومتري متعدد الألوان', nameEn: 'Flow Cytometer', brand: 'BD FACSCanto II', description: 'جهاز متعدد الألوان لتحليل الخلايا المناعية بدقة عالية' },
      { nameAr: 'جهاز الكشف عن الأجسام المضادة', nameEn: 'Immunoassay Analyzer', brand: 'Siemens Atellica IM', description: 'جهاز متعدد المعايير لتحليل الأجسام المضادة والبروتينات المناعية' },
      { nameAr: 'جهاز تحليل البروتين الكهربائي', nameEn: 'Protein Electrophoresis', brand: 'Helena SPIFE 3000', description: 'نظام متقدم لتحليل البروتين الكهربائي في مصل الدم' },
    ],
    technology: [
      { name: 'Multiplex Assays', description: 'تقنية التحليل المتعدد لقياس عدة عوامل مناعية في عينة واحدة', icon: '🧪' },
      { name: 'Flow Cytometry', description: 'تحليل الخلايا المناعية باستخدام الفلوسايتومتري المتعدد', icon: '🔬' },
      { name: 'Autoantibody Detection', description: 'كشف متقدم للكشف عن الأجسام المضادة للذات', icon: '🎯' },
    ],
    preparationGuide: [
      'لا يحتاج التحليل المناعي لصيام في معظم الحالات',
      'إبلاغ الطبيب بأي أدوية مناعية تتناولها',
      'تجنب تناول مكملات الفيتامينات قبل التحليل بيوم',
      'جلب العينة في الصباح الباكر للحصول على أفضل النتائج',
    ],
    expectedTime: { standard: '24-48 ساعة', rush: '12 ساعة', stat: '6 ساعات' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'لجميع تحاليل المناعة المتقدمة' },
      { provider: 'التعاونية', coverage: 'تغطية 80%', note: 'تحتاج إجازة مسبقة' },
      { provider: 'مدجلف', coverage: 'تغطية 75%', note: 'للفحوصات الأساسية والمتقدمة' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 85%', note: 'بحد أقصى 700 ريال شهرياً' },
    ],
    faqs: [
      { question: 'متى يطلب الطبيب تحليل المناعة؟', answer: 'عند الشبهة بمرض مناعي ذاتي مثل الذئبة أو التصلب اللويحي، أو عند تكرار العدوى.' },
      { question: 'هل تحليل المناعة يحتاج صيام؟', answer: 'معظم تحاليل المناعة لا تحتاج صيام، لكن يُنصح بتجنب وجبات الدهون الثقيلة.' },
      { question: 'ما الفرق بين الإيجابية والنسبية في الأجسام المضادة؟', answer: 'الإيجابية تدل على وجود الجسم المضاد، بينما النسبية تدل على قوته ويجب تفسيرها سريرياً.' },
      { question: 'هل الأمراض المناعية قابلة للشفاء؟', answer: 'بعضها قابل للسيطرة عليه بالعلاج المستمر، بينما بعضها قد يكون مزمناً ويحتاج متابعة طويلة.' },
    ],
    articles: [
      { id: 'autoimmune-diseases', title: 'الأمراض المناعية الذاتية: دليل شامل', excerpt: 'شرح مفصل لأهم الأمراض المناعية الذاتية وطرق تشخيصها', date: '2024-03-01', readTime: '10 دقائق', category: 'مقالات طبية' },
      { id: 'immune-boost', title: 'كيفية تعزيز الجهاز المناعي', excerpt: 'نصائح عملية لتقوية الجهاز المناعي والوقاية من الأمراض', date: '2024-02-05', readTime: '5 دقائق', category: 'نصائح صحية' },
    ],
    testimonials: [
      { id: 't1-imm', name: 'نورة بنت سعود الهاجري', text: 'التحاليل دقيقة جداً وساعدتني في تشخيص مرض المناعة الذاتي بشكل مبكر.', rating: 5, date: '2024-03-08' },
      { id: 't2-imm', name: 'طارق بن أحمد القرني', text: 'فريق طبي متميز ونتائج سريعة، خدمة استثنائية بالفعل.', rating: 5, date: '2024-02-20' },
      { id: 't3-imm', name: 'رنا بنت خالد الغامدي', text: 'تجربة ممتازة من جميع الجوانب، أنصح الجميع بزيارة هذا المختبر.', rating: 4, date: '2024-01-15' },
    ],
    relatedDepartments: ['serology', 'hematology', 'histopathology'],
    isPopular: false, order: 4, totalTests: 80, totalPatients: '8,000+', accuracy: '99.6%', experience: '16+ سنة',
  },

  {
    id: 'serology',
    nameAr: 'السيروكيمياء',
    nameEn: 'Serology',
    icon: '💧',
    color: '#8B5CF6',
    gradientFrom: '#8B5CF6',
    gradientTo: '#6D28D9',
    descriptionAr: 'قسم السيروكيمياء المتخصص في تحليل الأجسام المضادة وال抗原 في مصل الدم.',
    descriptionEn: 'Specialized serology department for analyzing antibodies and antigens in blood serum.',
    overviewAr: 'يُعد قسم السيروكيمياء من أهم الأقسام الداعمة في مختبر المختبر، حيث نقدم تحاليل دقيقة للكشف عن الأجسام المضادة وال抗原 في مصل الدم لتشخيص الأمراض المعدية والمناعية. يتخصص القسم في تحاليل فيروس نقص المناعة البشرية والتهاب الكبد الوبائي وأمراض المناعة الذاتية. يتميز القسم باستخدام أحدث تقنيات التفاعل المناعي المرتبط بالإنزيم ELISA والتحليل الكيميائي المناعي المضيء، مما يوفر دقة استثنائية في النتائج. يضم القسم فريقاً من الكيميائيين المتخصصين في السيروكيمياء ذوي خبرة واسعة في تفسير النتائج وتقديم الاستشارات للأطباء المعالجين.',
    heroStats: [
      { value: '100+', label: 'Serology Tests', labelAr: 'اختبار سيروكيميائي' },
      { value: '18,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.7%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '19+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'hiv-antibody', nameAr: 'الجسم المضاد لفيروس نقص المناعة', nameEn: 'HIV Antibody Test', price: 65, turnaround: '24 ساعة', popular: true },
      { id: 'hepatitis-panel', nameAr: 'بروفايل التهاب الكبد', nameEn: 'Hepatitis Panel (A, B, C)', price: 120, turnaround: '24 ساعة', popular: true },
      { id: 'rubella-igm-igg', nameAr: 'مضادات الحصبة الألمانية IgM & IgG', nameEn: 'Rubella IgM & IgG', price: 85, turnaround: '24 ساعة', popular: false },
      { id: 'toxo-igm-igg', nameAr: 'مضادات المقوامات IgM & IgG', nameEn: 'Toxoplasma IgM & IgG', price: 90, turnaround: '48 ساعة', popular: false },
      { id: 'asot', nameAr: 'المضاد للestreptوليز O', nameEn: 'ASO Titer', price: 45, turnaround: '24 ساعة', popular: true },
      { id: 'crp-quantitative', nameAr: 'البروتين التفاعلي الكمي', nameEn: 'CRP Quantitative', price: 40, turnaround: 'ساعتان', popular: true },
      { id: 'monospot', nameAr: 'اختبار مونوسبوت', nameEn: 'Monospot Test', price: 50, turnaround: 'ساعة واحدة', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-khalid-sero', nameAr: 'د. خالد بن سعيد الماجد', nameEn: 'Dr. Khalid Al-Majed',
        titleAr: 'استشاري السيروكيمياء', titleEn: 'Consultant Serologist',
        qualifications: ['البورد السعودي في المختبرات', 'ماجستير من جامعة ملبورن', 'زمالة في السيروكيمياء السريرية'],
        experience: '21 سنة', specialty: 'التحاليل المناعية والسيروولوجية',
      },
      {
        id: 'dr-mona-sero', nameAr: 'د. منى بنت حسن العنزي', nameEn: 'Dr. Mona Al-Anzi',
        titleAr: 'أخصائية سيروكيمياء', titleEn: 'Serology Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة مانشستر', 'خبرة في المراكز الطبية الكبرى'],
        experience: '14 سنة', specialty: 'تحاليل الفيروسات المناعية',
      },
    ],
    equipment: [
      { nameAr: 'جهاز التحليل المناعي الآلي', nameEn: 'Immunoassay Analyzer', brand: 'Roche Elecsys 2010', description: 'نظام electrochemiluminescence عالي الأداء لتحليل الأجسام المضادة' },
      { nameAr: 'جهاز ELISA الآلي', nameEn: 'Automated ELISA Processor', brand: 'Dynex DS2', description: 'معالج آلي لاختبارات ELISA مع قراءة فورية للنتائج' },
      { nameAr: 'جهاز الـ Chemiluminescence', nameEn: 'Chemiluminescence Analyzer', brand: 'Abbott ARCHITECT', description: 'نظام كيمياء مضيئة عالي الحساسية للتحاليل السيروولوجية' },
    ],
    technology: [
      { name: 'ELISA Technology', description: 'تقنية التفاعل المناعي المرتبط بالإنزيم للكشف الدقيق', icon: '🧫' },
      { name: 'Chemiluminescence', description: 'كيمياء مضيئة عالية الحساسية للكشف عن الأجسام المضادة', icon: '✨' },
      { name: 'Automated Processing', description: 'معالجة آلي للعينات تقلل الأخطاء وتزيد الكفاءة', icon: '⚙️' },
    ],
    preparationGuide: [
      'لا يحتاج معظم تحاليل السيروكيمياء لصيام',
      'إبلاغ المختبر إذا كنت حاملاً أو تخطط للحمل',
      'جلب العينة صباحاً للحصول على نتائج أكثر دقة',
      'تجنب أخذ عينة الدم خلال الأسبوع الأول من العدوى للحصول على نتيجة دقيقة',
    ],
    expectedTime: { standard: '24-48 ساعة', rush: '12 ساعة', stat: '4 ساعات' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع تحاليل السيروكيمياء' },
      { provider: 'التعاونية', coverage: 'تغطية 80%', note: 'تحتاج إجازة مسبقة' },
      { provider: 'مدجلف', coverage: 'تغطية 75%', note: 'لفحوصات فيروسات الكبد فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 85%', note: 'بحد أقصى 650 ريال شهرياً' },
    ],
    faqs: [
      { question: 'متى أجد نتائج تحاليل السيروكيمياء؟', answer: 'معظم النتائج جاهزة خلال 24-48 ساعة، وبعض التحاليل المتقدمة تحتاج 72 ساعة.' },
      { question: 'هل تحاليل فيروس الكبد تحتاج صيام؟', answer: 'لا تحتاج تحاليل فيروسات الكبد لصيام، لكن يُنصح بعدم تناول وجبات دسمة قبل التحليل.' },
      { question: 'ماذا يعني وجود أجسام مضادة لفيروس الكبد؟', answer: 'وجود الأجسام المضادة قد يعني عدوى حالية أو سابقة أو تطعيم ناجح، ويجب تفسيرها مع التاريخ المرضي.' },
      { question: 'هل يمكنني فحص فيروس نقص المناعة بشكل سري؟', answer: 'نعم، نوفر فحصاً سرياً ومضمون السرية لفيروس نقص المناعة البشرية مع استشارة طبية.' },
    ],
    articles: [
      { id: 'hepatitis-guide', title: 'دليل شامل لأمراض الكبد الوبائية', excerpt: 'شرح لأنواع التهاب الكبد وطرق انتقاله وطرق الوقاية والعلاج', date: '2024-01-20', readTime: '8 دقائق', category: 'مقالات طبية' },
      { id: 'serology-basics', title: 'أساسيات تحاليل السيروكيمياء', excerpt: 'فهم تحاليل الأجسام المضادة وكيفية تفسيرها', date: '2024-02-10', readTime: '6 دقائق', category: 'إرشادات المرضى' },
    ],
    testimonials: [
      { id: 't1-sero', name: 'عبدالعزيز بن ناصر العمري', text: 'النتائج وصلت بسرعة كبيرة والفريق الطبي كان محترفاً جداً، تجربة ممتازة.', rating: 5, date: '2024-03-15' },
      { id: 't2-sero', name: 'سمية بنت فهد الخالدي', text: 'مختبر نظيف ومجهز بأحدث الأجهزة، والأسعار معقولة مقارنة بالسوق.', rating: 5, date: '2024-02-08' },
      { id: 't3-sero', name: 'أحمد بن محمد العنزي', text: 'خدمة ممتازة ونتائج دقيقة، أراجع هذا المختبر دائماً لجميع تحاليلي.', rating: 4, date: '2024-01-22' },
    ],
    relatedDepartments: ['immunology', 'microbiology', 'virology'],
    isPopular: true, order: 5, totalTests: 100, totalPatients: '18,000+', accuracy: '99.7%', experience: '19+ سنة',
  },

  {
    id: 'histopathology',
    nameAr: 'التشريح المرضي',
    nameEn: 'Histopathology',
    icon: '🔬',
    color: '#7C3AED',
    gradientFrom: '#7C3AED',
    gradientTo: '#5B21B6',
    descriptionAr: 'قسم التشريح المرضي المتخصص في فحص الأنسجة المصابة لتشخيص الأمراض والورمات.',
    descriptionEn: 'Specialized histopathology department for examining diseased tissues to diagnose diseases and tumors.',
    overviewAr: 'يُعد قسم التشريح المرضي في مختبر المختبر المرجع الأول في المملكة لتشخيص الأمراض النسيجية والورمية، حيث نستخدم أحدث تقنيات التلوين والتحليل النسيجي لفحص العينات الجراحية والخزعات. يتميز القسم بوجود أطباء تشريح مرضي استشاريين ذوي خبرة دولية واسعة في تشخيص الأورام الحميدة والخبيثة. نلتزم بأعلى معايير الجودة في تحضير العينات وصبغها وتفسيرها، مع توفير تقارير مفصلة تساعد الأطباء المعالجين في اتخاذ القرارات العلاجية المناسبة. نستخدم تقنيات التلوين المناعي والتحليل الجزيئي لتقديم تشخيصات دقيقة وشاملة.',
    heroStats: [
      { value: '10,000+', label: 'Biopsies Annually', labelAr: 'خزعة سنوياً' },
      { value: '50+', label: 'Staining Methods', labelAr: 'طريقة تلوين' },
      { value: '99.9%', label: 'Diagnostic Accuracy', labelAr: 'دقة التشخيص' },
      { value: '25+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'tissue-biopsy', nameAr: 'فحص الخزعة النسيجية', nameEn: 'Tissue Biopsy', price: 250, turnaround: '3-5 أيام', popular: true },
      { id: 'fna', nameAr: 'ال aspirat بالإبرة الدقيقة', nameEn: 'Fine Needle Aspiration', price: 180, turnaround: '24-48 ساعة', popular: true },
      { id: 'immunohistochemistry', nameAr: 'التلوين المناعي النسيجي', nameEn: 'Immunohistochemistry', price: 350, turnaround: '5-7 أيام', popular: true },
      { id: 'frozen-section', nameAr: 'القطع المجمد', nameEn: 'Frozen Section', price: 400, turnaround: '30 دقيقة', popular: false },
      { id: 'special-stains', nameAr: 'الصبغات الخاصة', nameEn: 'Special Stains', price: 150, turnaround: '24-48 ساعة', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-sultan-histo', nameAr: 'د. سلطان بن عبدالرحمن الحربي', nameEn: 'Dr. Sultan Al-Harbi',
        titleAr: 'استشاري التشريح المرضي', titleEn: 'Consultant Histopathologist',
        qualifications: ['زمالة رويال كوليدج البريطانية', 'البورد السعودي', ' fellowship في تشخيص الأورام'],
        experience: '28 سنة', specialty: 'تشخيص الأورام وال:pathology الجراحي',
      },
      {
        id: 'dr-amal-histo', nameAr: 'د. أمل بنت محمد السالم', nameEn: 'Dr. Amal Al-Salem',
        titleAr: 'أخصائية تشريح مرضي', titleEn: 'Histopathologist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة هايدلبرغ', 'خبرة في التلوين المناعي'],
        experience: '17 سنة', specialty: 'التشريح المرضي الجزيئي',
      },
    ],
    equipment: [
      { nameAr: 'جهاز تقطيع الأنسجة الآلي', nameEn: 'Tissue Processor', brand: 'Leica PELORIS 3', description: 'معالج أنسجة آلي عالي الأداء لتحضير العينات بدقة فائقة' },
      { nameAr: 'مجهر رقمي عالي الدقة', nameEn: 'Digital Microscope', brand: 'Hamamatsu NanoZoomer', description: 'مجهر رقمي لمسح الأنسجة بدقة عالية وتخزين الصور' },
      { nameAr: 'جهاز التلوين المناعي الآلي', nameEn: 'IHC Stainer', brand: 'Ventana BenchMark ULTRA', description: 'نظام تلوين مناعي آلي لتحديد العلامات الحيوية في الأورام' },
    ],
    technology: [
      { name: 'Digital Pathology', description: 'طب تشريحي رقمي لتحليل الصور النسيجية بالذكاء الاصطناعي', icon: '🖥️' },
      { name: 'IHC Staining', description: 'التلوين المناعي النسيجي لتحديد العلامات الورمية', icon: '🎨' },
      { name: 'Molecular Testing', description: 'التحاليل الجزيئية لتحديد الطفرات الورمية', icon: '🧬' },
    ],
    preparationGuide: [
      'الإحضار بالصيام في حالة الخزعة الجراحية المخططة',
      'إحضار جميع التقارير الطبية والصور الشعاعية السابقة',
      'متابعة تعليمات الطبيب المعالج حول التوقف عن تناول مميعات الدم',
      'التأكد من وصول العينة في وعاء fixation المناسب',
    ],
    expectedTime: { standard: '3-5 أيام', rush: '24 ساعة', stat: '30 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع أنواع الخزعات والفحوصات النسيجية' },
      { provider: 'التعاونية', coverage: 'تغطية 85%', note: 'تشمل التلوين المناعي الأساسي' },
      { provider: 'مدجلف', coverage: 'تغطية 80%', note: 'للخزعات الجراحية فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية كاملة', note: 'بحد أقصى 2000 ريال شهرياً' },
    ],
    faqs: [
      { question: 'كم من الوقت تستغرق نتيجة الخزعة؟', answer: 'الخزعة العادية خلال 3-5 أيام عمل، والخزعة العاجلة خلال 30 دقيقة، والتلوين المناعي يحتاج 5-7 أيام.' },
      { question: 'هل الخزعة مؤلمة؟', answer: 'تُفعل الخزعة تحت التخدير الموضعي أو المحلي، وقد تشعر بانزعاج خفيف بعد انتهاء التأثير.' },
      { question: 'ماذا يعني التلوين المناعي؟', answer: 'التلوين المناعي يحدد نوع الخلايا الورمية وخصائصها، مما يساعد في تحديد خطة العلاج المناسبة.' },
      { question: 'هل يمكنني الحصول على شريحة من العينة؟', answer: 'نعم، يمكن تقديم طلب للحصول على شريحة أو كتلة نسيجية للرأي الاستشاري الثاني.' },
    ],
    articles: [
      { id: 'biopsy-guide', title: 'الخزعة النسيجية: كل ما تحتاج معرفته', excerpt: 'شرح كامل لأنواع الخزعات وكيفية التحضير لها وفهم النتائج', date: '2024-02-25', readTime: '8 دقائق', category: 'إرشادات المرضى' },
      { id: 'cancer-diagnosis', title: 'دور التشريح المرضي في تشخيص السرطان', excerpt: 'أهمية الفحص النسيجي في تشخيص وتصنيف الأورام', date: '2024-01-18', readTime: '7 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-histo', name: 'فهد بن سلطان الدوسري', text: 'التشخيص كان دقيقاً جداً وساعد الطبيب في تحديد خطة العلاج المناسبة.', rating: 5, date: '2024-03-02' },
      { id: 't2-histo', name: 'لينا بنت أحمد الشهري', text: 'تقرير مفصل ودقيق، والفريق الطبي كان متعاوناً جداً في شرح النتائج.', rating: 5, date: '2024-02-14' },
      { id: 't3-histo', name: 'محمد بن عبدالرحمن المطيري', text: 'خدمة احترافية عالية الجودة، النتائج وصلت في الوقت المحدد.', rating: 4, date: '2024-01-28' },
    ],
    relatedDepartments: ['cytology', 'molecular-biology', 'tumor-markers'],
    isPopular: false, order: 6, totalTests: 50, totalPatients: '10,000+', accuracy: '99.9%', experience: '25+ سنة',
  },

  {
    id: 'cytology',
    nameAr: 'السيتولوجيا',
    nameEn: 'Cytology',
    icon: '🔍',
    color: '#EC4899',
    gradientFrom: '#EC4899',
    gradientTo: '#BE185D',
    descriptionAr: 'قسم السيتولوجيا المتخصص في فحص الخلايا المفردة لتشخيص الأمراض والورمات.',
    descriptionEn: 'Specialized cytology department for examining individual cells to diagnose diseases and tumors.',
    overviewAr: 'يُعد قسم السيتولوجيا في مختبر المختبر من الأقسام الرائدة في تشخيص الأمراض الخلوية، حيث نقدم تحاليل دقيقة تشمل الفحص السيتولوجي الترااتبي والتشخيصي. يتخصص القسم في فحص الطلاقات الخلوية والمسحات مثل مسحة عنق الرحم ومسحة البروستاتا و aspiratات الأنسجة. يتميز القسم بأحدث تقنيات التلوين السيتومتري والتحليل الخطي الذي يوفر تشخيصاً دقيقاً وموثوقاً. يعمل في القسم فريق من المتخصصين في السيتولوجيا السريرية ذوي خبرة واسعة في تفسير النتائج.',
    heroStats: [
      { value: '8,000+', label: 'Smears Monthly', labelAr: 'مسحة شهرياً' },
      { value: '15,000+', label: 'Patients Annually', labelAr: 'مريض سنوياً' },
      { value: '99.5%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '18+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'pap-smear', nameAr: 'مسحة عنق الرحم (Pap Smear)', nameEn: 'Pap Smear', price: 75, turnaround: '3-5 أيام', popular: true },
      { id: 'fine-needle-aspiration', nameAr: 'الخرق بالإبرة الدقيقة', nameEn: 'Fine Needle Aspiration Cytology', price: 150, turnaround: '24-48 ساعة', popular: true },
      { id: 'urine-cytology', nameAr: 'السيتولوجيا البولية', nameEn: 'Urine Cytology', price: 95, turnaround: '3-5 أيام', popular: false },
      { id: 'body-fluid-cytology', nameAr: 'سيتولوجيا السوائل الجسدية', nameEn: 'Body Fluid Cytology', price: 120, turnaround: '24-48 ساعة', popular: true },
      { id: 'bnc-cytology', nameAr: 'السيتولوجيا بالفرشاة الناعمة', nameEn: 'Brush Cytology', price: 85, turnaround: '24-48 ساعة', popular: false },
      { id: 'thyroid-fna', nameAr: 'خرق الدرقية بالإبرة الدقيقة', nameEn: 'Thyroid FNA', price: 200, turnaround: '3-5 أيام', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-rania-cyto', nameAr: 'د. رانيا بنت خالد القرشي', nameEn: 'Dr. Rania Al-Qurashi',
        titleAr: 'استشارية السيتولوجيا', titleEn: 'Consultant Cytologist',
        qualifications: ['زمالة أمريكية في السيتولوجيا', 'البورد السعودي', 'ماجستير من جامعة كولومبيا'],
        experience: '19 سنة', specialty: 'السيتولوجيا التشخيصية والترااتبية',
      },
      {
        id: 'dr-tariq-cyto', nameAr: 'د. طارق بن عبدالعزيز الراشد', nameEn: 'Dr. Tariq Al-Rashid',
        titleAr: 'أخصائي سيتولوجيا', titleEn: 'Cytologist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة ميونخ', 'خبرة في المسحات السريرية'],
        experience: '12 سنة', specialty: 'الفحص السيتومتري المتقدم',
      },
    ],
    equipment: [
      { nameAr: 'جهاز الطلاق الخلوية الآلي', nameEn: 'Liquid-Based Cytology', brand: 'Hologic ThinPrep 5000', description: 'نظام متقدم لإعداد الطلاقات الخلوية السائلة عالية الجودة' },
      { nameAr: 'جهاز مسح الـ Pap الآلي', nameEn: 'Pap Smear Processor', brand: 'BD FocalPoint', description: 'نظام آلي لفحص مسحات عنق الرحم بدقة عالية' },
      { nameAr: 'مجهر سيتومتري متعدد الألوان', nameEn: 'Cytometer Microscope', brand: 'Olympus BX53', description: 'مجهر متعدد الألوان لتحليل الخلايا بدقة فائقة' },
    ],
    technology: [
      { name: 'Liquid-Based Cytology', description: 'تقنية الطلاقات الخلوية السائلة للحصول على نتائج أوضح', icon: '💧' },
      { name: 'Automated Screening', description: 'نظام فحص آلي للكشف المبكر عن التشوهات الخلوية', icon: '🤖' },
      { name: 'Digital Analysis', description: 'تحليل رقمي للصور الخلوية باستخدام الذكاء الاصطناعي', icon: '📊' },
    ],
    preparationGuide: [
      'في مسحة عنق الرحم: تجنب الجماع أو استخدام الكريمات الموضعية قبل الفحص بيومين',
      'التأكد من أن العينة مأخوذة في الوقت المناسب من الدورة الشهرية',
      'في الخرقات: الإحضار بصحيفة ساخنة إذا كان الخرق في منطقة باردة',
      'إرسال العينة بسرعة في وسط الحفظ المناسب',
    ],
    expectedTime: { standard: '3-5 أيام', rush: '24 ساعة', stat: '4 ساعات' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع تحاليل السيتولوجيا شاملاً مسحة عنق الرحم' },
      { provider: 'التعاونية', coverage: 'تغطية 90%', note: 'تشمل الفحص الدوري للسيدات' },
      { provider: 'مدجلف', coverage: 'تغطية 75%', note: 'لفحوصات الخرقات فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية كاملة', note: 'للفحوصات الوقائية والتشخيصية' },
    ],
    faqs: [
      { question: 'ما هو الفرق بين السيتولوجيا والتشريح المرضي؟', answer: 'السيتولوجيا تفحص الخلايا المفردة، بينما التشريح المرضي يفحص الأنسجة الكاملة مع بنيتها.' },
      { question: 'متى يجب عمل مسحة عنق الرحم؟', answer: 'يُنصح بالبدء بعمر 21 سنة وتكرارها كل 3 سنوات، أو كل 5 سنوات مع فحص HPV.' },
      { question: 'هل مسحة عنق الرحم مؤلمة؟', answer: 'قد تسبب انزعاجاً خفيفاً لبضع ثوانٍ، ولا تحتاج تخديداً أو تعويقاً بعد الفحص.' },
      { question: 'ماذا تعني نتيجة غير طبيعية؟', answer: 'نتيجة غير طبيعية لا تعني بالضرورة وجود سرطان، بل قد تحتاج لفحوصات تأكيدية مثل الخزعة.' },
    ],
    articles: [
      { id: 'pap-smear-guide', title: 'الدليل الشامل لمسحة عنق الرحم', excerpt: 'كل ما تحتاج معرفته عن فحص مسحة عنق الرحم وأهميته', date: '2024-03-10', readTime: '6 دقائق', category: 'صحة المرأة' },
      { id: 'thyroid-nodules', title: 'العُقد الدرقية: متى نحتاج للخرق؟', excerpt: 'شرح لأنواع العُقد الدرقية ومتى يكون الخرق بالإبرة الدقيقة ضرورياً', date: '2024-02-22', readTime: '7 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-cyto', name: 'هند بنت فهد السبيعي', text: 'مسحة عنق الرحم كانت سريعة وغير مؤلمة، والنتيجة وصلت بسرعة.', rating: 5, date: '2024-03-18' },
      { id: 't2-cyto', name: 'عبدالله بن سعيد القحطاني', text: 'الخرق بالإبرة الدقيقة كان دقيقاً والطبيب كان ماهراً، تجربة جيدة.', rating: 5, date: '2024-02-28' },
      { id: 't3-cyto', name: 'فاطمة بنت محمد الحربي', text: 'خدمة ممتازة وفريق نسائي متعاون، أنصح جميع السيدات بزيارة هذا المختبر.', rating: 4, date: '2024-01-15' },
    ],
    relatedDepartments: ['histopathology', 'tumor-markers', 'genetics'],
    isPopular: false, order: 7, totalTests: 60, totalPatients: '15,000+', accuracy: '99.5%', experience: '18+ سنة',
  },

  {
    id: 'molecular-biology',
    nameAr: 'البيولوجيا الجزيئية',
    nameEn: 'Molecular Biology',
    icon: '🧬',
    color: '#06B6D4',
    gradientFrom: '#06B6D4',
    gradientTo: '#0891B2',
    descriptionAr: 'قسم البيولوجيا الجزيئية المتخصص في التحليل الجزيئي والوراثي للحمض النووي والRNA.',
    descriptionEn: 'Specialized molecular biology department for genetic and nucleic acid analysis.',
    overviewAr: 'يُعد قسم البيولوجيا الجزيئية في مختبر المختبر من أكثر الأقسام تطوراً تقنياً في المنطقة، حيث نستخدم أحدث تقنيات التفاعل البوليميراسي المتسلسل PCR والتحليل الجيني الكامل. يتخصص القسم في الكشف الجزيئي عن الأمراض المعدية والأورامية والوراثية بدقة فائقة. يتميز القسم بوجود جهاز التسلسل الجيني من الجيل الأحدث الذي يوفر تحليلات جينية شاملة في وقت قياسي. يعمل في القسم فريق من العلماء والتقنيين المدربين على أحدث التقنيات الجزيئية العالمية.',
    heroStats: [
      { value: '200+', label: 'Molecular Tests', labelAr: 'اختبار جزيئي' },
      { value: '25,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.9%', label: 'Sensitivity Rate', labelAr: 'معدل الحساسية' },
      { value: '15+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'pcr-covid', nameAr: 'كشف PCR لفيروس كورونا', nameEn: 'COVID-19 PCR', price: 95, turnaround: '6-12 ساعة', popular: true },
      { id: 'pcr-flu', nameAr: 'كشف PCR للإنفلونزا', nameEn: 'Influenza PCR', price: 110, turnaround: '24 ساعة', popular: false },
      { id: 'gene-mutation', nameAr: 'تحليل الطفرات الجينية', nameEn: 'Gene Mutation Analysis', price: 800, turnaround: '7-14 يوم', popular: true },
      { id: 'viral-load', nameAr: 'عبденة الفيروس', nameEn: 'Viral Load Testing', price: 250, turnaround: '24-48 ساعة', popular: true },
      { id: 'hpv-genotyping', nameAr: 'تحديد نوع فيروس الورم الحليمي', nameEn: 'HPV Genotyping', price: 180, turnaround: '3-5 أيام', popular: false },
      { id: 'bcr-abl', nameAr: 'تحليل جين BCR-ABL', nameEn: 'BCR-ABL Gene Analysis', price: 500, turnaround: '5-7 أيام', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-hassan-mol', nameAr: 'د. حسن بن إبراهيم الزهراني', nameEn: 'Dr. Hassan Al-Zahrani',
        titleAr: 'استشاري البيولوجيا الجزيئية', titleEn: 'Consultant Molecular Biologist',
        qualifications: ['دكتوراه من MIT في البيولوجيا الجزيئية', 'زمالة في التحليل الجيني', 'خبرة دولية واسعة'],
        experience: '18 سنة', specialty: 'التحليل الجيني والطب الشخصي',
      },
      {
        id: 'dr-nada-mol', nameAr: 'د. ندى بنت سعود العميري', nameEn: 'Dr. Nada Al-Omairi',
        titleAr: 'أخصائية بيولوجيا جزيئية', titleEn: 'Molecular Biologist',
        qualifications: ['البورد السعودي في المختبرات', 'ماجستير من جامعة كامبريدج', 'خبرة في PCR المتقدم'],
        experience: '13 سنة', specialty: 'الكشف الجزيئي عن الأمراض المعدية',
      },
    ],
    equipment: [
      { nameAr: 'جهاز التفاعل البوليميراسي الآلي', nameEn: 'Real-Time PCR System', brand: 'Applied Biosystems QuantStudio 7', description: 'جهاز PCR في الوقت الحقيقي من الجيل الأحدث للتحليل الجزيئي الدقيق' },
      { nameAr: 'جهاز التسلسل الجيني', nameEn: 'Gene Sequencer', brand: 'Illumina MiSeq', description: 'نظام تسلسل جيني عاليthroughput للتحليل الجيني الشامل' },
      { nameAr: 'جهاز الكشف الفيروسي', nameEn: 'Viral Detection System', brand: 'Cobas 6800/8800', description: 'نظام كشف فيروسي آلي عالي الإنتاجية للتحاليل الجزيئية' },
    ],
    technology: [
      { name: 'Real-Time PCR', description: 'تفاعل بوليميراسي متسلسل في الوقت الحقيقي للكشف الفائق الحساسية', icon: '🔬' },
      { name: 'Next-Gen Sequencing', description: 'تسلسل الجيل التالي للتحليل الجيني الشامل', icon: '🧬' },
      { name: 'Isothermal Amplification', description: 'تكبير حراري متساوٍ للكشف السريع في الموقع', icon: '⚡' },
    ],
    preparationGuide: [
      'في تحاليل PCR المعدية: جمع العينة في الوقت المناسب من بداية الأعراض',
      'تجنب تناول الأدوية المضادة للفيروسات قبل الفحص إذا أمكن',
      'في التحاليل الجينية: تقديم التاريخ العائلي المفصل للطبيب',
      'التأكد من أن العينة محفوظة في درجة حرارة مناسبة',
    ],
    expectedTime: { standard: '24-48 ساعة', rush: '6 ساعات', stat: 'ساعة واحدة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'لفحوصات PCR المعدية' },
      { provider: 'التعاونية', coverage: 'تغطية 70%', note: 'للفحوصات الجينية المتقدمة' },
      { provider: 'مدجلف', coverage: 'تغطية 80%', note: 'لحالات الطوارئ فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 85%', note: 'بحد أقصى 1000 ريال شهرياً' },
    ],
    faqs: [
      { question: 'ما هو الفرق بين PCR والتحليل الجيني؟', answer: 'PCR يكشف عن وجود مادة وراثية فيروسية أو بكتيرية، بينما التحليل الجيني يدرس جينات المريض لاكتشاف الطفرات.' },
      { question: 'كم من الوقت تستغرق نتيجة PCR؟', answer: 'PCR لفيروس كورونا خلال 6-12 ساعة، والتحاليل الجزيئية الأخرى خلال 24-48 ساعة.' },
      { question: 'هل التحليل الجيني مؤلم؟', answer: 'لا، التحليل الجيني يحتاج فقط عينة دم أو لعاب، وهو غير مؤلم تماماً.' },
      { question: 'ما استخدامات PCR في التشخيص؟', answer: 'يُستخدم للكشف عن العدوى الفيروسية والبكتيرية وتحديد الطفرات الجينية وقياس عبdenة الفيروس.' },
      { question: 'هل تحاليل الجينوم دقيقة جداً؟', answer: 'نعم، التحاليل الجزيئية تتمتع بحساسية ونوعية تتجاوز 99.9% مع الأجهزة الحديثة.' },
    ],
    articles: [
      { id: 'pcr-explained', title: 'فهم اختبار PCR: كيف يعمل ولماذا هو مهم', excerpt: 'شرح مفصل لتقنية PCR واستخداماتها الطبية المتنوعة', date: '2024-03-15', readTime: '7 دقائق', category: 'مقالات طبية' },
      { id: 'genetic-testing', title: 'التحاليل الجينية: المزايا والتحديات', excerpt: 'نظرة شاملة على فوائد وتحديات التحليل الجيني في الطب الحديث', date: '2024-02-08', readTime: '9 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-mol', name: 'عمر بن خالد المالكي', text: 'نتيجة PCR وصلت بسرعة مذهلة والفريق الطبي كان محترفاً جداً.', rating: 5, date: '2024-03-20' },
      { id: 't2-mol', name: 'ديمة بنت أحمد الشمري', text: 'التحليل الجيني كان شاملاً ودقيقاً، والتقرير كان مفصلاً ومفيداً جداً.', rating: 5, date: '2024-02-15' },
      { id: 't3-mol', name: 'يوسف بن عبدالرحمن السبيعي', text: 'تجربة ممتازة في المختبر الجزيئي، النتائج دقيقة والخدمة سريعة.', rating: 4, date: '2024-01-10' },
    ],
    relatedDepartments: ['genetics', 'virology', 'molecular-biology'],
    isPopular: true, order: 8, totalTests: 200, totalPatients: '25,000+', accuracy: '99.9%', experience: '15+ سنة',
  },

  {
    id: 'genetics',
    nameAr: 'علم الوراثة',
    nameEn: 'Genetics',
    icon: '🧬',
    color: '#F472B6',
    gradientFrom: '#F472B6',
    gradientTo: '#DB2777',
    descriptionAr: 'قسم علم الوراثة المتخصص في التشخيص الجيني للأمراض الوراثية ودراسة الطفرات.',
    descriptionEn: 'Specialized genetics department for genetic diagnosis of hereditary diseases and mutation analysis.',
    overviewAr: 'يُعد قسم علم الوراثة في مختبر المختبر من الأقسام الرائدة في المملكة العربية السعودية لتشخيص الأمراض الوراثية، حيث نوفر أكثر من 500 اختبار جيني شامل. يتخصص القسم في تشخيص أمراض الدم الوراثية مثل.Drawable وFalls والتوحد والتأخر العقلي وأمراض الأيض الوراثية. يتميز القسم بشراكته مع مراكز بحثية عالمية لتقديم أحدث تقنيات التحليل الجيني بما في ذلك التسلسل الكامل للجينوم. يضم القسم فريقاً من الأخصائيين الوراثيين المرخصين ذوي الخبرة في الت遗传咨询 وتحليل النتائج الجينية المعقدة.',
    heroStats: [
      { value: '500+', label: 'Genetic Tests', labelAr: 'اختبار جيني' },
      { value: '5,000+', label: 'Patients Annually', labelAr: 'مريض سنوياً' },
      { value: '99.8%', label: 'Detection Rate', labelAr: 'معدل الكشف' },
      { value: '17+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'karyotype', nameAr: 'الكاريوتايب', nameEn: 'Karyotype Analysis', price: 350, turnaround: '7-14 يوم', popular: true },
      { id: 'cystic-fibrosis', nameAr: 'تحليل جين التكيس اللوزي', nameEn: 'Cystic Fibrosis Gene Test', price: 600, turnaround: '7-14 يوم', popular: false },
      { id: 'thalassemia-gene', nameAr: 'تحليل جينات الثلاسيميا', nameEn: 'Thalassemia Gene Panel', price: 450, turnaround: '5-10 أيام', popular: true },
      { id: 'sickle-cell', nameAr: 'تحليل جين المنجيم', nameEn: 'Sickle Cell Gene Test', price: 400, turnaround: '5-10 أيام', popular: true },
      { id: 'genetic-counseling', nameAr: 'الاستشارة الوراثية', nameEn: 'Genetic Counseling', price: 250, turnaround: 'محدد بالموعد', popular: false },
      { id: 'whole-exome', nameAr: 'تسلسل الجينوم الكامل', nameEn: 'Whole Exome Sequencing', price: 3500, turnaround: '21-30 يوم', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-ahmad-gen', nameAr: 'د. أحمد بن محمد الأحمدي', nameEn: 'Dr. Ahmad Al-Ahmadi',
        titleAr: 'استشاري علم الوراثة', titleEn: 'Consultant Geneticist',
        qualifications: ['زمالة أمريكية في الوراثة الطبية', 'البورد السعودي', 'ماجستير من Johns Hopkins'],
        experience: '22 سنة', specialty: 'التشخيص الجيني للأمراض الوراثية',
      },
      {
        id: 'dr-samaher-gen', nameAr: 'د. سميرة بنت عبدالله الحمادي', nameEn: 'Dr. Samaher Al-Hamadi',
        titleAr: 'أخصائية وراثة سريرية', titleEn: 'Clinical Geneticist',
        qualifications: ['البورد السعودي في الوراثة', 'ماجستير من جامعة أدنبرة', 'خبرة في الت遗传咨询'],
        experience: '14 سنة', specialty: 'الاستشارة الوراثية وتحليل النتائج',
      },
    ],
    equipment: [
      { nameAr: 'جهاز التحليل الكاريوزومي', nameEn: 'Karyotyping System', brand: 'MetaSystems', description: 'نظام تحليل كاريوزومي آلي للكشف عن اضطرابات الكروموسومات' },
      { nameAr: 'جهاز التسلسل الجيني', nameEn: 'Next-Gen Sequencer', brand: 'Illumina NextSeq 550', description: 'نظام تسلسل الجيل التالي للتحليل الجيني الشامل' },
      { nameAr: 'جهاز PCR الجيني', nameEn: 'Genetic PCR System', brand: 'ABI Prism 3130', description: 'نظام PCR متعدد المواقع لتحليل الطفرات الجينية المعروفة' },
    ],
    technology: [
      { name: 'Whole Genome Sequencing', description: 'تسلسل الجينوم الكامل للكشف شامل عن الطفرات', icon: '🧬' },
      { name: 'Chromosomal Microarray', description: 'مصفوفة كروموسومية للكشف عن فقدان أو اكتساب الكروموسومات', icon: '📊' },
      { name: 'Genetic Counseling', description: 'استشارة وراثية متخصصة لتفسير النتائج وتوجيه المرضى', icon: '💬' },
    ],
    preparationGuide: [
      'جمع التاريخ العائلي المفصل لثلاثة أجيال على الأقل',
      'إحضار جميع التقارير الطبية والصور السابقة',
      'في التحليل قبل الإخصاب: إحضار تقارير الفحص الوراثي لكلا الشريكين',
      'من المهم التواص مع أخصائي الوراثة قبل التحليل لفهم النتائج المحتملة',
    ],
    expectedTime: { standard: '7-30 يوم', rush: '3 أيام', stat: '24 ساعة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية جزئية', note: '50% من تكلفة التحليل الجيني' },
      { provider: 'التعاونية', coverage: 'تغطية 60%', note: 'لفحوصات الأمراض الوراثية المحددة' },
      { provider: 'مدجلف', coverage: 'تغطية 50%', note: 'تحتاج موافقة مسبقة' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 70%', note: 'لفحوصات ما قبل الولادة فقط' },
    ],
    faqs: [
      { question: 'متى نحتاج لتحليل جيني؟', answer: 'عند وجود تاريخ عائلي لأمراض وراثية، أو عند وجود عوامل خطر، أو عند التخطيط للحمل.' },
      { question: 'ما الفرق بين الكاريوتيب والتحليل الجيني؟', answer: 'الكاريوتايب يفحص الكروموسومات بالمجهر، بينما التحليل الجيني يدرس الحمض النووي بالتفصيل.' },
      { question: 'هل التحليل الجيني يكشف جميع الأمراض؟', answer: 'لا، التحليل الجيني يكشف عن الطفرات المعروفة فقط، وهناك بعض الأمراض قد لا يكون لها سبب جيني واضح.' },
      { question: 'ما نتائج التحليل الجيني؟', answer: 'قد تكون النتائج إيجابية (وجود طفرة)، سلبية (لا توجد طفرة)، أو غير حاسمة (变体 غير محددة).' },
    ],
    articles: [
      { id: 'genetic-diseases-ksa', title: 'الأمراض الوراثية في السعودية', excerpt: 'نظرة على أكثر الأمراض الوراثية شيوعاً في المملكة وطرق تشخيصها', date: '2024-03-12', readTime: '8 دقائق', category: 'مقالات طبية' },
      { id: 'prenatal-genetic', title: 'التحاليل الوراثية قبل الولادة', excerpt: 'أهمية الفحص الوراثي قبل الولادة وأساليبه المتعددة', date: '2024-02-01', readTime: '7 دقائق', category: 'صحة الأم والطفل' },
    ],
    testimonials: [
      { id: 't1-gen', name: 'مني بنت خالد العنزي', text: 'الاستشارة الوراثية كانت شاملة ومفيدة جداً، وساعدتني في اتخاذ قرارات مهمة.', rating: 5, date: '2024-03-05' },
      { id: 't2-gen', name: 'خالد بن عبدالرحمن الفهد', text: 'التحليل الجيني كان دقيقاً والتقرير مفصلاً جداً، فريق طبي محترف.', rating: 5, date: '2024-02-20' },
      { id: 't3-gen', name: 'ريم بنت سعد المطيري', text: 'تجربة ممتازة في قسم الوراثة، الإرشاد كان واضحاً والنتيجة مطمئنة.', rating: 4, date: '2024-01-18' },
    ],
    relatedDepartments: ['molecular-biology', 'hematology', 'cytology'],
    isPopular: false, order: 9, totalTests: 500, totalPatients: '5,000+', accuracy: '99.8%', experience: '17+ سنة',
  },

  {
    id: 'endocrinology',
    nameAr: 'الغدد الصماء',
    nameEn: 'Endocrinology',
    icon: '⚗️',
    color: '#A855F7',
    gradientFrom: '#A855F7',
    gradientTo: '#7C3AED',
    descriptionAr: 'قسم الغدد الصماء المتخصص في تحليل الهرمونات واختلالات الغدد الصماء.',
    descriptionEn: 'Specialized endocrinology department for hormone analysis and endocrine disorders.',
    overviewAr: 'يُعد قسم الغدد الصماء في مختبر المختبر من الأقسام الرائدة في تشخيص وعلاج اختلالات الغدد الصماء، حيث نقدم أكثر من 100 اختبار هرموني شامل. يتخصص القسم في تشخيص أمراض الغدة الدرقية والغدة النخامية والغدة الكظرية والغدد الصماء الجنسية. يتميز القسم بأحدث تقنيات قياس الهرمونات العالية الحساسية التي تكشف عن اضطرابات الغدد الصماء بأدق التفاصيل. يضم القسم فريقاً من الكيميائيين المتخصصين في الهرمونات ذوي خبرة واسعة في تفسير نتائج الهرمونات المعقدة وتوجيه الأطباء المعالجين.',
    heroStats: [
      { value: '100+', label: 'Hormone Tests', labelAr: 'اختبار هرموني' },
      { value: '20,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.7%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '20+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'thyroid-panel', nameAr: 'بروفايل الدرقية الكامل', nameEn: 'Thyroid Panel (TSH, T3, T4)', price: 85, turnaround: 'ساعتان', popular: true },
      { id: 'cortisol', nameAr: 'الكورتيزول', nameEn: 'Cortisol', price: 65, turnaround: 'ساعتان', popular: true },
      { id: 'insulin', nameAr: 'الأنسولين', nameEn: 'Insulin Level', price: 55, turnaround: 'ساعتان', popular: true },
      { id: 'testosterone', nameAr: 'التيستوستيرون', nameEn: 'Testosterone', price: 70, turnaround: '24 ساعة', popular: true },
      { id: 'estrogen', nameAr: 'الإستروجين', nameEn: 'Estrogen (E2)', price: 70, turnaround: '24 ساعة', popular: false },
      { id: 'prolactin', nameAr: 'البرولاكتين', nameEn: 'Prolactin', price: 60, turnaround: '24 ساعة', popular: false },
      { id: 'acth', nameAr: 'هرمون ACTH', nameEn: 'ACTH', price: 90, turnaround: '24 ساعة', popular: false },
      { id: 'parathyroid', nameAr: 'هرمون الغدة الجار درقية', nameEn: 'PTH (Parathyroid Hormone)', price: 80, turnaround: '24 ساعة', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-saeed-endo', nameAr: 'د. سعيد بن ناصر العتيبي', nameEn: 'Dr. Saeed Al-Otaibi',
        titleAr: 'استشاري الغدد الصماء', titleEn: 'Consultant Endocrinologist',
        qualifications: ['زمالة أمريكية في الغدد الصماء', 'البورد السعودي', 'ماجستير من جامعة ستانفورد'],
        experience: '23 سنة', specialty: 'اضطرابات الدرقية والغدد الصماء',
      },
      {
        id: 'dr-laila-endo', nameAr: 'د. ليلى بنت عبدالرحمن الحربي', nameEn: 'Dr. Layla Al-Harbi',
        titleAr: 'أخصائية غدد صماء', titleEn: 'Endocrinologist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة تورنتو', 'خبرة في الهرمونات الجنسية'],
        experience: '16 سنة', specialty: 'الهر몬ات الجنسية واضطرابات النمو',
      },
    ],
    equipment: [
      { nameAr: 'جهاز قياس الهرمونات العالية الحساسية', nameEn: 'Immunoassay Analyzer', brand: 'Roche Cobas e801', description: 'جهاز electrochemiluminescence عالي الحساسية لقياس الهرمونات بدقة فائقة' },
      { nameAr: 'جهاز قياس الأنسولين', nameEn: 'Insulin Analyzer', brand: 'Abbott ARCHITECT i2000', description: 'نظام قياس الأنسولين والهرمونات بحساسية عالية' },
      { nameAr: 'جهاز تحليل الغدة الدرقية', nameEn: 'Thyroid Analyzer', brand: 'Siemens ADVIA Centaur', description: 'نظام متخصص لتحليل جميع هرمونات الدرقية بدقة عالية' },
    ],
    technology: [
      { name: 'Electrochemiluminescence', description: 'تقنية كيمياء مضيئة عالية الحساسية لقياس الهرمونات', icon: '✨' },
      { name: 'Autoimmunity Panels', description: 'لوحات مناعية ذاتية شاملة لاضطرابات الغدد الصماء', icon: '🛡️' },
      { name: 'Mass Spectrometry', description: 'مقياس كتلة لتحليل الهرمونات الدقيقة', icon: '📊' },
    ],
    preparationGuide: [
      'في تحليل الكورتيزول الصائم: الصيام من الليل وجمع العينة صباحاً',
      'في تحليل الغدة الدرقية: يمكن تناول الأدوية الدرقية قبل أخذ العينة',
      'في تحليل هرمونات النمو: الصيام 12 ساعة وتجنب الرياضة قبل التحليل',
      'في تحليل الأنسولين: الصيام 10-12 ساعة قبل أخذ العينة',
    ],
    expectedTime: { standard: 'ساعتان - 24 ساعة', rush: 'ساعة واحدة', stat: '30 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع تحاليل الهرمونات والغدد الصماء' },
      { provider: 'التعاونية', coverage: 'تغطية 80%', note: 'لفحوصات الدرقية والأساسية' },
      { provider: 'مدجلف', coverage: 'تغطية 75%', note: 'لفحوصات الدرقية فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 85%', note: 'بحد أقصى 600 ريال شهرياً' },
    ],
    faqs: [
      { question: 'متى يطلب الطبيب تحليل الهرمونات؟', answer: 'عند أعراض اضطرابات الغدد الصماء مثل تغيرات الوزن والإرهاق واضطرابات النوم ومشاكل الخصوبة.' },
      { question: 'هل تحليل الدرقية يحتاج صيام؟', answer: 'لا يحتاج تحليل الدرقية لصيام، لكن يُفضل جمع العينة صباحاً وتجنب الرياضة قبل التحليل.' },
      { question: 'ماذا يعني ارتفاع TSH؟', answer: 'ارتفاع TSH قد يدل على قصور الدرقية أو استجابة للجسم لنقص الهرمون، ويجب تفسيره مع T3 وT4.' },
      { question: 'هل يمكن قياس الهرمونات في أي وقت من اليوم؟', answer: 'بعض الهرمونات مثل الكورتيزول لها تقلبات يومية ويجب قياسها في وقت محدد، والبعض الآخر يمكن قياسه في أي وقت.' },
    ],
    articles: [
      { id: 'thyroid-health', title: 'صحة الغدة الدرقية: دليل شامل', excerpt: 'شرح لأمراض الدرقية وأعراضها وطرق تشخيصها وعلاجها', date: '2024-03-08', readTime: '8 دقائق', category: 'مقالات طبية' },
      { id: 'hormone-balance', title: 'كيفية التوازن بين الهرمونات', excerpt: 'نصائح عملية للحفاظ على توازن الهرمونات والغدد الصماء', date: '2024-02-14', readTime: '6 دقائق', category: 'نصائح صحية' },
    ],
    testimonials: [
      { id: 't1-endo', name: 'عبدالرحمن بن سعيد الدوسري', text: 'تحليل الدرقية كان دقيقاً جداً وساعد الطبيب في تعديل جرعة الدواء بسرعة.', rating: 5, date: '2024-03-12' },
      { id: 't2-endo', name: 'هدى بنت محمد الشمري', text: 'خدمة ممتازة ونتائج سريعة، فريق طبي متخصص ومتعاون.', rating: 5, date: '2024-02-25' },
      { id: 't3-endo', name: 'ماجد بن خالد الراشد', text: 'تجربة جيدة جداً من حيث الدقة والسرعة، أنصح بزيارة هذا المختبر.', rating: 4, date: '2024-01-20' },
    ],
    relatedDepartments: ['hormones', 'diabetes', 'fertility'],
    isPopular: true, order: 10, totalTests: 100, totalPatients: '20,000+', accuracy: '99.7%', experience: '20+ سنة',
  },

  {
    id: 'toxicology',
    nameAr: 'علم السموم',
    nameEn: 'Toxicology',
    icon: '☠️',
    color: '#EF4444',
    gradientFrom: '#EF4444',
    gradientTo: '#B91C1C',
    descriptionAr: 'قسم علم السموم المتخصص في الكشف عن المواد السامة وتحليل التسمم في الدم والبول.',
    descriptionEn: 'Specialized toxicology department for detecting poisonous substances and analyzing poisoning cases.',
    overviewAr: 'يُعد قسم علم السموم في مختبر المختبر من الأقسام الحيوية التي تعمل على مدار الساعة لتشخيص حالات التسمم الطارئة، حيث نستخدم أحدث تقنيات الكروماتوغرافيا والتحليل الكتلي للكشف عن أكثر من 500 مادة سامة في العينات البيولوجية. يتميز القسم بسرعة استجابته لحالات الطوارئ وقدرته على تقديم نتائج فورية تساعد الأطباء في إنقاذ حياة المرضى. يضم القسم فريقاً من الكيميائيين المتخصصين في علم السموم ذوي خبرة واسعة في تحليل التسممات الدوائية والغذائية والبيئية.',
    heroStats: [
      { value: '500+', label: 'Toxic Substances', labelAr: 'مادة سامة يمكن كشفها' },
      { value: '3,000+', label: 'Cases Annually', labelAr: 'حالة سنوياً' },
      { value: '99.5%', label: 'Detection Rate', labelAr: 'معدل الكشف' },
      { value: '18+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'drug-screen', nameAr: 'فحص المخدرات والمواد المخدرة', nameEn: 'Drug Screen Panel', price: 120, turnaround: '4-8 ساعات', popular: true },
      { id: 'heavy-metals', nameAr: 'الأHeavy Metals في الدم', nameEn: 'Heavy Metals Panel', price: 150, turnaround: '48-72 ساعة', popular: true },
      { id: 'lead-level', nameAr: 'مستوى الرصاص', nameEn: 'Blood Lead Level', price: 85, turnaround: '24 ساعة', popular: false },
      { id: 'acetaminophen', nameAr: 'مستوى الأسيتامينوفين', nameEn: 'Acetaminophen Level', price: 95, turnaround: 'ساعة واحدة', popular: false },
      { id: 'alcohol-level', nameAr: 'مستوى الكحول في الدم', nameEn: 'Blood Alcohol Level', price: 75, turnaround: 'ساعة واحدة', popular: true },
      { id: 'carbon-monoxide', nameAr: 'أكسيد الكربون في الدم', nameEn: 'Carbon Monoxide Level', price: 90, turnaround: 'ساعة واحدة', popular: false },
      { id: 'salicylate', nameAr: 'مستوى الساليسيلات', nameEn: 'Salicylate Level', price: 80, turnaround: 'ساعة واحدة', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-youssef-tox', nameAr: 'د. يوسف بن أحمد البحيري', nameEn: 'Dr. Youssef Al-Bahiri',
        titleAr: 'استشاري علم السموم', titleEn: 'Consultant Toxicologist',
        qualifications: ['زمالة أمريكية في علم السموم السريرية', 'البورد السعودي', 'ماجستير من جامعة هارفارد'],
        experience: '20 سنة', specialty: 'التسممات الدوائية والغذائية',
      },
      {
        id: 'dr-amira-tox', nameAr: 'د. أميرة بنت خالد الهاجري', nameEn: 'Dr. Amira Al-Hajri',
        titleAr: 'أخصائية علم السموم', titleEn: 'Toxicologist',
        qualifications: ['البورد السعودي في المختبرات', 'ماجستير من جامعة أديلايد', 'خبرة في مراكز السموم الكبرى'],
        experience: '14 سنة', specialty: 'التسممات البيئية والغذائية',
      },
    ],
    equipment: [
      { nameAr: 'جهاز الكروماتوغرافيا الغازية', nameEn: 'Gas Chromatograph', brand: 'Agilent 7890B GC-MS', description: 'نظام كروماتوغرافيا غازية-كتلة متحدة لتحليل المواد السامة بدقة عالية' },
      { nameAr: 'جهاز الـ LC-MS/MS', nameEn: 'Liquid Chromatography-Mass Spec', brand: 'Waters Xevo TQ-XS', description: 'كروماتوغرافيا سائلة-كتلة متحمة للتحليل السريع والدقيق' },
      { nameAr: 'جهاز امتصاص ذري', nameEn: 'Atomic Absorption Spectrometer', brand: 'PerkinElmer AAnalyst 800', description: 'جهاز امتصاص ذري لتحليل المعادن الثقيلة في العينات البيولوجية' },
    ],
    technology: [
      { name: 'GC-MS Analysis', description: 'كروماتوغرافيا غازية-كتلة متحمة لتحديد المواد بدقة', icon: '🔬' },
      { name: 'LC-MS/MS', description: 'كروماتوغرافيا سائلة عالية الأداء لتحليل السموم المعقدة', icon: '⚗️' },
      { name: 'Rapid Screening', description: 'نظام فحص سريع لحالات الطوارئ على مدار الساعة', icon: '⚡' },
    ],
    preparationGuide: [
      'في حالة التسمم الطارئ: إحضار العينة في وعاء نظيف مع ذكر怀疑 المادة',
      'في فحص المخدرات: جمع عينة البول في وعاء مختبر معقم',
      'في تحاليل المعادن الثقيلة: جمع عينة الدم في أنبوب خاص بالمعادن',
      'ذكر جميع الأدوية والمكملات التي تتناولها في استمارة الفحص',
    ],
    expectedTime: { standard: '4-8 ساعات', rush: 'ساعة واحدة', stat: '15 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'لحالات الطوارئ والتحاليل العاجلة' },
      { provider: 'التعاونية', coverage: 'تغطية 85%', note: 'لحالات الطوارئ فقط' },
      { provider: 'مدجلف', coverage: 'تغطية 80%', note: 'للفحوصات السريرية العادية' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 90%', note: 'لحالات الطوارئ الحرجة' },
    ],
    faqs: [
      { question: 'متى نحتاج لفحص السموم؟', answer: 'في حالة suspicion تسمم أو تناول مواد غير مألوفة أو جرع زائد من الأدوية.' },
      { question: 'كم من الوقت تستغرق نتيجة فحص السموم؟', answer: 'فحوصات الطوارئ خلال ساعة، والفحوصات التأكيدية خلال 4-8 ساعات.' },
      { question: 'هل يمكن الكشف عن المخدرات بعد أسبوع؟', answer: 'بعض المخدرات تبقى قابلة للكشف لمدة تتجاوز أسبوعاً، لكن يُفضل الفحص في أقرب وقت.' },
      { question: 'هل فحص السموم سري؟', answer: 'نعم، جميع فحوصات السموم سرية تماماً وفقاً للأنظمة الطبية المعمول بها.' },
    ],
    articles: [
      { id: 'poisoning-first-aid', title: 'الإسعافات الأولية في حالات التسمم', excerpt: 'خطوات الإسعافات الأولية الأساسية في حالات التسمم المختلفة', date: '2024-03-20', readTime: '6 دقائق', category: 'إسعافات أولية' },
      { id: 'drug-testing-workplace', title: 'فحوصات المخدرات في بيئة العمل', excerpt: 'أهمية فحوصات المخدرات في بيئة العمل وتأثيرها على السلامة', date: '2024-02-10', readTime: '5 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-tox', name: 'سلطان بن ناصر الحربي', text: 'خدمة طوارئ سريعة ودقيقة، ساعدت في تشخيص حالة تسمم وإعطاء العلاج المناسب.', rating: 5, date: '2024-03-22' },
      { id: 't2-tox', name: 'ولاء بنت محمد العنزي', text: 'فريق طبي محترف ومحترف، النتائج كانت حاسمة في إنقاذ المريض.', rating: 5, date: '2024-02-18' },
      { id: 't3-tox', name: 'أحمد بن فيصل القحطاني', text: 'تجربة ممتازة من حيث السرعة والدقة، أخصائيون بارعون.', rating: 4, date: '2024-01-25' },
    ],
    relatedDepartments: ['clinical-chemistry', 'urinalysis', 'molecular-biology'],
    isPopular: false, order: 11, totalTests: 50, totalPatients: '3,000+', accuracy: '99.5%', experience: '18+ سنة',
  },

  {
    id: 'virology',
    nameAr: 'علم الفيروسات',
    nameEn: 'Virology',
    icon: '🦠',
    color: '#6366F1',
    gradientFrom: '#6366F1',
    gradientTo: '#4F46E5',
    descriptionAr: 'قسم علم الفيروسات المتخصص في الكشف عن الفيروسات ودراسة العدوى الفيروسية.',
    descriptionEn: 'Specialized virology department for virus detection and studying viral infections.',
    overviewAr: 'يُعد قسم علم الفيروسات في مختبر المختبر من الأقسام الرئيسية في مواجهة الأوبئة والعدوى الفيروسية، حيث نوفر أكثر من 100 اختبار فيروسي شامل. يتخصص القسم في الكشف عن فيروسات الجهاز التنفسي وفيروسات الكبد وفيروس نقص المناعة البشرية و infections الفيروسية المنقولة جنسياً. يتميز القسم بأحدث تقنيات الكشف الفيروسي الجزيئي مثل PCR في الوقت الحقيقي والكشف السريع عن المستضدات، مما يوفر تشخيصاً دقيقاً وسريعاً. يضم القسم فريقاً من علماء الفيروسات ذوي خبرة دولية في مواجهة الأوبئة.',
    heroStats: [
      { value: '100+', label: 'Viral Tests', labelAr: 'اختبار فيروسي' },
      { value: '35,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.8%', label: 'Sensitivity', labelAr: 'الحساسية' },
      { value: '15+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'covid-pcr', nameAr: 'PCR فيروس كورونا', nameEn: 'COVID-19 PCR', price: 95, turnaround: '6-12 ساعة', popular: true },
      { id: 'hepatitis-b', nameAr: 'فيروس التهاب الكبد B', nameEn: 'Hepatitis B Panel', price: 110, turnaround: '24 ساعة', popular: true },
      { id: 'hepatitis-c', nameAr: 'فيروس التهاب الكبد C', nameEn: 'Hepatitis C Antibody', price: 95, turnaround: '24 ساعة', popular: true },
      { id: 'influenza-ab', nameAr: 'إنفلونزا A و B', nameEn: 'Influenza A&B Rapid', price: 80, turnaround: 'ساعة واحدة', popular: true },
      { id: 'cmv', nameAr: 'فيروس السيتوميгалو', nameEn: 'CMV IgM & IgG', price: 85, turnaround: '24 ساعة', popular: false },
      { id: 'ebv', nameMononucleosis', nameEn: 'EBV Monospot', price: 70, turnaround: 'ساعة واحدة', popular: false },
      { id: 'hsv', nameAr: 'فيروس الهربس', nameEn: 'HSV-1 & HSV-2 PCR', price: 120, turnaround: '24 ساعة', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-fahad-viro', nameAr: 'د. فهد بن سعد العتيبي', nameEn: 'Dr. Fahad Al-Otaibi',
        titleAr: 'استشاري علم الفيروسات', titleEn: 'Consultant Virologist',
        qualifications: ['زمالة في علم الفيروسات من NIH الأمريكي', 'البورد السعودي', 'دكتوراه من جامعة كامبريدج'],
        experience: '21 سنة', specialty: 'الفيروسات التنفسية والأوبئة',
      },
      {
        id: 'dr-huda-viro', nameAr: 'د. هدى بنت محمد الراشد', nameEn: 'Dr. Huda Al-Rashid',
        titleAr: 'أخصائية فيروسات', titleEn: 'Virologist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة ملبورن', 'خبرة في مراكز مكافحة الأمراض'],
        experience: '13 سنة', specialty: 'الفيروسات المنقولة جنسياً وفيروسات الكبد',
      },
    ],
    equipment: [
      { nameAr: 'جهاز PCR الفيروسي', nameEn: 'Viral PCR System', brand: 'Cobas 6800', description: 'نظام PCR فيروسي آلي عالي الإنتاجية للكشف السريع والدقيق' },
      { nameAr: 'جهاز الكشف السريع', nameEn: 'Rapid Antigen Test', brand: 'Abbott Panbio', description: 'نظام كشف سريع بالمستضد للفيروسات التنفسية' },
      { nameAr: 'جهاز التسلسل الفيروسي', nameEn: 'Viral Sequencer', brand: 'Illumina iSeq 100', description: 'نظام تسلسل فيروسي لتتبع الطفرات الفيروسية' },
    ],
    technology: [
      { name: 'Real-Time PCR', description: 'PCR في الوقت الحقيقي للكشف الفيروسي السريع', icon: '🔬' },
      { name: 'Antigen Testing', description: 'الكشف السريع بالمستضدات لحالات الطوارئ', icon: '⚡' },
      { name: 'Next-Gen Sequencing', description: 'تسلسل الجيل التالي لتتبع التطور الفيروسي', icon: '🧬' },
    ],
    preparationGuide: [
      'في اختبار PCR: جمع المسحة في الوقت المناسب من بداية الأعراض',
      'في تحاليل الدم الفيروسية: لا يحتاج لصيام',
      'في تحاليل الكبد الوبائي: تجنب الكحول قبل التحليل بيوم',
      'في فحص الهربس: جمع العينة من البثور النشطة إذا أمكن',
    ],
    expectedTime: { standard: 'ساعة - 24 ساعة', rush: '30 دقيقة', stat: '15 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع تحاليل الفيروسات والمتحورات' },
      { provider: 'التعاونية', coverage: 'تغطية 85%', note: 'لفحوصات فيروسات الكبد والتنفسية' },
      { provider: 'مدجلف', coverage: 'تغطية 80%', note: 'لفحوصات كورونا فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية كاملة', note: 'لفحوصات COVID-19 وحالات الطوارئ' },
    ],
    faqs: [
      { question: 'ما الفرق بين PCR والكشف السريع؟', answer: 'PCR أكثر دقة ويحتاج مخبراً مجهزاً، بينما الكشف السريع أسرع لكن دقته أقل قليلاً.' },
      { question: 'متى يجب عمل اختبار فيروسات الكبد؟', answer: 'عند وجود عوامل خطر مثل التعرض للدم أو الإبر الملوثة أو ممارسة الجنس غير الآمن.' },
      { question: 'هل يمكن كشف جميع الفيروسات بفحص واحد؟', answer: 'لا، كل فيروس يحتاج اختباراً خاصاً به، لكننا نقدم لوحات شاملة تشمل عدة فيروسات.' },
      { question: 'كم من الوقت تستغرق نتيجة PCR لكورونا؟', answer: 'نتيجة PCR لكورونا جاهزة خلال 6-12 ساعة في المختبر المجهز.' },
    ],
    articles: [
      { id: 'virus-season', title: 'فيروسات الموسم: كيف نحمي أنفسنا', excerpt: 'دليل شامل للفيروسات التنفسية الموسمية وطرق الوقاية منها', date: '2024-03-01', readTime: '7 دقائق', category: 'نصائح صحية' },
      { id: 'hepatitis-b-guide', title: 'فيروس التهاب الكبد B: كل ما تحتاج معرفته', excerpt: 'شرح مفصل عن فيروس التهاب الكبد B وأعراضه وطرق الوقاية والعلاج', date: '2024-02-15', readTime: '8 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-viro', name: 'عمر بن خالد المطيري', text: 'نتيجة كورونا PCR وصلت بسرعة كبيرة والفريق كان محترفاً جداً.', rating: 5, date: '2024-03-25' },
      { id: 't2-viro', name: 'سحر بنت عبدالرحمن العنزي', text: 'تحليل فيروسات الكبد كان دقيقاً وشاملاً، خدمة ممتازة.', rating: 5, date: '2024-02-10' },
      { id: 't3-viro', name: 'ماجد بن سعيد الدوسري', text: 'مختبر مجهز بأحدث الأجهزة وفريق طبي بارع، أنصح الجميع.', rating: 4, date: '2024-01-15' },
    ],
    relatedDepartments: ['microbiology', 'molecular-biology', 'immunology'],
    isPopular: true, order: 12, totalTests: 100, totalPatients: '35,000+', accuracy: '99.8%', experience: '15+ سنة',
  },

  {
    id: 'bacteriology',
    nameAr: 'علم البكتيريا',
    nameEn: 'Bacteriology',
    icon: '🧫',
    color: '#D97706',
    gradientFrom: '#D97706',
    gradientTo: '#B45309',
    descriptionAr: 'قسم علم البكتيريا المتخصص في الكشف عن البكتيريا المسببة للأمراض وفحص حساسيتها للمضادات.',
    descriptionEn: 'Specialized bacteriology department for detecting disease-causing bacteria and antibiotic sensitivity testing.',
    overviewAr: 'يُعد قسم علم البكتيريا في مختبر المختبر من أهم الأقسام في مواجهة العدوى البكتيرية، حيث نستخدم أحدث تقنيات الزراعة والكشف عن البكتيريا المسببة للأمراض المختلفة. يتخصص القسم في الكشف عن البكتيريا المقاومة للمضادات الحيوية وتقييم أنماط الحساسية لاختيار العلاج المناسب. يتميز القسم بوجود جهاز تحديد البكتيريا الآلي الذي يوفر تشخيصاً دقيقاً وسريعاً، بالإضافة إلى مختبر مجهز بالكامل لإجراء اختبارات الحساسية والسلالات البكتيرية. يضم القسم فريقاً من علماء البكتيريا ذوي خبرة واسعة في مكافحة العدوى.',
    heroStats: [
      { value: '300+', label: 'Bacteria Species', labelAr: 'نوع بكتيري يمكن تحديده' },
      { value: '10,000+', label: 'Cultures Monthly', labelAr: 'زراعة شهرياً' },
      { value: '99.6%', label: 'Identification Rate', labelAr: 'معدل التحديد' },
      { value: '20+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'urine-culture-bact', nameAr: 'زراعة البول للبكتيريا', nameEn: 'Urine Culture & Sensitivity', price: 55, turnaround: '24-48 ساعة', popular: true },
      { id: 'blood-culture-bact', nameAr: 'زراعة الدم للبكتيريا', nameEn: 'Blood Culture & Sensitivity', price: 95, turnaround: '24-72 ساعة', popular: true },
      { id: 'throat-culture', nameAr: 'زراعة الحلق', nameEn: 'Throat Culture', price: 45, turnaround: '48-72 ساعة', popular: false },
      { id: 'wound-culture-bact', nameAr: 'زراعة الجروح للبكتيريا', nameEn: 'Wound Culture & Sensitivity', price: 65, turnaround: '48-72 ساعة', popular: true },
      { id: 'resistance-testing', nameAr: 'فحص مقاومة البكتيريا المتقدمة', nameEn: 'Advanced Resistance Testing', price: 200, turnaround: '48-72 ساعة', popular: false },
      { id: 'mrsa-screening', nameAr: 'فحص MRSA', nameEn: 'MRSA Screening', price: 110, turnaround: '24 ساعة', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-ibrahim-bact', nameAr: 'د. إبراهيم بن محمد العتيبي', nameEn: 'Dr. Ibrahim Al-Otaibi',
        titleAr: 'استشاري علم البكتيريا', titleEn: 'Consultant Bacteriologist',
        qualifications: ['زمالة في مكافحة العدوى من CDC الأمريكي', 'البورد السعودي', 'ماجستير من جامعة أكسفورد'],
        experience: '24 سنة', specialty: 'البكتيريا المقاومة للمضادات ومكافحة العدوى',
      },
      {
        id: 'dr-ashwaq-bact', nameAr: 'د. أشواق بنت سعد الحربي', nameEn: 'Dr. Ashwaq Al-Harbi',
        titleAr: 'أخصائية علم البكتيريا', titleEn: 'Bacteriologist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة مانشستر', 'خبرة في مراكز مكافحة العدوى'],
        experience: '15 سنة', specialty: 'البكتيريا السريانية والتهابات المستشفيات',
      },
    ],
    equipment: [
      { nameAr: 'نظام تحديد البكتيريا الآلي', nameEn: 'Bacterial Identification System', brand: 'bioMérieux VITEK 2', description: 'نظام آلي لتحديد السلالات البكتيرية وفحص الحساسية في وقت قياسي' },
      { nameAr: 'جهاز زراعة الدم الآلي', nameEn: 'Automated Blood Culture', brand: 'BD BACTEC FX', description: 'نظام مراقبة آلي لكشف نمو البكتيريا في زرعات الدم' },
      { nameAr: 'مجهر عالي الدقة', nameEn: 'High-Resolution Microscope', brand: 'Zeiss Axio Observer', description: 'مجهر عالي الدقة لفحص الطبيعة البكتيرية وال确认 الميكروسكوبي' },
    ],
    technology: [
      { name: 'Automated Identification', description: 'تحديد آلي للبكتيريا باستخدام البطاقات التعريفية', icon: '🤖' },
      { name: 'E-Test Strips', description: 'شرائط E-Test لتحديد تركيز المضاد الحيوي الفعال', icon: '📏' },
      { name: 'MALDI-TOF', description: 'تحديد فوري للبكتيريا باستخدام التحليل البروتيني', icon: '⚡' },
    ],
    preparationGuide: [
      'في زراعة البول: جمع عينة التيار الأوسط في وعاء نظيف ومعقم',
      'في زراعة الدم: أخذ العينة قبل بدء المضادات الحيوية إذا أمكن',
      'في زراعة الحلق: فحص الحلق في الصباح قبل تناول الطعام أو المشروبات',
      'تجنب استخدام المضادات الحيوية قبل الزراعة بيومين على الأقل',
    ],
    expectedTime: { standard: '24-72 ساعة', rush: '12 ساعة', stat: '6 ساعات' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع زرعات البكتيريا وفحوصات الحساسية' },
      { provider: 'التعاونية', coverage: 'تغطية 80%', note: 'تشمل فحوصات الحساسية الأساسية' },
      { provider: 'مدجلف', coverage: 'تغطية 75%', note: 'لفحوصات الزراعة الأساسية' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 85%', note: 'بحد أقصى 500 ريال شهرياً' },
    ],
    faqs: [
      { question: 'لماذا تأخذ نتائج الزراعة وقتاً طويلاً؟', answer: 'البكتيريا تحتاج وقتاً للنمو في وسط الزراعة عادة 24-48 ساعة، وهناك بعض البكتيريا البطيئة النمو تحتاج وقتاً أطول.' },
      { question: 'ما فائدة فحص الحساسية؟', answer: 'فحص الحساسية يحدد المضاد الحيوي الفعال ضد البكتيريا، مما يمنع استخدام مضادات غير فعالة ويزيد من مقاومة البكتيريا.' },
      { question: 'هل يمكنني استخدام مضاد حيوي قبل زراعة الدم؟', answer: 'يُفضل عدم استخدام المضادات الحيوية قبل زراعة الدم لأنها قد تمنع نمو البكتيريا وتأثر على دقة النتيجة.' },
      { question: 'ماذا يعني MRSA؟', answer: 'MRSA هو بكتيريا المكورات العنقودية الذهبية المقاومة للميثيسيلين، وهي تحتاج علاجاً خاصاً بمضادات مختلفة.' },
    ],
    articles: [
      { id: 'antibiotic-stewardship', title: 'الإدارة الرشيدة للمضادات الحيوية', excerpt: 'أهمية الاستخدام الصحيح للمضادات الحيوية وتأثيره على مكافحة المقاومة', date: '2024-03-05', readTime: '7 دقائق', category: 'مقالات طبية' },
      { id: 'culture-guide', title: 'الدليل الكامل لزراعة البكتيريا', excerpt: 'شرح لأنواع الزرعات البكتيرية وكيفية تحضير العينات', date: '2024-02-20', readTime: '6 دقائق', category: 'إرشادات المرضى' },
    ],
    testimonials: [
      { id: 't1-bact', name: 'خالد بن عبدالرحمن الشمري', text: 'الزراعة كانت دقيقة وساعدت في اختيار المضاد الحيوي المناسب بسرعة.', rating: 5, date: '2024-03-18' },
      { id: 't2-bact', name: 'نورة بنت سلطان الهاجري', text: 'خدمة ممتازة ونتائج سريعة، فريق بكتيري محترف ومتعاون.', rating: 5, date: '2024-02-12' },
      { id: 't3-bact', name: 'ياسر بن محمد العنزي', text: 'تجربة إيجابية جداً من حيث الجودة والسرعة، أنصح بزيارة هذا المختبر.', rating: 4, date: '2024-01-28' },
    ],
    relatedDepartments: ['microbiology', 'virology', 'parasitology'],
    isPopular: true, order: 13, totalTests: 60, totalPatients: '10,000+', accuracy: '99.6%', experience: '20+ سنة',
  },

  {
    id: 'parasitology',
    nameAr: 'علم الطفيليات',
    nameEn: 'Parasitology',
    icon: '🐛',
    color: '#059669',
    gradientFrom: '#059669',
    gradientTo: '#047857',
    descriptionAr: 'قسم علم الطفيليات المتخصص في الكشف عن الطفيليات المسببة للأمراض في الدم والبراز والبول.',
    descriptionEn: 'Specialized parasitology department for detecting parasites causing diseases in blood, stool, and urine.',
    overviewAr: 'يُعد قسم علم الطفيليات في مختبر المختبر من الأقسام المتخصصة في الكشف عن الطفيليات المتنوعة التي تصيب الإنسان، بما في ذلك الملاريا والجيارديا والبلهارسيا والدودة الشريطية. يتميز القسم بأحدث تقنيات الكشف الميكروسكوبي والجزيئي التي توفر تشخيصاً دقيقاً وسريعاً للإصابة الطفيلية. يضم القسم فريقاً من المتخصصين في علم الطفيليات ذوي خبرة واسعة في المناطق endemicية، وهم يعملون على تقديم تشخيصات دقيقة تساعد الأطباء في اختيار العلاج المناسب. نقدم أيضاً فحوصات وقائية للمسافرين إلى المناطق endemicية.',
    heroStats: [
      { value: '50+', label: 'Parasite Species', labelAr: 'نوع طفيلي يمكن كشفه' },
      { value: '5,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.3%', label: 'Detection Rate', labelAr: 'معدل الكشف' },
      { value: '16+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'malaria-smear', nameAr: 'صبغة الملاريا', nameEn: 'Malaria Smear', price: 65, turnaround: 'ساعة واحدة', popular: true },
      { id: 'malaria-pcr', nameAr: 'PCR الملاريا', nameEn: 'Malaria PCR', price: 150, turnaround: '24 ساعة', popular: true },
      { id: 'stool-parasite', nameAr: 'فحص الطفيليات في البراز', nameEn: 'Stool Ova & Parasites', price: 45, turnaround: '24-48 ساعة', popular: true },
      { id: 'giardia-antigen', nameAr: 'مستضد الجيارديا', nameEn: 'Giardia Antigen', price: 80, turnaround: 'ساعتان', popular: false },
      { id: 'schistosomiasis', nameAr: 'فحوصات البلهارسيا', nameEn: 'Schistosomiasis Test', price: 90, turnaround: '24-48 ساعة', popular: false },
      { id: 'travelers-parasite', nameAr: 'فحص الطفيليات للمسافرين', nameEn: 'Traveler Parasite Panel', price: 120, turnaround: '48-72 ساعة', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-majed-para', nameAr: 'د. ماجد بن عبدالله الراشد', nameEn: 'Dr. Majed Al-Rashid',
        titleAr: 'استشاري علم الطفيليات', titleEn: 'Consultant Parasitologist',
        qualifications: ['زمالة من جامعة لندن في الطفيليات', 'البورد السعودي', 'خبرة في المناطق endemicية'],
        experience: '19 سنة', specialty: 'الملاريا والطفيليات المعوية',
      },
      {
        id: 'dr-sara-para', nameAr: 'د. سارة بنت فهد المطيري', nameEn: 'Dr. Sara Al-Mutairi',
        titleAr: 'أخصائية طفيليات', titleEn: 'Parasitologist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة هايدلبرغ', 'خبرة في فحوصات السفر'],
        experience: '11 سنة', specialty: 'الطفيليات المنقولة بالغذاء والماء',
      },
    ],
    equipment: [
      { nameAr: 'مجهر فحص الطفيليات', nameEn: 'Parasitology Microscope', brand: 'Olympus BX53', description: 'مجهر متعدد الأغراض مجهز لفحص الطفيليات في الدم والبراز' },
      { nameAr: 'جهاز PCR للطفيليات', nameEn: 'Parasite PCR System', brand: 'Applied Biosystems 7500', description: 'نظام PCR للكشف الجزيئي الدقيق عن الطفيليات' },
      { nameAr: 'نظام تجمع العينات الطفيلية', nameEn: 'Concentration System', brand: 'Sedi-Stain', description: 'نظام تكثيف لزيادة حساسية الكشف عن الطفيليات في العينات' },
    ],
    technology: [
      { name: 'Microscopy', description: 'فحص ميكروسكوبي مباشر للكشف الطفيلي السريع', icon: '🔬' },
      { name: 'Antigen Detection', description: 'كشف المستضدات السريع للطفيليات المعوية والدمية', icon: '🎯' },
      { name: 'PCR Diagnostics', description: 'تشخيص جزيئي دقيق للطفيليات بناءً على الحمض النووي', icon: '🧬' },
    ],
    preparationGuide: [
      'في فحص البراز: جمع العينة في وعاء نظيف مع وسط حفظ خاص',
      'في فحص الملاريا: جمع عينة الدم في أقرب وقت ممكن من بداية الأعراض',
      'في فحوصات السفر: عمل الفحص قبل السفر بأسبوعين وأثناء السفر وبعده',
      'في فحص البلهارسيا: جمع عينة البول في منتصف التيار صباحاً',
    ],
    expectedTime: { standard: '24-48 ساعة', rush: 'ساعة واحدة', stat: '15 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع تحاليل الطفيليات والملاريا' },
      { provider: 'التعاونية', coverage: 'تغطية 75%', note: 'للفحوصات الأساسية فقط' },
      { provider: 'مدجلف', coverage: 'تغطية 70%', note: 'لحالات الطوارئ' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 80%', note: 'لفحوصات الملاريا والطفيليات الخطيرة' },
    ],
    faqs: [
      { question: 'هل يمكنني الكشف عن الطفيليات في المنزل؟', answer: 'يمكن جمع عينة البراز في المنزل، لكن الفحص الفعلي يتم في المختبر باستخدام مجهر متخصص.' },
      { question: 'ما هي الطفيليات الأكثر شيوعاً في السعودية؟', answer: 'الجيارديا والبلهارسيا والدودة الدوارة من أكثر الطفيليات شيوعاً في المملكة.' },
      { question: 'هل فحص الطفيليات مؤلم؟', answer: 'لا، الفحص لا يؤلم لأنه يتم فقط عبر جمع عينات من الدم أو البراز أو البول.' },
      { question: 'متى يجب عمل فحص طفيليات بعد السفر؟', answer: 'يُفضل العمل خلال أسبوع إلى أسبوعين من العودة من السفر، وإذا ظهرت أعراض فوراً.' },
    ],
    articles: [
      { id: 'malaria-prevention', title: 'الوقاية من الملاريا أثناء السفر', excerpt: 'نصائح مهمة للوقاية من الملاريا في المناطق endemicية', date: '2024-02-28', readTime: '5 دقائق', category: 'نصائح السفر' },
      { id: 'parasites-food', title: 'الطفيليات المنقولة بالغذاء', excerpt: 'شرح لأهم الطفيليات التي تنتقل عبر الغذاء وكيفية الوقاية منها', date: '2024-01-25', readTime: '6 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-para', name: 'عبدالله بن سعيد الحربي', text: 'فحص الملاريا كان سريعاً ودقيقاً، والطبيب كان محترفاً في التعامل.', rating: 5, date: '2024-03-15' },
      { id: 't2-para', name: 'هداء بنت أحمد العنزي', text: 'خدمة ممتازة وفريق متخصص، نتائج فحص الطفيليات كانت واضحة ومفيدة.', rating: 5, date: '2024-02-22' },
      { id: 't3-para', name: 'فهد بن خالد الشمري', text: 'تجربة جيدة في فحوصات ما بعد السفر، أنصح بالتعامل مع هذا المختبر.', rating: 4, date: '2024-01-18' },
    ],
    relatedDepartments: ['microbiology', 'stool-analysis', 'urinalysis'],
    isPopular: false, order: 14, totalTests: 50, totalPatients: '5,000+', accuracy: '99.3%', experience: '16+ سنة',
  },

  {
    id: 'urinalysis',
    nameAr: 'تحليل البول',
    nameEn: 'Urinalysis',
    icon: '💧',
    color: '#0EA5E9',
    gradientFrom: '#0EA5E9',
    gradientTo: '#0284C7',
    descriptionAr: 'قسم تحليل البول المتخصص في فحص مكونات البول الكيميائية والميكروسكوبي لتشخيص أمراض الكلى والمثانة.',
    descriptionEn: 'Specialized urinalysis department for examining urine chemical and microscopic components.',
    overviewAr: 'يُعد قسم تحليل البول في مختبر المختبر من أكثر الأقسام استخداماً يومياً، حيث نقدم تحاليل بول شاملة تشمل الفحص الكيميائي والميكروسكوبي والبكتيري. يتميز القسم بأحدث الأجهزة الأوتوماتيكية التي تحلل مكونات البول بدقة عالية، بالإضافة إلى فحص ميكروسكوبي دقيق يكشف عن الخلايا والبلورات والطفيليات في البول. يُعد تحليل البول من أهم الفحوصات التشخيصية التي تساعد في اكتشاف أمراض الكلى والمثانة والسكري والاحتباس المائي مبكراً. يعمل في القسم فريق من التقنيين المدربين على أعلى مستوى لضمان دقة النتائج.',
    heroStats: [
      { value: '20,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '15+', label: 'Parameters Tested', labelAr: 'معيار يتم فحسه' },
      { value: '99.5%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '22+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'ua-complete', nameAr: 'تحليل البول الشامل', nameEn: 'Complete Urinalysis', price: 30, turnaround: 'ساعة واحدة', popular: true },
      { id: 'ua-micro', nameAr: 'التحليل الميكروسكوبي للبول', nameEn: 'Urine Microscopy', price: 35, turnaround: 'ساعة واحدة', popular: true },
      { id: 'ua-culture', nameAr: 'زراعة البول', nameEn: 'Urine Culture', price: 55, turnaround: '24-48 ساعة', popular: true },
      { id: 'ua-protein', nameAr: 'بروتين البول الكمي', nameEn: 'Urine Protein Quantitative', price: 40, turnaround: 'ساعتان', popular: false },
      { id: 'ua-creatinine', nameAr: 'كرياتينين البول', nameEn: 'Urine Creatinine', price: 35, turnaround: 'ساعتان', popular: false },
      { id: 'ua-pregnancy', nameAr: 'اختبار الحمل في البول', nameEn: 'Urine Pregnancy Test', price: 25, turnaround: '15 دقيقة', popular: true },
      { id: 'ua-ketones', nameAr: 'كيتونات البول', nameEn: 'Urine Ketones', price: 20, turnaround: '15 دقيقة', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-saleh-uria', nameAr: 'د. صالح بن محمد السبيعي', nameEn: 'Dr. Saleh Al-Subaie',
        titleAr: 'استشاري تحليل البول', titleEn: 'Consultant Urinalysis Specialist',
        qualifications: ['البورد السعودي في المختبرات', 'ماجستير من جامعة هايدلبرغ', 'خبرة 22 سنة في تحليل البول'],
        experience: '22 سنة', specialty: 'التحليل الميكروسكوبي الدقيق للبول',
      },
      {
        id: 'dr-amal-uria', nameAr: 'د. أمل بنت خالد القرني', nameEn: 'Dr. Amal Al-Qarni',
        titleAr: 'أخصائية تحليل البول', titleEn: 'Urinalysis Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة أديلايد', 'خبرة في الأجهزة الأوتوماتيكية'],
        experience: '14 سنة', specialty: 'التحليل الكيميائي والميكروسكوبي الشامل',
      },
    ],
    equipment: [
      { nameAr: 'جهاز تحليل البول الآلي', nameEn: 'Automated Urinalysis System', brand: 'Sysmex UN-series', description: 'نظام آلي شامل يجمع بين التحليل الكيميائي والميكروسكوبي' },
      { nameAr: 'جهاز الفحص الميكروسكوبي الآلي', nameEn: 'Automated Microscopy', brand: 'Sysmex UF-5000', description: 'نظام فحص ميكروسكوبي آلي للكشف عن الخلايا والبلورات والبكتيريا' },
      { nameAr: 'شريط التحليل السريع', nameEn: 'Urine Test Strips', brand: 'Siemens Multistix Pro', description: 'شرائط تحليل سريعة للكشف عن المعايير الكيميائية الأساسية' },
    ],
    technology: [
      { name: 'Automated Sediment', description: 'تحليل ترسبي آلي يقلل الأخطاء البشرية ويزيد الدقة', icon: '🤖' },
      { name: 'Flow Cytometry', description: ' Counting خلايا البول باستخدام الفلوسايتومتري', icon: '🔬' },
      { name: 'Digital Microscopy', description: 'تصوير رقمي للعنصر الترسبي للتأكد من النتائج', icon: '📸' },
    ],
    preparationGuide: [
      'جمع عينة البول في وعاء نظيف ومعقم من المختبر',
      'التوصيل بجمع عينة التيار الأوسط في الصباح الباكر',
      'في الفحص البكتيري: حفظ العينة في الثلاجة حتى التوصيل',
      'تجنب شرب الكمية الكبيرة من الماء قبل جمع العينة مباشرة',
    ],
    expectedTime: { standard: 'ساعة واحدة', rush: '15 دقيقة', stat: '5 دقائق' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع تحاليل البول الأساسية والمتقدمة' },
      { provider: 'التعاونية', coverage: 'تغطية 90%', note: 'تشمل جميع الفحوصات الروتينية' },
      { provider: 'مدجلف', coverage: 'تغطية 85%', note: 'لفحوصات التحليل الشامل فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية كاملة', note: 'لفحوصات التحليل البولية الشاملة' },
    ],
    faqs: [
      { question: 'كيف أحضر عينة البول للفحص؟', answer: 'استخدم وعاء نظيف من المختبر، واجمع عينة التيار الأوسط في الصباح الباكر، وأحضرها للمختبر في أسرع وقت.' },
      { question: 'هل يُشترط الصيام لتحليل البول؟', answer: 'لا يحتاج تحليل البول لصيام، لكن يُفضل جمع العينة في الصباح الباكر بعد النوم.' },
      { question: 'ماذا يعني وجود بروتين في البول؟', answer: 'وجود بروتين في البول قد يدل على مشاكل في الكلى أو التهاب أو ارتفاع ضغط الدم، ويجب تأكيد النتيجة.' },
      { question: 'كم من الوقت تستغرق نتيجة تحليل البول؟', answer: 'التحليل الأساسي جاهز خلال ساعة، والتحليل الشامل مع الفحص الميكروسكوبي خلال ساعة إلى ساعتين.' },
    ],
    articles: [
      { id: 'urine-test-guide', title: 'الدليل الشامل لتحليل البول', excerpt: 'شرح مفصل لأنواع تحاليل البول وكيفية تحضير العينة بشكل صحيح', date: '2024-02-18', readTime: '5 دقائق', category: 'إرشادات المرضى' },
      { id: 'kidney-stones', title: 'أحجار الكلى: التشخيص والوقاية', excerpt: 'شرح لأسباب تكوين أحجار الكلى وكيفية الوقاية منها', date: '2024-01-30', readTime: '6 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-uria', name: 'عبدالرحمن بن سعد العنزي', text: 'تحليل البول كان سريعاً ودقيقاً، النتائج جاهزة في أقل من ساعة.', rating: 5, date: '2024-03-10' },
      { id: 't2-uria', name: 'مريم بنت محمد الحربي', text: 'خدمة ممتازة وفريق طبي محترف، أنصح بزيارة هذا المختبر لجميع التحاليل.', rating: 5, date: '2024-02-15' },
      { id: 't3-uria', name: 'سلطان بن خالد الدوسري', text: 'تجربة جيدة جداً، الأسعار معقولة والجودة عالية.', rating: 4, date: '2024-01-22' },
    ],
    relatedDepartments: ['kidney-function', 'stool-analysis', 'diabetes'],
    isPopular: true, order: 15, totalTests: 35, totalPatients: '20,000+', accuracy: '99.5%', experience: '22+ سنة',
  },

  {
    id: 'stool-analysis',
    nameAr: 'تحليل البراز',
    nameEn: 'Stool Analysis',
    icon: '🧫',
    color: '#84CC16',
    gradientFrom: '#84CC16',
    gradientTo: '#65A30D',
    descriptionAr: 'قسم تحليل البراز المتخصص في فحص مكونات البراز لتشخيص أمراض الجهاز الهضمي والعدوى المعوية.',
    descriptionEn: 'Specialized stool analysis department for examining stool components to diagnose gastrointestinal diseases.',
    overviewAr: 'يُعد قسم تحليل البراز في مختبر المختبر من الأقسام المهمة في تشخيص أمراض الجهاز الهضمي والعدوى المعوية، حيث نقدم تحاليل شاملة تشمل الفحص الكيميائي والميكروسكوبي والبكتيري لعينات البراز. يتخصص القسم في الكشف عن الطفيليات المعوية والبكتيريا المسببة للإسهال والدم الخفي في البراز. يتميز القسم بأحدث الأجهزة الأوتوماتيكية التي توفر تحليلات دقيقة وسريعة، بالإضافة إلى فحص ميكروسكوبي دقيق للطفيليات والأوّات. يُعد تحليل البراز من أهم الفحوصات في تشخيص التهاب القولون وأمراض الجهاز الهضمي.',
    heroStats: [
      { value: '8,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '20+', label: 'Parameters Tested', labelAr: 'معيار يتم فحسه' },
      { value: '99.4%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '18+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'stool-complete', nameAr: 'تحليل البراز الشامل', nameEn: 'Complete Stool Analysis', price: 45, turnaround: 'ساعتان', popular: true },
      { id: 'stool-ova-parasites', nameAr: 'فحص الأوّات والطفيليات في البراز', nameEn: 'Stool Ova & Parasites', price: 55, turnaround: '24-48 ساعة', popular: true },
      { id: 'stool-culture', nameAr: 'زراعة البراز', nameEn: 'Stool Culture', price: 50, turnaround: '48-72 ساعة', popular: true },
      { id: 'occult-blood', nameAr: 'الدم الخفي في البراز', nameEn: 'Fecal Occult Blood Test', price: 35, turnaround: 'ساعتان', popular: true },
      { id: 'calprotectin', nameAr: 'الكالبروتكتين البرازي', nameEn: 'Fecal Calprotectin', price: 120, turnaround: '24 ساعة', popular: false },
      { id: 'stool-c-diff', nameAr: 'بكتيريا كلوستريديوم ديفيسيل', nameEn: 'C. difficile Toxin', price: 95, turnaround: 'ساعتان', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-khaled-stool', nameAr: 'د. خالد بن سعيد العنزي', nameEn: 'Dr. Khaled Al-Anzi',
        titleAr: 'استشاري تحليل البراز', titleEn: 'Consultant Stool Analysis Specialist',
        qualifications: ['البورد السعودي في المختبرات', 'ماجستير من جامعة ميلبورن', 'خبرة في أمراض الجهاز الهضمي'],
        experience: '19 سنة', specialty: 'الطفيليات المعوية والبكتيريا المسببة للإسهال',
      },
      {
        id: 'dr-fatima-stool', nameAr: 'د. فاطمة بنت عبدالله المطيري', nameEn: 'Dr. Fatima Al-Mutairi',
        titleAr: 'أخصائية تحليل البراز', titleEn: 'Stool Analysis Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة أديلايد', 'خبرة في التحليل الميكروسكوبي'],
        experience: '12 سنة', specialty: 'الفحص الميكروسكوبي للطفيليات والأوّات',
      },
    ],
    equipment: [
      { nameAr: 'جهاز تحليل البراز الآلي', nameEn: 'Automated Stool Analyzer', brand: 'Sysmex UD-1000', description: 'نظام آلي شامل لتحليل مكونات البراز الكيميائية والميكروسكوبي' },
      { nameAr: 'مجهر تحليل البراز', nameEn: 'Stool Microscope', brand: 'Olympus CX43', description: 'مجهر متخصص لفحص الطفيليات والأوّات والبكتيريا في البراز' },
      { nameAr: 'جهاز كشف الدم الخفي', nameEn: 'Occult Blood Detector', brand: 'OC-Sensor i10', description: 'نظام كشف الدم الخفي في البراز بحساسية عالية' },
    ],
    technology: [
      { name: 'Automated Analysis', description: 'تحليل آلي لكونتات البراز وounting الخلايا', icon: '🤖' },
      { name: 'Microscopy', description: 'فحص ميكروسكوبي مباشر للكشف عن الطفيليات والأوّات', icon: '🔬' },
      { name: 'Immunoassay', description: 'كشف مناعي عالي الحساسية للكشف عن الدم الخفي والمستضدات', icon: '🎯' },
    ],
    preparationGuide: [
      'جمع العينة في وعاء نظيف ومحكم الإغلاق من المختبر',
      'تجنب تناول اللحوم الحمراء قبل 3 أيام من الفحص في حالة فحص الدم الخفي',
      'تجنب تناول فيتامين C بجرعات عالية قبل الفحص',
      'في حالة الشك في طفيليات: جمع عدة عينات على 3 أيام مختلفة',
    ],
    expectedTime: { standard: 'ساعتان - 48 ساعة', rush: 'ساعة واحدة', stat: '30 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع تحاليل البراز الشاملة' },
      { provider: 'التعاونية', coverage: 'تغطية 80%', note: 'للفحوصات الأساسية والبكتيرية' },
      { provider: 'مدجلف', coverage: 'تغطية 75%', note: 'لفحوصات التحليل الأساسي' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 85%', note: 'بحد أقصى 400 ريال شهرياً' },
    ],
    faqs: [
      { question: 'كيف أحضر عينة البراز للفحص؟', answer: 'استخدم وعاء مجهز من المختبر، واجمع جزءاً صغيراً من البراز، وأغلق الوعاء بإحكام وأحضره للمختبر.' },
      { question: 'ما معنى وجود الدم الخفي في البراز؟', answer: 'الدم الخفي قد يدل على نزيف في الجهاز الهضمي، وقد يكون مبكراً للكشف عن سرطان القولون.' },
      { question: 'هل أحتاج لأكثر من عينة؟', answer: 'نعم، في بعض الحالات قد يحتاج الطبيب لعدة عينات على 3 أيام مختلفة لزيادة الدقة.' },
      { question: 'ماذا يعني تحليل البراز الشامل؟', answer: 'يشمل الفحص الكيميائي والميكروسكوبي والبكتيري، ويكشف عن الطفيليات والبكتيريا والدم والبروتين.' },
    ],
    articles: [
      { id: 'digestive-health', title: 'صحة الجهاز الهضمي: دليل شامل', excerpt: 'نصائح للحفاظ على صحة الجهاز الهضمي وأهمية تحليل البراز', date: '2024-03-08', readTime: '6 دقائق', category: 'نصائح صحية' },
      { id: 'occult-blood-importance', title: 'أهمية كشف الدم الخفي في البراز', excerpt: 'شرح لأهمية الفحص ودوره في الكشف المبكر عن سرطان القولون', date: '2024-02-20', readTime: '5 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-stool', name: 'عبدالله بن خالد الشمري', text: 'تحليل البراز كان دقيقاً وسريعاً، النتائج ساعدت الطبيب في التشخيص.', rating: 5, date: '2024-03-12' },
      { id: 't2-stool', name: 'سميرة بنت أحمد العنزي', text: 'خدمة ممتازة وخصوصية تامة، فريق طبي محترف ومتعاون.', rating: 5, date: '2024-02-28' },
      { id: 't3-stool', name: 'ياسر بن سعد الحربي', text: 'تجربة إيجابية جداً، الأسعار معقولة والجودة عالية.', rating: 4, date: '2024-01-15' },
    ],
    relatedDepartments: ['parasitology', 'bacteriology', 'liver-function'],
    isPopular: false, order: 16, totalTests: 30, totalPatients: '8,000+', accuracy: '99.4%', experience: '18+ سنة',
  },

  {
    id: 'hormones',
    nameAr: 'الهرمونات',
    nameEn: 'Hormones',
    icon: '⚗️',
    color: '#C084FC',
    gradientFrom: '#C084FC',
    gradientTo: '#A855F7',
    descriptionAr: 'قسم الهرمونات المتخصص في قياس وتحليل جميع أنواع الهرمونات في الجسم.',
    descriptionEn: 'Specialized hormones department for measuring and analyzing all types of hormones in the body.',
    overviewAr: 'يُعد قسم الهرمونات في مختبر المختبر من أكثر الأقسام شمولاً في المنطقة، حيث نقدم أكثر من 80 اختبار هرموني شامل يغطي جميع الغدد الصماء في الجسم. يتخصص القسم في قياس الهرمونات الجنسية والهرمونات الدرقية والهرمونات التناسلية والهرمونات الكظرية. يتميز القسم بأحدث تقنيات قياس الهرمونات العالية الحساسية مثل الكيمياء المضيئة والإليزا، مما يوفر قياساً دقيقاً وموثوقاً. يضم القسم فريقاً من الكيميائيين المتخصصين في الهرمونات ذوي خبرة واسعة في تفسير نتائج الهرمونات المعقدة.',
    heroStats: [
      { value: '80+', label: 'Hormone Tests', labelAr: 'اختبار هرموني' },
      { value: '15,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.8%', label: 'Sensitivity', labelAr: 'الحساسية' },
      { value: '17+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'tsh-free-t4', nameAr: 'TSH و T4 الحر', nameEn: 'TSH & Free T4', price: 75, turnaround: 'ساعتان', popular: true },
      { id: 'testosterone-total', nameAr: 'التسيتسيتسيتيروستيرون الكلي', nameEn: 'Total Testosterone', price: 65, turnaround: '24 ساعة', popular: true },
      { id: 'estradiol', nameAr: 'الإيستراديول', nameEn: 'Estradiol (E2)', price: 70, turnaround: '24 ساعة', popular: true },
      { id: 'progesterone', nameAr: 'البروجسترون', nameEn: 'Progesterone', price: 65, turnaround: '24 ساعة', popular: false },
      { id: 'cortisol-morning', nameAr: 'الكورتيزول الصباحي', nameEn: 'Morning Cortisol', price: 55, turnaround: 'ساعتان', popular: true },
      { id: 'dhea-s', nameAr: 'DHEA-S', nameEn: 'DHEA-S', price: 80, turnaround: '24 ساعة', popular: false },
      { id: 'shbg', nameAr: 'بروتين الارتباط بالهرمونات الجنسية', nameEn: 'SHBG', price: 75, turnaround: '24 ساعة', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-abdullah-horm', nameAr: 'د. عبدالله بن سعيد الهاجري', nameEn: 'Dr. Abdullah Al-Hajri',
        titleAr: 'استشاري الهرمونات', titleEn: 'Consultant Hormone Specialist',
        qualifications: ['زمالة أمريكية في الغدد الصماء', 'البورد السعودي', 'ماجستير من جامعة ستانفورد'],
        experience: '21 سنة', specialty: 'الهرمونات الجنسية والتناسلية',
      },
      {
        id: 'dr-nouf-horm', nameAr: 'د. نوف بنت خالد العتيبي', nameEn: 'Dr. Nouf Al-Otaibi',
        titleAr: 'أخصائية هرمونات', titleEn: 'Hormone Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة تورنتو', 'خبرة في قياس الهرمونات المتقدمة'],
        experience: '14 سنة', specialty: 'الهرمونات الدرقية والكظرية',
      },
    ],
    equipment: [
      { nameAr: 'جهاز قياس الهرمونات', nameEn: 'Hormone Analyzer', brand: 'Roche Cobas e801', description: 'نظام قياس الهرمونات الكيميائي المضيء العالي الحساسية' },
      { nameAr: 'جهاز ELISA الهرموني', nameEn: 'Hormone ELISA Reader', brand: 'Tecan Infinite 200', description: 'قارئ ELISA عالي الأداء لتحليل الهرمونات' },
      { nameAr: 'جهاز قياس الأنسولين', nameEn: 'Insulin Analyzer', brand: 'Abbott ARCHITECT', description: 'نظام قياس الأنسولين بحساسية عالية ودقة فائقة' },
    ],
    technology: [
      { name: 'Electrochemiluminescence', description: 'تقنية الكيمياء المضيئة لقياس الهرمونات بدقة عالية', icon: '✨' },
      { name: 'Immunoassay', description: 'تحليل مناعي عالي الحساسية للهرمونات بتركيزات منخفضة', icon: '🧫' },
      { name: 'LC-MS', description: 'كروماتوغرافيا سائلة-كتلة متحمة للهرمونات الدقيقة', icon: '📊' },
    ],
    preparationGuide: [
      'في تحليل الكورتيزول: جمع العينة صباحاً بين الساعة 8 و10 مع الصيام',
      'في تحليل الهرمونات الجنسية للسيدات: تحديد يوم الدورة الشهرية',
      'في تحليل الأنسولين: الصيام 10-12 ساعة قبل جمع العينة',
      'في تحليل الهرمونات الدرقية: يمكن تناول الأدوية الدرقية عادةً',
    ],
    expectedTime: { standard: 'ساعتان - 24 ساعة', rush: 'ساعة واحدة', stat: '30 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع تحاليل الهرمونات' },
      { provider: 'التعاونية', coverage: 'تغطية 80%', note: 'للفحوصات الهرمونية الأساسية' },
      { provider: 'مدجلف', coverage: 'تغطية 75%', note: 'لفحوصات الدرقية فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 85%', note: 'بحد أقصى 500 ريال شهرياً' },
    ],
    faqs: [
      { question: 'متى يجب قياس الهرمونات؟', answer: 'عند وجود أعراض مثل اضطرابات الدورة الشهرية ومشاكل الخصوبة وتغيرات الوزن والإرهاق.' },
      { question: 'هل تحليل الهرمونات يحتاج صيام؟', answer: 'بعض الهرمونات تحتاج صيام مثل الأنسولين والكورتيزول، والبعض الآخر لا يحتاج مثل هرمونات الدرقية.' },
      { question: 'ما الفرق بين التستوسيتيرون الكلي والحر؟', answer: 'الكلي يقي كل التستوسيتيرون في الدم، بينما الحر يقي النسبة الفعالة المتاحة للأنسجة.' },
      { question: 'كم من الوقت تستغرق نتيجة تحليل الهرمونات؟', answer: 'معظم النتائج جاهزة خلال ساعتين إلى 24 ساعة حسب نوع الهرمون المستهدف.' },
    ],
    articles: [
      { id: 'hormone-imbalance', title: 'اختلال التوازن الهرموني: أعراض وعلاج', excerpt: 'شرح لأعراض اختلال الهرمونات وطرق العلاج والوقاية', date: '2024-03-05', readTime: '7 دقائق', category: 'مقالات طبية' },
      { id: 'fertility-hormones', title: 'الهرمونات والخصوبة', excerpt: 'دور الهرمونات في الخصوبة وكيفية تحسين فرص الحمل', date: '2024-02-12', readTime: '6 دقائق', category: 'صحة المرأة' },
    ],
    testimonials: [
      { id: 't1-horm', name: 'سحر بنت عبدالرحمن الشمري', text: 'تحليل الهرمونات كان دقيقاً وشاملاً، ساعدني في فهم أسباب مشكلتي.', rating: 5, date: '2024-03-18' },
      { id: 't2-horm', name: 'عبدالرحمن بن محمد العنزي', text: 'خدمة ممتازة ونتائج سريعة، فريق طبي متخصص ومتعاون.', rating: 5, date: '2024-02-25' },
      { id: 't3-horm', name: 'مريم بنت سلطان الحربي', text: 'تجربة جيدة جداً من حيث الجودة والسرعة والأسعار المعقولة.', rating: 4, date: '2024-01-20' },
    ],
    relatedDepartments: ['endocrinology', 'fertility', 'diabetes'],
    isPopular: true, order: 17, totalTests: 80, totalPatients: '15,000+', accuracy: '99.8%', experience: '17+ سنة',
  },

  {
    id: 'tumor-markers',
    nameAr: 'ماركرات الورم',
    nameEn: 'Tumor Markers',
    icon: '🎯',
    color: '#E11D48',
    gradientFrom: '#E11D48',
    gradientTo: '#BE123C',
    descriptionAr: 'قسم ماركرات الورم المتخصص في الكشف عن علامات الأورام السرطانية في الدم والأنسجة.',
    descriptionEn: 'Specialized tumor markers department for detecting cancer markers in blood and tissues.',
    overviewAr: 'يُعد قسم ماركرات الورم في مختبر المختبر من الأقسام الحيوية في الكشف المبكر عن السرطانات وmonitoring العلاج، حيث نقدم أكثر من 40 اختبار ماركر ورمي شامل. يتخصص القسم في الكشف عن ماركرات سرطان البروستاتا والثدي والمبيض والقولون والرئة والبنكرياس. يتميز القسم بأحدث تقنيات قياس الماركرات العالية الحساسية التي تكشف عن ارتفاع مستويات الماركرات بمجرد ظهورها. يُستخدم فحص الماركرات الورمية في التشخيص المبكر ومتابعة فعالية العلاج واكتشاف العودة المبكرة.',
    heroStats: [
      { value: '40+', label: 'Tumor Markers', labelAr: 'ماركر ورمي' },
      { value: '12,000+', label: 'Tests Annually', labelAr: 'اختبار سنوياً' },
      { value: '99.5%', label: 'Detection Rate', labelAr: 'معدل الكشف' },
      { value: '16+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'psa', nameAr: 'مستضد البروستاتا النوعي PSA', nameEn: 'Total PSA', price: 65, turnaround: 'ساعتان', popular: true },
      { id: 'psa-free', nameAr: 'PSA الحر', nameEn: 'Free PSA', price: 85, turnaround: 'ساعتان', popular: true },
      { id: 'cea', nameAr: 'الساركون Embryonic Antigen CEA', nameEn: 'CEA', price: 75, turnaround: '24 ساعة', popular: true },
      { id: 'ca125', nameAr: 'маркер CA-125', nameEn: 'CA-125', price: 80, turnaround: '24 ساعة', popular: true },
      { id: 'ca19-9', nameAr: 'ماركر CA 19-9', nameEn: 'CA 19-9', price: 85, turnaround: '24 ساعة', popular: false },
      { id: 'ca15-3', nameAr: 'ماركر CA 15-3', nameEn: 'CA 15-3', price: 80, turnaround: '24 ساعة', popular: false },
      { id: 'afp', nameAr: 'البروتين الأجني α-Fetoprotein', nameEn: 'AFP', price: 70, turnaround: '24 ساعة', popular: true },
      { id: 'beta-hcg', nameAr: 'β-HCG الكمي', nameEn: 'Beta-HCG Quantitative', price: 55, turnaround: 'ساعتان', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-hassan-tumor', nameAr: 'د. حسن بن عبدالله الراشد', nameEn: 'Dr. Hassan Al-Rashid',
        titleAr: 'استشاري ماركرات الأورام', titleEn: 'Consultant Tumor Marker Specialist',
        qualifications: ['زمالة في علم الأورام من MD Anderson', 'البورد السعودي', 'ماجستير من جامعة هارفارد'],
        experience: '20 سنة', specialty: 'الماركرات الورمية والكشف المبكر عن السرطان',
      },
      {
        id: 'dr-nadia-tumor', nameAr: 'د. نادية بنت سعيد العتيبي', nameEn: 'Dr. Nadia Al-Otaibi',
        titleAr: 'أخصائية ماركرات ورمية', titleEn: 'Tumor Marker Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة كامبريدج', 'خبرة في مراكز الأورام الكبرى'],
        experience: '14 سنة', specialty: 'المتابعة الورمية والتشخيص التفريقي',
      },
    ],
    equipment: [
      { nameAr: 'جهاز قياس الماركرات الورمية', nameEn: 'Tumor Marker Analyzer', brand: 'Roche Cobas e801', description: 'نظام قياس عالي الحساسية للماركرات الورمية الدقيقة' },
      { nameAr: 'جهاز ELISA للأورام', nameEn: 'Tumor ELISA System', brand: 'BioTek ELx50', description: 'نظام ELISA متعدد للتحليل المتوازٍ للماركرات الورمية' },
      { nameAr: 'جهاز قياس الكيمياء المضيئة', nameEn: 'Chemiluminescence System', brand: 'Siemens ADVIA Centaur', description: 'نظام كيمياء مضيئة لقياس الماركرات بحساسية فائقة' },
    ],
    technology: [
      { name: 'Electrochemiluminescence', description: 'قياس عالي الحساسية للماركرات باستخدام الكيمياء المضيئة', icon: '✨' },
      { name: 'Immunoassay Panels', description: 'لوحات مناعية شاملة لفحص أورام متعددة في عينة واحدة', icon: '🧪' },
      { name: 'Serial Monitoring', description: 'monitoring متسلسل لتتبع تغيرات الماركرات عبر الزمن', icon: '📈' },
    ],
    preparationGuide: [
      'لا يحتاج فحص الماركرات الورمية لصيام في أغلب الحالات',
      'في فحص PSA: تجنب فحص البروستاتا الشفوي قبل الفحص بيومين',
      'في فحص CA-125: تحديد يوم الدورة الشهرية للسيدات',
      'إبلاغ الطبيب بجميع الأدوية التي تتناولها خاصة أدوية السكري',
    ],
    expectedTime: { standard: 'ساعتان - 24 ساعة', rush: 'ساعة واحدة', stat: '30 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع فحوصات الماركرات الورمية' },
      { provider: 'التعاونية', coverage: 'تغطية 85%', note: 'لفحوصات التشخيص والمتابعة' },
      { provider: 'مدجلف', coverage: 'تغطية 80%', note: 'لفحوصات المتابعة بعد العلاج' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية كاملة', note: 'بحد أقصى 1500 ريال شهرياً' },
    ],
    faqs: [
      { question: 'هل ارتفاع الماركر يعني بالضرورة وجود سرطان؟', answer: 'لا، ارتفاع الماركر قد يدل على أسباب غير سرطانية مثل الالتهابات، ويجب تفسيره مع الفحص السريري.' },
      { question: 'متى يجب عمل فحص الماركرات الورمية؟', answer: 'عند وجود عوامل خطر أو تاريخ عائلي للسرطان أو كجزء من المتابعة بعد العلاج.' },
      { question: 'هل يمكن فحص كل أنواع السرطان بماركر واحد؟', answer: 'لا، كل نوع سرطان له ماركر خاص، وهناك ماركرات عامة قد ترتفع في عدة أنواع.' },
      { question: 'كم من الوقت تستغرق نتيجة فحص الماركرات؟', answer: 'معظم النتائج جاهزة خلال ساعتين إلى 24 ساعة حسب نوع الماركر.' },
    ],
    articles: [
      { id: 'cancer-screening', title: 'الكشف المبكر عن السرطان: دليل شامل', excerpt: 'شرح لأهم فحوصات الكشف المبكر عن السرطان وأعمار الفحص الموصى بها', date: '2024-03-10', readTime: '8 دقائق', category: 'مقالات طبية' },
      { id: 'psa-testing', title: 'فحص PSA: متى وكيف؟', excerpt: 'دليل شامل لفحص مستضد البروستاتا وأهميته في الكشف المبكر', date: '2024-02-15', readTime: '6 دقائق', category: 'إرشادات المرضى' },
    ],
    testimonials: [
      { id: 't1-tumor', name: 'عبدالرحمن بن سعيد الدوسري', text: 'فحص الماركرات كان دقيقاً وشاملاً، ساعد في المتابعة بعد العلاج.', rating: 5, date: '2024-03-20' },
      { id: 't2-tumor', name: 'هدى بنت خالد العنزي', text: 'خدمة ممتازة ونتائج سريعة، فريق طبي محترف ومتعاون.', rating: 5, date: '2024-02-08' },
      { id: 't3-tumor', name: 'ماجد بن محمد الشمري', text: 'تجربة ممتازة من حيث الجودة والخصوصية، أنصح بزيارة هذا المختبر.', rating: 4, date: '2024-01-25' },
    ],
    relatedDepartments: ['histopathology', 'cytology', 'clinical-chemistry'],
    isPopular: false, order: 18, totalTests: 40, totalPatients: '12,000+', accuracy: '99.5%', experience: '16+ سنة',
  },

  {
    id: 'allergy',
    nameAr: 'الحساسية',
    nameEn: 'Allergy Testing',
    icon: '🤧',
    color: '#F97316',
    gradientFrom: '#F97316',
    gradientTo: '#EA580C',
    descriptionAr: 'قسم فحوصات الحساسية المتخصص في الكشف عن المواد المسببة للحساسية.',
    descriptionEn: 'Specialized allergy testing department for detecting allergens.',
    overviewAr: 'يُعد قسم الحساسية في مختبر المختبر من أكثر الأقسام طلباً في المملكة العربية السعودية، حيث يعاني ما يقارب 30% من السكان من شكل من أشكال الحساسية. يتخصص القسم في الكشف عن الحساسية الغذائية والتنفسية والجلدية والدوائية باستخدام أحدث تقنيات اختبار الجلد والتحاليل الدمائية. يتميز القسم بوجود لوحات حساسية شاملة تشمل أكثر من 200 مسبب للحساسية.',
    heroStats: [
      { value: '200+', label: 'Allergens Tested', labelAr: 'مسبب حساسية يمكن فحصه' },
      { value: '10,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.3%', label: 'Detection Rate', labelAr: 'معدل الكشف' },
      { value: '15+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'allergy-panel-respiratory', nameAr: 'لوحة الحساسية التنفسية', nameEn: 'Respiratory Allergy Panel', price: 250, turnaround: '48-72 ساعة', popular: true },
      { id: 'allergy-panel-food', nameAr: 'لوحة الحساسية الغذائية', nameEn: 'Food Allergy Panel', price: 300, turnaround: '48-72 ساعة', popular: true },
      { id: 'ige-total', nameAr: 'IgE الكلي', nameEn: 'Total IgE', price: 55, turnaround: 'ساعتان', popular: true },
      { id: 'ige-specific', nameAr: 'IgE التخصصي', nameEn: 'Specific IgE', price: 85, turnaround: '48 ساعة', popular: true },
      { id: 'drug-allergy', nameAr: 'فحص حساسية الأدوية', nameEn: 'Drug Allergy Test', price: 150, turnaround: '48-72 ساعة', popular: false },
      { id: 'skin-prick', nameAr: 'اختبار الكشط الجلدي', nameEn: 'Skin Prick Test', price: 200, turnaround: 'فوري', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-sultan-allergy', nameAr: 'د. سلطان بن أحمد الشمري', nameEn: 'Dr. Sultan Al-Shammari',
        titleAr: 'استشاري الحساسية والمناعة', titleEn: 'Consultant Allergist',
        qualifications: ['زمالة أمريكية في الحساسية', 'البورد السعودي', 'ماجستير من جامعة ميشيغان'],
        experience: '18 سنة', specialty: 'الحساسية الغذائية والتنفسية',
      },
      {
        id: 'dr-rania-allergy', nameAr: 'د. رانيا بنت محمد العتيبي', nameEn: 'Dr. Rania Al-Otaibi',
        titleAr: 'أخصائية حساسية', titleEn: 'Allergy Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة مانشستر', 'خبرة في اختبارات الجلد'],
        experience: '12 سنة', specialty: 'حساسية الجلد والأدوية',
      },
    ],
    equipment: [
      { nameAr: 'جهاز قياس IgE', nameEn: 'IgE Analyzer', brand: 'ImmunoCAP 100', description: 'نظام قياس IgE الفرعي الأكثر دقة في العالم' },
      { nameAr: 'جهاز اختبار الحساسية الجلدية', nameEn: 'Skin Test System', brand: 'ALK Test Kit', description: 'مجموعة اختبارات جلدية موحدة للكشف عن الحساسية' },
      { nameAr: 'جهاز قياس المستضدات', nameEn: 'Allergen Analyzer', brand: 'Phadia 100', description: 'نظام قياس IgE التخصصي للمستضدات المحددة' },
    ],
    technology: [
      { name: 'ImmunoCAP Technology', description: 'تقنية ImmunoCAP الأكثر دقة لقياس IgE الفرعي', icon: '🎯' },
      { name: 'Component-Resolved', description: 'تحليل مكونات المستضد لتحديد مسببات الحساسية بدقة', icon: '🧬' },
      { name: 'Skin Testing', description: 'اختبارات جلدية مباشرة للكشف السريع عن الحساسية', icon: '💉' },
    ],
    preparationGuide: [
      'التوقف عن تناول مضادات الهيستامين قبل 5 أيام من اختبار الجلد',
      'لا يحتاج فحص الدم للحساسية لصيام',
      'في اختبار الكشط الجلدي: عدم استخدام كريمات موضعية على الذراع',
      '携带 التاريخ التفصيلي لحالات الحساسية السابقة',
    ],
    expectedTime: { standard: '48-72 ساعة', rush: '24 ساعة', stat: 'فوري (اختبار جلدي)' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع فحوصات الحساسية' },
      { provider: 'التعاونية', coverage: 'تغطية 80%', note: 'للفحوصات الأساسية واللوحيات' },
      { provider: 'مدجلف', coverage: 'تغطية 70%', note: 'لفحوصات الدم فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 85%', note: 'بحد أقصى 600 ريال شهرياً' },
    ],
    faqs: [
      { question: 'ما الفرق بين اختبار الجلد وفحص الدم للحساسية؟', answer: 'اختبار الجلد أسرع ويعطي نتيجة فورية، بينما فحص الدم أكثر أماناً ولا يحتاج للتوقف عن مضادات الهيستامين.' },
      { question: 'هل الحساسية يمكن علاجها نهائياً؟', answer: 'بعض أنواع الحساسية يمكن علاجها بالعلاج التخسيسي، بينما بعضها يمكن السيطرة عليه بالدواء والتجنب.' },
      { question: 'هل يمكنني فحص الحساسية أثناء تناول الأدوية؟', answer: 'بعض الأدوية تؤثر على نتائج اختبار الجلد، لكن فحص الدم لا يتأثر.' },
      { question: 'متى يجب عمل فحص الحساسية؟', answer: 'عند تكرار الأعراض مثل العطس والسعال والحكة، أو عند الشبهة بحساسية غذائية أو دوائية.' },
    ],
    articles: [
      { id: 'allergy-season', title: 'موسم الحساسية: كيف نتعامل معه', excerpt: 'نصائح عملية للتخفيف من أعراض الحساسية الموسمية', date: '2024-03-15', readTime: '5 دقائق', category: 'نصائح صحية' },
      { id: 'food-allergy-guide', title: 'الحساسية الغذائية: دليل شامل', excerpt: 'شرح لأنواع الحساسية الغذائية وطرق تشخيصها', date: '2024-02-10', readTime: '8 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-allergy', name: 'عبدالله بن سعيد العنزي', text: 'فحص الحساسية كان دقيقاً وحدد المادة المسببة بوضوح، خدمة ممتازة.', rating: 5, date: '2024-03-22' },
      { id: 't2-allergy', name: 'مريم بنت خالد الحربي', text: 'تجربة ممتازة مع اختبار الكشط الجلدي، النتائج فورية ودقيقة.', rating: 5, date: '2024-02-18' },
      { id: 't3-allergy', name: 'يوسف بن محمد المطيري', text: 'فريق طبي محترف ومتعاون، أنصح الجميع بعمل فحص الحساسية هنا.', rating: 4, date: '2024-01-28' },
    ],
    relatedDepartments: ['immunology', 'serology'],
    isPopular: true, order: 19, totalTests: 60, totalPatients: '10,000+', accuracy: '99.3%', experience: '15+ سنة',
  },

  {
    id: 'diabetes',
    nameAr: 'السكري',
    nameEn: 'Diabetes',
    icon: '🩸',
    color: '#22C55E',
    gradientFrom: '#22C55E',
    gradientTo: '#16A34A',
    descriptionAr: 'قسم السكري المتخصص في فحوصات السكري الشاملة ومضاعفاته المزمنة.',
    descriptionEn: 'Specialized diabetes department for comprehensive diabetes testing and complication screening.',
    overviewAr: 'يُعد قسم السكري في مختبر المختبر من أكثر الأقسام أهمية في ظل انتشار مرض السكري في المملكة العربية السعودية، حيث نقدم أكثر من 30 اختبار شامل لمرضى السكري. يتخصص القسم في تشخيص أنواع السكري المختلفة ومضاعفاته المزمنة مثل اعتلال الأعصاب والكلى. يتميز القسم بأحدث تقنيات فحص السكري بما في ذلك HbA1c المحسّن وفحص الأنسولين والببتيدات.',
    heroStats: [
      { value: '30+', label: 'Diabetes Tests', labelAr: 'اختبار سكري' },
      { value: '22,000+', label: 'Patients Annually', labelAr: 'مريض سنوياً' },
      { value: '99.7%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '20+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'hba1c-test', nameAr: 'الهيموجلوبين السكري HbA1c', nameEn: 'HbA1c', price: 55, turnaround: '4 ساعات', popular: true },
      { id: 'fasting-glucose', nameAr: 'السكر الصائم', nameEn: 'Fasting Glucose', price: 20, turnaround: 'ساعة واحدة', popular: true },
      { id: 'ogtt', nameAr: 'تحمل الجلوكوز', nameEn: 'OGTT', price: 65, turnaround: 'ساعتان', popular: true },
      { id: 'insulin-fasting', nameAr: 'الأنسولين الصائم', nameEn: 'Fasting Insulin', price: 55, turnaround: 'ساعتان', popular: true },
      { id: 'c-peptide', nameAr: 'الببتيد C', nameEn: 'C-Peptide', price: 85, turnaround: 'ساعتان', popular: false },
      { id: 'microalbumin', nameAr: 'الألبومين الميكروي في البول', nameEn: 'Microalbumin Urine', price: 45, turnaround: '24 ساعة', popular: true },
      { id: 'diabetic-panel', nameAr: 'بروفايل السكري الشامل', nameEn: 'Diabetes Panel', price: 150, turnaround: '24 ساعة', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-ahmad-diab', nameAr: 'د. أحمد بن عبدالله الهاجري', nameEn: 'Dr. Ahmad Al-Hajri',
        titleAr: 'استشاري السكري والتمثيل الغذائي', titleEn: 'Consultant Diabetologist',
        qualifications: ['زمالة أمريكية في السكري', 'البورد السعودي', 'ماجستير من جامعة هارفارد'],
        experience: '24 سنة', specialty: 'السكري النوع الأول والثاني والمضاعفات',
      },
      {
        id: 'dr-samira-diab', nameAr: 'د. سميراء بنت سعد العتيبي', nameEn: 'Dr. Samira Al-Otaibi',
        titleAr: 'أخصائية سكري', titleEn: 'Diabetes Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة تورنتو', 'خبرة في برامج متابعة السكري'],
        experience: '15 سنة', specialty: 'السكري عند الحوامل ومضاعفات السكري',
      },
    ],
    equipment: [
      { nameAr: 'جهاز قياس HbA1c', nameEn: 'HbA1c Analyzer', brand: 'Tosoh G8', description: 'جهاز HPLC عالي الدقة لقياس الهيموجلوبين السكري' },
      { nameAr: 'جهاز قياس السكر المتعدد', nameEn: 'Multi-Analyte Glucose System', brand: 'Roche Cobas 8000', description: 'نظام قياس شامل للسكري والتمثيل الغذائي' },
      { nameAr: 'جهاز فحص أعصاب السكري', nameEn: 'Neuropathy Tester', brand: 'Neurothesiometer', description: 'جهاز قياس حساسية الأعصاب للمضاعفات العصبية' },
    ],
    technology: [
      { name: 'HPLC Method', description: 'طريقة HPLC الأدق في قياس HbA1c عالمياً', icon: '📊' },
      { name: 'CGM Compatible', description: 'توافق مع أجهزة المراقبة المستمرة للغلوكوز', icon: '📱' },
      { name: 'Autoantibody Testing', description: 'فحص الأجسام المضادة للذات لتحديد نوع السكري', icon: '🛡️' },
    ],
    preparationGuide: [
      'في تحليل السكر الصائم: صيام 8-12 ساعة قبل أخذ العينة',
      'في اختبار تحمل الجلوكوز: صيام ليلة كاملة ثم شرب محلول الجلوكوز',
      'في HbA1c: لا يحتاج لصيام ويمكن أخذ العينة في أي وقت',
      'في فحص الألبومين الميكروي: جمع عينة بول الصباح الأولى',
    ],
    expectedTime: { standard: 'ساعة - 24 ساعة', rush: '30 دقيقة', stat: '15 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع فحوصات السكري الشاملة' },
      { provider: 'التعاونية', coverage: 'تغطية 90%', note: 'تشمل HbA1c والفحوصات الأساسية' },
      { provider: 'مدجلف', coverage: 'تغطية 85%', note: 'لفحوصات السكري الروتينية' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية كاملة', note: 'بحد أقصى 800 ريال شهرياً' },
    ],
    faqs: [
      { question: 'ما أفضل اختبار لتشخيص السكري؟', answer: 'HbA1c هو الأفضل لأنه يعكس متوسط السكر خلال 2-3 أشهر، مع السكر الصائم.' },
      { question: 'كم مرة يجب فحص HbA1c لمرضى السكري؟', answer: 'كل 3 أشهر لغير المُعالَجين، وكل 6 أشهر للمُعالَجين جيداً.' },
      { question: 'ما معنى ارتفاع الألبومين الميكروي في البول؟', answer: 'قد يدل على بداية اعتلال الكلى السكري، وهو من المضاعفات المبكرة القابلة للتأخير.' },
      { question: 'هل يمكنني فحص السكري في المنزل؟', answer: 'جهاز قياس السكر المنزلي موثوق، لكن فحص HbA1c يحتاج للمختبر.' },
    ],
    articles: [
      { id: 'diabetes-prevention', title: 'الوقاية من السكري النوع الثاني', excerpt: 'نصائح عملية للوقاية من السكري والتحكم في مستويات السكر', date: '2024-03-01', readTime: '7 دقائق', category: 'نصائح صحية' },
      { id: 'diabetes-complications', title: 'مضاعفات السكري: كيف نتجنبها', excerpt: 'شرح لأهم مضاعفات السكري وطرق الوقاية منها', date: '2024-02-12', readTime: '8 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-diab', name: 'خالد بن عبدالرحمن الشمري', text: 'بروفايل السكري الشامل كان ممتازاً وساعد في تعديل خطة العلاج.', rating: 5, date: '2024-03-15' },
      { id: 't2-diab', name: 'فاطمة بنت محمد العنزي', text: 'خدمة ممتازة ونتائج دقيقة، فريق طبي متخصص في السكري.', rating: 5, date: '2024-02-20' },
      { id: 't3-diab', name: 'سلطان بن ناصر الحربي', text: 'تجربة ممتازة، أنصح مرضى السكري بزيارة هذا المختبر.', rating: 4, date: '2024-01-18' },
    ],
    relatedDepartments: ['clinical-chemistry', 'endocrinology', 'kidney-function'],
    isPopular: true, order: 20, totalTests: 30, totalPatients: '22,000+', accuracy: '99.7%', experience: '20+ سنة',
  },

  {
    id: 'liver-function',
    nameAr: 'وظائف الكبد',
    nameEn: 'Liver Function',
    icon: '🫘',
    color: '#EAB308',
    gradientFrom: '#EAB308',
    gradientTo: '#CA8A04',
    descriptionAr: 'قسم وظائف الكبد المتخصص في فحص صحة الكبد وقدرته على أداء وظائفه.',
    descriptionEn: 'Specialized liver function department for examining liver health.',
    overviewAr: 'يُعد قسم وظائف الكبد في مختبر المختبر من أكثر الأقسام أهمية في تشخيص أمراض الكبد المختلفة، حيث نقدم فحوصات شاملة تشمل إنزيمات الكبد والبروتينات والبيلي рубين والدهون. يتخصص القسم في تشخيص التهاب الكبد الوبائي والتهاب الكبد غير الوبائي والتشمع وأورام الكبد. يتميز القسم بأحدث تقنيات قياس إنزيمات الكبد التي تكشف عن التلف الكبدي مبكراً.',
    heroStats: [
      { value: '25+', label: 'Liver Tests', labelAr: 'فحص كبدي' },
      { value: '18,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.6%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '19+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'liver-panel', nameAr: 'بروفايل وظائف الكبد الكامل', nameEn: 'Complete Liver Panel', price: 85, turnaround: 'ساعتان', popular: true },
      { id: 'alt-ast', nameAr: 'ALT & AST', nameEn: 'ALT & AST', price: 45, turnaround: 'ساعتان', popular: true },
      { id: 'bilirubin', nameAr: 'البيلي рубين الكلي والغير مباشر', nameEn: 'Bilirubin Total/Direct', price: 50, turnaround: 'ساعتان', popular: true },
      { id: 'albumin-liver', nameAr: 'الألبومين', nameEn: 'Albumin', price: 35, turnaround: 'ساعتان', popular: true },
      { id: 'ggt', nameAr: 'GGT', nameEn: 'Gamma GT', price: 35, turnaround: 'ساعتان', popular: true },
      { id: 'prothrombin', nameAr: 'زمن البروثرومبين', nameEn: 'PT/INR', price: 55, turnaround: 'ساعتان', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-saeed-liver', nameAr: 'د. سعيد بن فهد الدوسري', nameEn: 'Dr. Saeed Al-Dosari',
        titleAr: 'استشاري أمراض الكبد', titleEn: 'Consultant Hepatologist',
        qualifications: ['زمالة أمريكية في أمراض الكبد', 'البورد السعودي', 'ماجستير من جامعة ييل'],
        experience: '22 سنة', specialty: 'أمراض الكبد الوبائية وغير الوبائية',
      },
      {
        id: 'dr-leena-liver', nameAr: 'د. ليلى بنت سلطان العتيبي', nameEn: 'Dr. Leena Al-Otaibi',
        titleAr: 'أخصائية وظائف الكبد', titleEn: 'Liver Function Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة ميونخ', 'خبرة في مراكز زراعة الكبد'],
        experience: '14 سنة', specialty: 'تشخيص أمراض الكبد والتشمع',
      },
    ],
    equipment: [
      { nameAr: 'جهاز تحليل وظائف الكبد', nameEn: 'Liver Analyzer', brand: 'Roche Cobas c702', description: 'نظام تحليل كيميائي عالي الأداء لإنزيمات الكبد' },
      { nameAr: 'جهاز قياس البيلي рубين', nameEn: 'Bilirubin Meter', brand: 'Bilirubinometer B-100', description: 'جهاز متخصص لقياس البيلي рубين بدقة عالية' },
      { nameAr: 'جهاز فحص التخثر', nameEn: 'Coagulation Analyzer', brand: 'Stago STAR Max', description: 'نظام فحص التخثر لتقييم وظائف الكبد' },
    ],
    technology: [
      { name: 'Enzymatic Assays', description: 'تحليلات إنزيمية عالية الدقة لإنزيمات الكبد', icon: '⚗️' },
      { name: 'Fibrosis Markers', description: 'ماركرات تليّف الكبد للكشف المبكر عن التلف', icon: '📊' },
      { name: 'Viral Hepatitis', description: 'فحص شامل لفيروسات الكبد الوبائية', icon: '🦠' },
    ],
    preparationGuide: [
      'صيام 10-12 ساعة قبل فحص وظائف الكبد الشامل',
      'تجنب تناول الكحول قبل التحليل بيومين على الأقل',
      'تجنب الأدوية التي تؤثر على الكبد إذا أمكن',
      'إبلاغ المختبر بجميع الأدوية والمكملات التي تتناولها',
    ],
    expectedTime: { standard: 'ساعتان', rush: '30 دقيقة', stat: '15 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع فحوصات وظائف الكبد' },
      { provider: 'التعاونية', coverage: 'تغطية 85%', note: 'للفحوصات الأساسية والشاملة' },
      { provider: 'مدجلف', coverage: 'تغطية 80%', note: 'لفحوصات الإنزيمات الأساسية' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 90%', note: 'بحد أقصى 500 ريال شهرياً' },
    ],
    faqs: [
      { question: 'ماذا يعني ارتفاع ALT وAST؟', answer: 'ارتفاعهما قد يدل على التهاب أو تلف في خلايا الكبد، ويعتمد التفسير على درجة الارتفاع والمرض المرافق.' },
      { question: 'هل وظائف الكبد تحتاج صيام؟', answer: 'نعم، يُنصح بالصيام 10-12 ساعة للحصول على نتائج دقيقة خاصة للدهون والإنزيمات.' },
      { question: 'ماذا يعني ارتفاع البيلي рубين؟', answer: 'قد يدل على أمراض الكبد أو انساب القنوات الصفراوية أو تدمير خلايا الدم الحمراء.' },
      { question: 'كم مرة يجب فحص وظائف الكبد؟', answer: 'يُنصح بالفحص السنوي للأصحاء، وكل 3-6 أشهر لمرضى الكبد المزمن.' },
    ],
    articles: [
      { id: 'fatty-liver', title: 'الكبد الدهني: أسبابه وعلاجه', excerpt: 'شرح شامل لأسباب الكبد الدهني وطرق الوقاية والعلاج', date: '2024-03-10', readTime: '7 دقائق', category: 'مقالات طبية' },
      { id: 'hepatitis-guide', title: 'فيروسات الكبد: دليل شامل', excerpt: 'شرح لأنواع فيروسات الكبد وطرق انتقالها والوقاية منها', date: '2024-02-15', readTime: '8 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-liver', name: 'عبدالرحمن بن خالد الدوسري', text: 'تحاليل وظائف الكبد كانت دقيقة وشاملة، ساعدت في التشخيص المبكر.', rating: 5, date: '2024-03-12' },
      { id: 't2-liver', name: 'هدى بنت سعيد العنزي', text: 'خدمة ممتازة ونتائج سريعة، فريق طبي متخصص ومتعاون.', rating: 5, date: '2024-02-22' },
      { id: 't3-liver', name: 'ماجد بن محمد الشمري', text: 'تجربة جيدة جداً من حيث الجودة والسرعة، أنصح بزيارة هذا المختبر.', rating: 4, date: '2024-01-20' },
    ],
    relatedDepartments: ['clinical-chemistry', 'serology', 'stool-analysis'],
    isPopular: true, order: 21, totalTests: 25, totalPatients: '18,000+', accuracy: '99.6%', experience: '19+ سنة',
  },

  {
    id: 'kidney-function',
    nameAr: 'وظائف الكلى',
    nameEn: 'Kidney Function',
    icon: '🫘',
    color: '#14B8A6',
    gradientFrom: '#14B8A6',
    gradientTo: '#0D9488',
    descriptionAr: 'قسم وظائف الكلى المتخصص في فحص صحة الكلى وقدرتها على تنقية الدم.',
    descriptionEn: 'Specialized kidney function department for examining kidney health and blood filtration.',
    overviewAr: 'يُعد قسم وظائف الكلى في مختبر المختبر من الأقسام الحيوية في تشخيص أمراض الكلى المختلفة، حيث نقدم فحوصات شاملة تشمل الكرياتينين واليوريا والحمض البوليكي والبروتينات. يتخصص القسم في تشخيص قصور الكلى الحاد والمزمن والتهابات الكلى وأحجار الكلى والاعتلال الكلوي السكري. يتميز القسم بأحدث تقنيات قياس وظائف الكلى العالية الدقة التي تكشف عن تدهور وظائف الكلى في مراحله المبكرة.',
    heroStats: [
      { value: '20+', label: 'Kidney Tests', labelAr: 'فحص كلوي' },
      { value: '16,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.7%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '18+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'creatinine', nameAr: 'الكرياتينين', nameEn: 'Creatinine', price: 30, turnaround: 'ساعتان', popular: true },
      { id: 'bun', nameAr: 'النيتروجين اليوري في الدم', nameEn: 'Blood Urea Nitrogen (BUN)', price: 30, turnaround: 'ساعتان', popular: true },
      { id: 'egfr', nameAr: 'معدل الترشيح الكلوي المقدر', nameEn: 'eGFR', price: 45, turnaround: 'ساعتان', popular: true },
      { id: 'uric-acid-kidney', nameAr: 'حمض البوليك', nameEn: 'Uric Acid', price: 30, turnaround: 'ساعتان', popular: true },
      { id: 'cystatin-c', nameAr: 'السيستاتين C', nameEn: 'Cystatin C', price: 85, turnaround: '24 ساعة', popular: false },
      { id: 'kidney-panel', nameAr: 'بروفايل وظائف الكلى الشامل', nameEn: 'Renal Panel', price: 95, turnaround: 'ساعتان', popular: true },
    ],
    medicalTeam: [
      {
        id: 'dr-ali-kidney', nameAr: 'د. علي بن سعيد المطيري', nameEn: 'Dr. Ali Al-Mutairi',
        titleAr: 'استشاري أمراض الكلى', titleEn: 'Consultant Nephrologist',
        qualifications: ['زمالة أمريكية في أمراض الكلى', 'البورد السعودي', 'ماجستير من جامعة ميشيغان'],
        experience: '20 سنة', specialty: 'قصور الكلى والاعتلال الكلوي',
      },
      {
        id: 'dr-nora-kidney', nameAr: 'د. نورة بنت فهد الحربي', nameEn: 'Dr. Nora Al-Harbi',
        titleAr: 'أخصائية وظائف الكلى', titleEn: 'Kidney Function Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة أديلايد', 'خبرة في مراكز غسيل الكلى'],
        experience: '13 سنة', specialty: 'وظائف الكلى والاعتلال الكلوي السكري',
      },
    ],
    equipment: [
      { nameAr: 'جهاز تحليل وظائف الكلى', nameEn: 'Kidney Function Analyzer', brand: 'Roche Cobas c702', description: 'نظام تحليل كيميائي عالي الأداء لإنزيمات وبروتينات الكلى' },
      { nameAr: 'جهاز قياس السيستاتين', nameEn: 'Cystatin C Analyzer', brand: 'Siemens ADVIA Chemistry', description: 'جهاز متخصص لقياس السيستاتين C بدقة عالية' },
      { nameAr: 'جهاز التحليل البولي الشامل', nameEn: 'Urinalysis System', brand: 'Sysmex UF-5000', description: 'نظام تحليل بولي شامل يشمل الفحص الكيميائي والميكروسكوبي' },
    ],
    technology: [
      { name: 'eGFR Calculation', description: 'حساب معدل الترشيح الكلوي المقدر بدقة عالية', icon: '📊' },
      { name: 'Cystatin C Method', description: 'طريقة السيستاتين C الأكثر دقة لتقييم وظائف الكلى', icon: '🎯' },
      { name: 'Microalbumin Testing', description: 'فحص الألبومين الميكروي للكشف المبكر عن اعتلال الكلى', icon: '🔬' },
    ],
    preparationGuide: [
      'صيام 8-12 ساعة قبل تحليل وظائف الكلى الشامل',
      'شرب كمية كافية من الماء قبل جمع العينة',
      'تجنب تناول اللحوم الحمراء بكميات كبيرة قبل التحليل',
      'تجنب المكملات الغذائية التي تحتوي على كreatinine قبل الفحص',
    ],
    expectedTime: { standard: 'ساعتان', rush: '30 دقيقة', stat: '15 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع فحوصات وظائف الكلى' },
      { provider: 'التعاونية', coverage: 'تغطية 85%', note: 'للفحوصات الأساسية والشاملة' },
      { provider: 'مدجلف', coverage: 'تغطية 80%', note: 'لفحوصات الكرياتينين واليوريا فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 90%', note: 'بحد أقصى 500 ريال شهرياً' },
    ],
    faqs: [
      { question: 'ماذا يعني ارتفاع الكرياتينين؟', answer: 'قد يدل على تدهور وظائف الكلى أو جفاف شديد أو تناول أدوية تؤثر على الكلى.' },
      { question: 'هل وظائف الكلى تحتاج صيام؟', answer: 'يُنصح بالصيام 8-12 ساعة للحصول على نتائج دقيقة، خاصة مع فحص اليوريا وحمض البوليك.' },
      { question: 'ما هو eGFR؟', answer: 'معدل الترشيح الكلوي المقدر يقي قدرة الكلى على ترشيح الدم ويُحسب من الكرياتينين والعمر والجنس.' },
      { question: 'كم مرة يجب فحص وظائف الكلى؟', answer: 'للأصحاء سنوياً، ولمرضى السكري وارتفاع ضغط الدم كل 3-6 أشهر.' },
    ],
    articles: [
      { id: 'kidney-health', title: 'صحة الكلى: دليل شامل للوقاية', excerpt: 'نصائح مهمة للحفاظ على صحة الكلى وتجنب أمراض الكلى', date: '2024-03-05', readTime: '6 دقائق', category: 'نصائح صحية' },
      { id: 'chronic-kidney', title: 'قصور الكلى المزمن: التشخيص والعلاج', excerpt: 'شرح لأسباب ومضاعفات قصور الكلى المزمن وطرق العلاج', date: '2024-02-18', readTime: '7 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-kidney', name: 'عبدالله بن سعيد الشمري', text: 'تحاليل وظائف الكلى كانت دقيقة وشاملة، ساعدت في الكشف المبكر.', rating: 5, date: '2024-03-18' },
      { id: 't2-kidney', name: 'سميرة بنت خالد العنزي', text: 'خدمة ممتازة ونتائج سريعة، فريق طبي متخصص ومتعاون.', rating: 5, date: '2024-02-15' },
      { id: 't3-kidney', name: 'ياسر بن عبدالرحمن الحربي', text: 'تجربة جيدة جداً، الأسعار معقولة والجودة عالية.', rating: 4, date: '2024-01-25' },
    ],
    relatedDepartments: ['diabetes', 'clinical-chemistry', 'urinalysis'],
    isPopular: true, order: 22, totalTests: 20, totalPatients: '16,000+', accuracy: '99.7%', experience: '18+ سنة',
  },

  {
    id: 'cardiac-markers',
    nameAr: 'ماركرات القلب',
    nameEn: 'Cardiac Markers',
    icon: '❤️',
    color: '#DC2626',
    gradientFrom: '#DC2626',
    gradientTo: '#991B1B',
    descriptionAr: 'قسم ماركرات القلب المتخصص في فحوصات الطوارئ القلبية والكشف المبكر عن نوبات القلب.',
    descriptionEn: 'Specialized cardiac markers department for emergency cardiac testing and early heart attack detection.',
    overviewAr: 'يُعد قسم ماركرات القلب في مختبر المختبر من الأقسام الحرجة التي تعمل على مدار الساعة لخدمة حالات الطوارئ القلبية، حيث نقدم فحوصات سريعة ودقيقة تساعد في الكشف المبكر عن نوبات القلب واحتشاء عضلة القلب. يتميز القسم بأحدث تقنيات قياس ماركرات القلب مثل التروпонين والـ CK-MB والـ BNP التي تكشف عن تلف عضلة القلب خلال ساعات قليلة من بداية النوبة. نقدم أيضاً فحوصات شاملة لتقييم مخاطر أمراض القلب والأوعية الدموية.',
    heroStats: [
      { value: '15+', label: 'Cardiac Tests', labelAr: 'فحص قلبي' },
      { value: '5,000+', label: 'Emergency Tests', labelAr: 'فحص طوارئ شهرياً' },
      { value: '99.9%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '16+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'troponin', nameAr: 'التروبونين I أو T', nameEn: 'Troponin I/T', price: 95, turnaround: '30 دقيقة', popular: true },
      { id: 'ck-mb', nameAr: 'CK-MB', nameEn: 'CK-MB', price: 65, turnaround: 'ساعة واحدة', popular: true },
      { id: 'bnp', nameAr: 'الببتيد الدماغي BNP', nameEn: 'BNP / NT-proBNP', price: 110, turnaround: 'ساعة واحدة', popular: true },
      { id: 'myoglobin', nameAr: 'الميوغلوبين', nameEn: 'Myoglobin', price: 75, turnaround: '30 دقيقة', popular: false },
      { id: 'cardiac-panel', nameAr: 'بروفايل القلب الشامل', nameEn: 'Cardiac Panel', price: 200, turnaround: 'ساعة واحدة', popular: true },
      { id: 'homocysteine', nameAr: 'الهوموسيستين', nameEn: 'Homocysteine', price: 85, turnaround: 'ساعتان', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-fahad-cardiac', nameAr: 'د. فهد بن عبدالله السبيعي', nameEn: 'Dr. Fahad Al-Subaie',
        titleAr: 'استشاري марكرات القلب', titleEn: 'Consultant Cardiac Marker Specialist',
        qualifications: ['زمالة أمريكية في الكيمياء السريرية', 'البورد السعودي', 'خبرة في أقسام الطوارئ الكبرى'],
        experience: '17 سنة', specialty: 'ماركرات القلب وحالات الطوارئ',
      },
      {
        id: 'dr-reem-cardiac', nameAr: 'د. ريم بنت سلطان العنزي', nameEn: 'Dr. Reem Al-Anzi',
        titleAr: 'أخصائية ماركرات قلبية', titleEn: 'Cardiac Marker Specialist',
        qualifications: ['البورد السعودي', 'ماجستير من جامعة مانشستر', 'خبرة في وحدات العناية القلبية'],
        experience: '12 سنة', specialty: '.marakerات القلب الخاطئة والتشخيص المبكر',
      },
    ],
    equipment: [
      { nameAr: 'جهاز قياس التروبونين السريع', nameEn: 'Rapid Troponin Analyzer', brand: 'Abbott i-STAT', description: 'جهاز قياس سريع للتروبونين يعطي نتيجة خلال 10 دقائق' },
      { nameAr: 'جهاز قياس BNP', nameEn: 'BNP Analyzer', brand: 'Abbott ARCHITECT', description: 'نظام قياس BNP و NT-proBNP عالي الحساسية' },
      { nameAr: 'جهاز CK-MB السريع', nameEn: 'CK-MB Analyzer', brand: 'Siemens RAPIDPoint', description: 'جهاز قياس سريع لـ CK-MB في حالات الطوارئ' },
    ],
    technology: [
      { name: 'High-Sensitivity Troponin', description: 'قياس التروبونين عالي الحساسية للكشف المبكر عن احتشاء القلب', icon: '🎯' },
      { name: 'Point-of-Care Testing', description: 'فحوصات في موقع الرعاية لنتائج فورية في الطوارئ', icon: '⚡' },
      { name: 'Rapid Turnaround', description: 'نتائج خلال 10-30 دقيقة لحالات الطوارئ الحرجة', icon: '⏱️' },
    ],
    preparationGuide: [
      'في حالات الطوارئ: لا يحتاج لصيام ويعمل على مدار الساعة',
      'في الفحوصات الروتينية: صيام 8-12 ساعة قبل التحليل',
      'تجنب الرياضة القوية قبل فحص marakerات القلب',
      'إبلاغ المختبر فوراً بأي أعراض قلبية مثل ألم الصدر أو ضيق التنفس',
    ],
    expectedTime: { standard: 'ساعة واحدة', rush: '10 دقائق', stat: '5 دقائق' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع فحوصات الطوارئ القلبية' },
      { provider: 'التعاونية', coverage: 'تغطية 90%', note: 'لحالات الطوارئ القلبية' },
      { provider: 'مدجلف', coverage: 'تغطية 85%', note: 'لفحوصات marakerات القلب الأساسية' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية كاملة', note: 'لحالات الطوارئ القلبية الحرجة' },
    ],
    faqs: [
      { question: 'ماذا يعني ارتفاع التروبونين؟', answer: 'ارتفاع التروبونين قد يدل على تلف في عضلة القلب مثل احتشاء القلب، ويجب تفسيره مع الأعراض السريرية.' },
      { question: 'ما هو BNP ولماذا يُقاس؟', answer: 'BNP يُفرز من القلب عند وجود ضغط عليه، ويُستخدم لتشخيص قصور القلب وتقييم شدته.' },
      { question: 'هل فحوصات القلب تحتاج صيام؟', answer: 'حالات الطوارئ لا تحتاج صيام، أما الفحوصات الروتينية فيُفضل الصيام 8-12 ساعة.' },
      { question: 'كم من الوقت تستغرق نتيجة marakerات القلب؟', answer: 'في حالات الطوارئ النتائج جاهزة خلال 10-30 دقيقة، والفحوصات الروتينية خلال ساعة.' },
    ],
    articles: [
      { id: 'heart-attack-signs', title: 'علامات نوبة القلب: كيف نكتشفها مبكراً', excerpt: 'شرح لأهم العلامات والأعراض التي تستدعي التدخل الطبي العاجل', date: '2024-03-12', readTime: '5 دقائق', category: 'إسعافات أولية' },
      { id: 'cardiac-risk-factors', title: 'عوامل خطر أمراض القلب', excerpt: 'شرح لأهم عوامل الخطر وكيفية تخفيفها للوقاية من أمراض القلب', date: '2024-02-08', readTime: '6 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-cardiac', name: 'خالد بن سعيد المالكي', text: 'خدمة طوارئ سريعة ودقيقة، نتائج التروبونين جاهزة في 10 دقائق فقط.', rating: 5, date: '2024-03-20' },
      { id: 't2-cardiac', name: 'منال بنت عبدالرحمن الحربي', text: 'فريق طبي محترف ومتعاون، حياة المريض في أمان مع هذا المختبر.', rating: 5, date: '2024-02-25' },
      { id: 't3-cardiac', name: 'عبدالعزيز بن محمد العتيبي', text: 'تجربة ممتازة في فحوصات القلب، سرعة ودقة في النتائج.', rating: 4, date: '2024-01-15' },
    ],
    relatedDepartments: ['clinical-chemistry', 'diabetes', 'vitamins'],
    isPopular: true, order: 23, totalTests: 15, totalPatients: '5,000+', accuracy: '99.9%', experience: '16+ سنة',
  },

  {
    id: 'vitamins',
    nameAr: 'الفيتامينات',
    nameEn: 'Vitamins & Minerals',
    icon: '💊',
    color: '#FBBF24',
    gradientFrom: '#FBBF24',
    gradientTo: '#F59E0B',
    descriptionAr: 'قسم الفيتامينات والمعادن المتخصص في قياس مستويات الفيتامينات والمعادن في الجسم.',
    descriptionEn: 'Specialized vitamins and minerals department for measuring vitamin and mineral levels.',
    overviewAr: 'يُعد قسم الفيتامينات والمعادن في مختبر المختبر من أكثر الأقسام أهمية في ظل انتشار نقص الفيتامينات والمعادن في المجتمع السعودي، حيث نقدم أكثر من 25 اختبار شامل للفيتامينات والمعادن الأساسية. يتخصص القسم في قياس فيتامين D وفيتامين B12 والحديد والكالسيوم والمغنيسيوم والزنك. يتميز القسم بأحدث تقنيات القياس العالية الدقة التي تكشف عن النقص والإفراط في الفيتامينات والمعادن بدقة فائقة.',
    heroStats: [
      { value: '25+', label: 'Vitamin Tests', labelAr: 'اختبار فيتامينات' },
      { value: '20,000+', label: 'Tests Monthly', labelAr: 'اختبار شهرياً' },
      { value: '99.5%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '14+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'vitamin-d', nameAr: 'فيتامين D', nameEn: 'Vitamin D (25-OH)', price: 75, turnaround: '24 ساعة', popular: true },
      { id: 'vitamin-b12', nameAr: 'فيتامين B12', nameEn: 'Vitamin B12', price: 65, turnaround: 'ساعتان', popular: true },
      { id: 'folate', nameAr: 'الفولات', nameEn: 'Folate', price: 65, turnaround: 'ساعتان', popular: true },
      { id: 'iron-panel', nameAr: 'بروفايل الحديد', nameEn: 'Iron Panel (Iron, TIBC, Ferritin)', price: 85, turnaround: 'ساعتان', popular: true },
      { id: 'calcium-vitamins', nameAr: 'الكالسيوم والكالسيوم المnesyon', nameEn: 'Calcium & Ionized Calcium', price: 55, turnaround: 'ساعتان', popular: false },
      { id: 'magnesium', nameAr: 'المغنيسيوم', nameEn: 'Magnesium', price: 45, turnaround: 'ساعتان', popular: false },
      { id: 'zinc', nameAr: 'الزنك', nameEn: 'Zinc', price: 55, turnaround: '24 ساعة', popular: false },
      { id: 'vitamin-a', nameAr: 'فيتامين A', nameEn: 'Vitamin A', price: 90, turnaround: '48 ساعة', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-ammar-vit', nameAr: 'د. عمار بن خالد الهاجري', nameEn: 'Dr. Ammar Al-Hajri',
        titleAr: 'استشاري الفيتامينات والتمثيل الغذائي', titleEn: 'Consultant Vitamin Specialist',
        qualifications: ['زمالة في التغذية السريرية من Harvard', 'البورد السعودي', 'ماجستير في التغذية البشرية'],
        experience: '16 سنة', specialty: 'نقص الفيتامينات والمعادن وتأثيرها على الصحة',
      },
      {
        id: 'dr-huda-vit', nameAr: 'د. هدى بنت سعيد المطيري', nameEn: 'Dr. Huda Al-Mutairi',
        titleAr: 'أخصائية فيتامينات ومعادن', titleEn: 'Vitamin & Mineral Specialist',
        qualifications: ['البورد السعودي', 'ماجستير في الكيمياء السريرية من جامعة أديلايد', 'خبرة في التغذية السريرية'],
        experience: '11 سنة', specialty: 'تحليل الفيتامينات والمعادن والتعويض المناسب',
      },
    ],
    equipment: [
      { nameAr: 'جهاز قياس فيتامين D', nameEn: 'Vitamin D Analyzer', brand: 'Roche Cobas e801', description: 'نظام قياس فيتامين D 25-OH العالي الحساسية' },
      { nameAr: 'جهاز قياس الحديد', nameEn: 'Iron Analyzer', brand: 'Beckman Coulter AU5800', description: 'نظام قياس شامل لبروفايل الحديد والحديد الكلية' },
      { nameAr: 'جهاز قياس فيتامين B12', nameEn: 'B12 Analyzer', brand: 'Abbott ARCHITECT', description: 'نظام قياس فيتامين B12 عالي الدقة' },
    ],
    technology: [
      { name: 'Electrochemiluminescence', description: 'قياس عالي الحساسية لفيتامينات والمعادن بالكيمياء المضيئة', icon: '✨' },
      { name: 'Mass Spectrometry', description: 'قياس كتلة عالي الدقة لبعض الفيتامينات النادرة', icon: '📊' },
      { name: 'Competitive Immunoassay', description: 'تحليل تنافسي عالي الدقة للقياس الدقيق', icon: '🎯' },
    ],
    preparationGuide: [
      'في تحليل فيتامين D: لا يحتاج لصيام لكن يُفضل أخذ العينة صباحاً',
      'في تحليل الحديد: صيام 12 ساعة للحصول على نتائج دقيقة',
      'تجنب تناول المكملات الغذائية قبل التحليل بيوم على الأقل',
      'في تحليل الكالسيوم: تجنب تناول مكملات الكالسيوم قبل التحليل بيومين',
    ],
    expectedTime: { standard: 'ساعتان - 48 ساعة', rush: 'ساعة واحدة', stat: '30 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية كاملة', note: 'جميع فحوصات الفيتامينات والمعادن' },
      { provider: 'التعاونية', coverage: 'تغطية 75%', note: 'لفحوصات فيتامين D و B12 والحديد فقط' },
      { provider: 'مدجلف', coverage: 'تغطية 70%', note: 'لفحوصات الحديد والكالسيوم فقط' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 80%', note: 'بحد أقصى 400 ريال شهرياً' },
    ],
    faqs: [
      { question: 'ما أهمية قياس فيتامين D؟', answer: 'نقص فيتامين D شائع جداً في السعودية ويرتبط بمشاكل العظام والمناعة والقلب.' },
      { question: 'هل يجب الصيام لتحليل الحديد؟', answer: 'نعم، يُفضل الصيام 12 ساعة لتحليل الحديد لأن الأطعمة تؤثر على مستويات الحديد في الدم.' },
      { question: 'ما أعراض نقص فيتامين B12؟', answer: 'الإرهاق والدوار وتنميل اليدين والقدمين ومشاكل في الذاكرة والتركيز.' },
      { question: 'كم مرة يجب فحص الفيتامينات؟', answer: 'للأصحاء كل 6-12 شهر، وللحوامل ومرضى السكري والكلى كل 3-6 أشهر.' },
    ],
    articles: [
      { id: 'vitamin-d-ksa', title: 'نقص فيتامين D في السعودية', excerpt: 'شرح لأسباب انتشار نقص فيتامين D وكيفية العلاج والوقاية', date: '2024-03-08', readTime: '6 دقائق', category: 'مقالات طبية' },
      { id: 'iron-deficiency', title: 'فقر الدم الناتب عن نقص الحديد', excerpt: 'شرح لأسباب نقص الحديد وأعراضه وطرق العلاج والوقاية', date: '2024-02-20', readTime: '5 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-vit', name: 'سحر بنت عبدالله العنزي', text: 'تحليل فيتامين D كان دقيقاً وساعد الطبيب في تحديد الجرعة المناسبة.', rating: 5, date: '2024-03-15' },
      { id: 't2-vit', name: 'محمد بن سعد الشمري', text: 'خدمة ممتازة ونتائج سريعة، فريق طبي متخصص في الفيتامينات.', rating: 5, date: '2024-02-28' },
      { id: 't3-vit', name: 'نورة بنت أحمد الحربي', text: 'تجربة ممتازة من حيث الجودة والسرعة، أنصح بعمل فحص فيتامينات شامل.', rating: 4, date: '2024-01-22' },
    ],
    relatedDepartments: ['endocrinology', 'hematology', 'clinical-chemistry'],
    isPopular: true, order: 24, totalTests: 25, totalPatients: '20,000+', accuracy: '99.5%', experience: '14+ سنة',
  },

  {
    id: 'fertility',
    nameAr: 'الخصوبة',
    nameEn: 'Fertility',
    icon: '👶',
    color: '#DB2777',
    gradientFrom: '#DB2777',
    gradientTo: '#BE185D',
    descriptionAr: 'قسم الخصوبة المتخصص في تحاليل الخصوبة الشاملة للرجال والنساء وbefore-IVF testing.',
    descriptionEn: 'Specialized fertility department for comprehensive fertility testing and pre-IVF evaluation.',
    overviewAr: 'يُعد قسم الخصوبة في مختبر المختبر من أكثر الأقسام تخصصاً ودقةً، حيث نقدم مجموعة شاملة من تحاليل الخصوبة للرجال والنساء تشمل الهرمونات التناسلية وتحليل السائل المنوي وفحص جودة البويضة والتحاليل الوراثية المرتبطة بالخصوبة. يتميز القسم بخبرته في دعم الأزواج الذين يخططون للحمل وتقديم اختبارات before-IVF الشاملة التي تساعد في تحديد أسباب عقم الزوجين. يضم القسم فريقاً من المتخصصين في الخصوبة والوراثة ذوي خبرة واسعة في دعم الرحلات التناسلية.',
    heroStats: [
      { value: '40+', label: 'Fertility Tests', labelAr: 'فحص خصوبة' },
      { value: '6,000+', label: 'Patients Annually', labelAr: 'مريض سنوياً' },
      { value: '99.5%', label: 'Accuracy Rate', labelAr: 'معدل الدقة' },
      { value: '16+', label: 'Years Experience', labelAr: 'سنوات خبرة' },
    ],
    tests: [
      { id: 'sperm-analysis', nameAr: 'تحليل السائل المنوي', nameEn: 'Semen Analysis', price: 120, turnaround: '2-4 ساعات', popular: true },
      { id: 'hormone-panel-female', nameAr: 'بروفايل هرمونات الخصوبة النسائية', nameEn: 'Female Fertility Hormone Panel', price: 200, turnaround: '24 ساعة', popular: true },
      { id: 'amh', nameAr: 'هرمون AMH', nameEn: 'Anti-Müllerian Hormone (AMH)', price: 150, turnaround: '24 ساعة', popular: true },
      { id: 'fshe-lh', nameAr: 'FSH & LH', nameEn: 'FSH & LH', price: 85, turnaround: 'ساعتان', popular: true },
      { id: 'prolactin-fertility', nameAr: 'البرولاكتين للخصوبة', nameEn: 'Prolactin (Fertility)', price: 60, turnaround: 'ساعتان', popular: false },
      { id: 'thyroid-fertility', nameAr: 'الهرمونات الدرقية للخصوبة', nameEn: 'Thyroid Panel for Fertility', price: 85, turnaround: 'ساعتان', popular: true },
      { id: 'fertility-genetic', nameAr: 'التحاليل الوراثية للخصوبة', nameEn: 'Genetic Fertility Testing', price: 500, turnaround: '7-14 يوم', popular: false },
    ],
    medicalTeam: [
      {
        id: 'dr-nasser-fert', nameAr: 'د. ناصر بن سعيد العتيبي', nameEn: 'Dr. Nasser Al-Otaibi',
        titleAr: 'استشاري الخصوبة', titleEn: 'Consultant Fertility Specialist',
        qualifications: ['زمالة أمريكية في أبحاث الخصوبة', 'البورد السعودي', 'ماجستير في Endocrinology من جامعة كورنيل'],
        experience: '19 سنة', specialty: 'تحليلات الخصوبة وbefore-IVF',
      },
      {
        id: 'dr-nouf-fert', nameAr: 'د. نوف بنت خالد الشمري', nameEn: 'Dr. Nouf Al-Shammari',
        titleAr: 'أخصائية خصوبة', titleEn: 'Fertility Specialist',
        qualifications: ['البورد السعودي', 'ماجستير في أبحاث الخصوبة من جامعة أديلايد', 'خبرة في مراكز الخصوبة الكبرى'],
        experience: '13 سنة', specialty: 'هرمونات الخصوبة النسائية وتحاليل السائل المنوي',
      },
    ],
    equipment: [
      { nameAr: 'جهاز تحليل السائل المنوي', nameEn: 'Semen Analyzer', brand: 'Hamilton Thorne IVOS II', description: 'نظام تحليل آلي عالي الدقة للسائل المنوي مع تحليل الحركة والأشكال' },
      { nameAr: 'جهاز قياس AMH', nameEn: 'AMH Analyzer', brand: 'Roche Cobas e801', description: 'نظام قياس AMH عالي الحساسية لتقييم مخزون البويضات' },
      { nameAr: 'جهاز قياس هرمونات الخصوبة', nameEn: 'Fertility Hormone Analyzer', brand: 'Abbott ARCHITECT', description: 'نظام شامل لقياس جميع هرمونات الخصوبة بدقة عالية' },
    ],
    technology: [
      { name: 'Computer-Aided Sperm Analysis', description: 'تحليل السائل المنوي بمساعدة الحاسوب لدقة أعلى', icon: '💻' },
      { name: 'AMH Testing', description: 'قياس AMH لتقييم مخزون البويضات والتنبؤ بالاستجابة التناسلية', icon: '🎯' },
      { name: 'Genetic Screening', description: 'ال篩选 الوراثي للزوجين قبل التلقيح للكشف عن الطفرات', icon: '🧬' },
    ],
    preparationGuide: [
      'في تحليل السائل المنوي: الامتناع عن الجماع 2-5 أيام قبل الفحص',
      'في تحاليل هرمونات الخصوبة للسيدات: تحديد يوم الدورة الشهرية (يوم 2-5 للدورة)',
      'في AMH: يمكن عمله في أي وقت من الدورة الشهرية',
      'في تحاليل الغدة الدرقية للخصوبة: لا يحتاج لصيام',
    ],
    expectedTime: { standard: 'ساعتان - 24 ساعة', rush: 'ساعة واحدة', stat: '30 دقيقة' },
    insurance: [
      { provider: 'بوبا', coverage: 'تغطية جزئية', note: '50% من فحوصات الخصوبة الأساسية' },
      { provider: 'التعاونية', coverage: 'تغطية 60%', note: 'لفحوصات before-IVF فقط' },
      { provider: 'مدجلف', coverage: 'تغطية 50%', note: 'تحتاج موافقة مسبقة' },
      { provider: 'الراجحي تكافل', coverage: 'تغطية 70%', note: 'لفحوصات الخصوبة المقبولة شرعياً فقط' },
    ],
    faqs: [
      { question: 'متى يجب عمل فحص الخصوبة؟', answer: 'بعد 12 شهر من المحاولة الفاشلة للحمل، أو بعد 6 أشهر إذا كان عمر المرأة فوق 35 سنة.' },
      { question: 'ما هو AMH ولماذا يُقاس؟', answer: 'AMH يقي مخزون البويضات في المبيض، ويُستخدم لتقييم الاستجابة للتحفيز التناسلي.' },
      { question: 'هل تحليل السائل المنوي مؤلم؟', answer: 'لا، التحليل يتم عبر عينة بسيطة غير مؤلمة مع الحفاظ على الخصوصية التامة.' },
      { question: 'ما الفحوصات المطلوبة قبل التلقيح الاصطناعي؟', answer: 'تحاليل هرمونات الخصوبة الشاملة وتحليل السائل المنوي والتحاليل الوراثية والعدوى المعدية.' },
    ],
    articles: [
      { id: 'fertility-testing-guide', title: 'دليل تحاليل الخصوبة الشامل', excerpt: 'شرح كامل لجميع تحاليل الخصوبة للرجال والنساء ومتى نحتاجها', date: '2024-03-10', readTime: '8 دقائق', category: 'صحة الإنجاب' },
      { id: 'amh-explained', title: 'هرمون AMH: كل ما تحتاج معرفته', excerpt: 'شرح شامل لهرمون AMH وأهميته في تقييم الخصوبة والتخطيط للحمل', date: '2024-02-15', readTime: '6 دقائق', category: 'مقالات طبية' },
    ],
    testimonials: [
      { id: 't1-fert', name: 'سارة بنت محمد العنزي', text: 'تحاليل الخصوبة كانت شاملة ودقيقة، ساعدتنا في تحديد خطة الحمل المناسبة.', rating: 5, date: '2024-03-18' },
      { id: 't2-fert', name: 'خالد بن فيصل الشمري', text: 'تجربة ممتازة من حيث الخصوصية والدقة، فريق طبي متميز ومحترف.', rating: 5, date: '2024-02-22' },
      { id: 't3-fert', name: 'مريم بنت سلطان الحربي', text: 'خدمة ممتازة ونتائج سريعة، أنصح جميع الأزواج بعمل فحص الخصوبة هنا.', rating: 4, date: '2024-01-28' },
    ],
    relatedDepartments: ['hormones', 'endocrinology', 'genetics'],
    isPopular: false, order: 25, totalTests: 40, totalPatients: '6,000+', accuracy: '99.5%', experience: '16+ سنة',
  },
];

export function getDepartmentBySlug(slug: string): Department | undefined {
  return ALL_DEPARTMENTS.find((dept) => dept.id === slug);
}

export function getPopularDepartments(): Department[] {
  return ALL_DEPARTMENTS.filter((dept) => dept.isPopular);
}

export function getRelatedDepartments(slug: string): Department[] {
  const department = getDepartmentBySlug(slug);
  if (!department) return [];
  return department.relatedDepartments
    .map((id) => getDepartmentBySlug(id))
    .filter((dept): dept is Department => dept !== undefined);
}

export function searchDepartments(query: string): Department[] {
  const lowerQuery = query.toLowerCase();
  return ALL_DEPARTMENTS.filter(
    (dept) =>
      dept.nameAr.includes(query) ||
      dept.nameEn.toLowerCase().includes(lowerQuery) ||
      dept.descriptionAr.includes(query) ||
      dept.descriptionEn.toLowerCase().includes(lowerQuery) ||
      dept.tests.some(
        (test) =>
          test.nameAr.includes(query) ||
          test.nameEn.toLowerCase().includes(lowerQuery)
      )
  );
}

export const DEPARTMENT_CATEGORIES = [
  { id: 'all', nameAr: 'جميع الأقسام', nameEn: 'All Departments', icon: '📋' },
  { id: 'popular', nameAr: 'الأكثر طلباً', nameEn: 'Most Popular', icon: '⭐' },
  { id: 'blood', nameAr: 'تحاليل الدم', nameEn: 'Blood Tests', icon: '🩸' },
  { id: 'chemistry', nameAr: 'الكيمياء السريرية', nameEn: 'Clinical Chemistry', icon: '🧪' },
  { id: 'infection', nameAr: 'العدوى والكائنات الدقيقة', nameEn: 'Infection & Microbiology', icon: '🦠' },
  { id: 'immune', nameAr: 'المناعة والحساسية', nameEn: 'Immunity & Allergy', icon: '🛡️' },
  { id: 'hormones', nameAr: 'الهرمونات والغدد', nameEn: 'Hormones & Endocrine', icon: '⚗️' },
  { id: 'cancer', nameAr: 'الأورام والسرطان', nameEn: 'Oncology & Tumors', icon: '🎯' },
  { id: 'genetic', nameAr: 'الوراثة والجزيئات', nameEn: 'Genetics & Molecular', icon: '🧬' },
  { id: 'organ', nameAr: 'وظائف الأعضاء', nameEn: 'Organ Function', icon: '🫘' },
  { id: 'emergency', nameAr: 'الطوارئ والسموم', nameEn: 'Emergency & Toxicology', icon: '🚑' },
  { id: 'preventive', nameAr: 'الفحوصات الوقائية', nameEn: 'Preventive Screening', icon: '💪' },
];