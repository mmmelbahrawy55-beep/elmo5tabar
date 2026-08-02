import Link from 'next/link';
import {
  FlaskConical,
  ArrowLeft,
  Shield,
  Clock,
  Smartphone,
  Brain,
  ChevronDown,
  Star,
  Users,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden bg-white border-b border-surface-100">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent" />
        <nav className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                <FlaskConical className="h-6 w-6" />
              </div>
              <div>
                <span className="text-lg font-bold text-surface-900">المختبر</span>
                <span className="mr-2 text-sm text-surface-500">Al Mokhtabar</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm font-medium text-surface-600 hover:text-brand-500 transition-colors">
                خدماتنا
              </a>
              <a href="#about" className="text-sm font-medium text-surface-600 hover:text-brand-500 transition-colors">
                من نحن
              </a>
              <a href="#branches" className="text-sm font-medium text-surface-600 hover:text-brand-500 transition-colors">
                فروعنا
              </a>
              <a href="#contact" className="text-sm font-medium text-surface-600 hover:text-brand-500 transition-colors">
                تواصل معنا
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/en/login"
                className="btn-ghost text-sm"
              >
                Login
              </Link>
              <Link
                href="/ar/register"
                className="btn-primary text-sm"
              >
                احجز الآن
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-24 lg:py-32">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-in">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm mb-6">
                <CheckCircle2 className="h-4 w-4 text-accent-400" />
                الأول في المنطقة - رقم ١ في التحاليل المخبرية
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                صحة أفضل
                <br />
                <span className="text-gradient bg-gradient-to-l from-brand-300 to-accent-300 bg-clip-text text-transparent">
                  بثقة أكبر
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
                المختبر - منصة الرعاية الصحية الرقمية الأكثر تطوراً في المنطقة. 
                تحاليل طبية متقدمة، نتائج فورية، وذكاء اصطناعي يخدم صحتك.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/ar/register"
                  className="btn-primary bg-white text-brand-600 hover:bg-surface-50 text-base px-8 py-4"
                >
                  ابدأ الآن
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <Link
                  href="/ar/patient/tests"
                  className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20 text-base px-8 py-4"
                >
                  تصفح التحاليل
                </Link>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-white">+١٥٠</div>
                  <div className="text-sm text-white/60">فحص مخبري</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">+٢٠</div>
                  <div className="text-sm text-white/60">فرع في المملكة</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">+٥٠٠K</div>
                  <div className="text-sm text-white/60">عميل سعيد</div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="relative rounded-3xl bg-white/10 p-8 backdrop-blur-xl border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/30">
                      <FlaskConical className="h-6 w-6 text-brand-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">تحليل شامل</div>
                      <div className="text-xs text-white/60">نتائج خلال ٢٤ ساعة</div>
                    </div>
                    <div className="mr-auto badge-success text-xs">جاهز</div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/30">
                      <Brain className="h-6 w-6 text-accent-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">تحليل ذكي بالذكاء الاصطناعي</div>
                      <div className="text-xs text-white/60">نتائج مدعومة بالـ AI</div>
                    </div>
                    <div className="mr-auto badge-warning text-xs">مميز</div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-500/30">
                      <Shield className="h-6 w-6 text-success-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">آمن وموثوق</div>
                      <div className="text-xs text-white/60">تشفير طبي متقدم</div>
                    </div>
                    <div className="mr-auto badge-success text-xs">معتمد</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-surface-900 sm:text-4xl">لماذا المختبر؟</h2>
            <p className="mt-4 text-lg text-surface-500">
              نقدم تجربة مخبرية شاملة لا مثيل لها
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FlaskConical,
                title: 'تحاليل شاملة',
                description: 'أكثر من ١٥٠ فحص مخبري متخصص تشمل التحاليل الدموية والurine والهرمونات والجزيئات الحيوية',
                color: 'bg-brand-500',
              },
              {
                icon: Clock,
                title: 'نتائج سريعة',
                description: 'نتائج خلال ٢٤ ساعة أو أقل مع إشعارات فورية عبر التطبيق والرسائل النصية',
                color: 'bg-accent-500',
              },
              {
                icon: Brain,
                title: 'ذكاء اصطناعي',
                description: 'تحليلات ذكية للنتائج مع مقارنة مع المعدلات الطبيعية وتوصيات مخصصة',
                color: 'bg-saffron-500',
              },
              {
                icon: Shield,
                title: 'خصوصية تامة',
                description: 'تشفير طبي من الدرجة الأولى مع الامتثال لأنظمة حماية البيانات الصحية',
                color: 'bg-danger-500',
              },
              {
                icon: Smartphone,
                title: 'تطبيق سهل',
                description: 'احجز وتابع واطلق النتائج من تطبيق واحد يعمل على iPhone وAndroid',
                color: 'bg-purple-500',
              },
              {
                icon: Users,
                title: 'زيارة منزلية',
                description: 'خدمةجمع العينات من منزلك مع فريق طبي معتمد ومتخصص',
                color: 'bg-teal-500',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group card-hover p-8 animate-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} text-white`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-surface-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-surface-900 sm:text-4xl">كيف يعمل؟</h2>
            <p className="mt-4 text-lg text-surface-500">خطوات بسيطة للحصول على تحاليلك</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '٠١', title: 'سجّل حساب', description: 'أنشئ حسابك في ثوانٍ' },
              { step: '٠٢', title: 'اختر التحاليل', description: 'تصفح وحدد التحاليل المناسبة' },
              { step: '٠٣', title: 'جمع العينات', description: 'في الفرع أو منزلك' },
              { step: '٠٤', title: 'احصل على النتائج', description: 'نتائج فورية مع تحليل ذكي' },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-surface-900">{item.title}</h3>
                <p className="mt-2 text-sm text-surface-500">{item.description}</p>
                {index < 3 && (
                  <div className="absolute left-[60%] top-8 hidden h-px w-[80%] bg-surface-200 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold text-surface-900 sm:text-4xl">
                صحتك أولاً. دقة لا تقبل المساومة.
              </h2>
              <p className="mt-6 text-lg text-surface-500">
                نستخدم أحدث التقنيات والمعدات المخبرية المعتمدة دولياً لضمان أعلى معايير الجودة والدقة في النتائج.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  'معتمد من وزارة الصحة',
                  'ISO 15189:2012 للجودة المخبرية',
                  'تشفير 256-بت لحماية البيانات',
                  'تكامل مع منظومة صحتي الإلكترونية',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent-500" />
                    <span className="text-sm font-medium text-surface-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-elevated p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-brand-50 p-6 text-center">
                  <div className="text-3xl font-bold text-brand-600">٩٩.٩٪</div>
                  <div className="mt-2 text-sm text-surface-600">دقة النتائج</div>
                </div>
                <div className="rounded-2xl bg-accent-50 p-6 text-center">
                  <div className="text-3xl font-bold text-accent-600">٤-٨ س</div>
                  <div className="mt-2 text-sm text-surface-600">ساعات للنتائج العاجلة</div>
                </div>
                <div className="rounded-2xl bg-saffron-50 p-6 text-center">
                  <div className="text-3xl font-bold text-saffron-600">٢٤ س</div>
                  <div className="mt-2 text-sm text-surface-600">ساعة للنتائج العادية</div>
                </div>
                <div className="rounded-2xl bg-purple-50 p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600">+٢٠</div>
                  <div className="mt-2 text-sm text-surface-600">فرع متخصص</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-surface-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <FlaskConical className="h-6 w-6" />
                </div>
                <span className="text-lg font-bold">المختبر</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-surface-400">
                منصة الرعاية الصحية الرقمية الأولى في المنطقة.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">خدماتنا</h3>
              <ul className="mt-4 space-y-3 text-sm text-surface-400">
                <li><a href="#" className="hover:text-white transition-colors">التحاليل الدموية</a></li>
                <li><a href="#" className="hover:text-white transition-colors">التحاليل البولية</a></li>
                <li><a href="#" className="hover:text-white transition-colors">الهرمونات</a></li>
                <li><a href="#" className="hover:text-white transition-colors">الفحوصات الشاملة</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">الشركة</h3>
              <ul className="mt-4 space-y-3 text-sm text-surface-400">
                <li><a href="#" className="hover:text-white transition-colors">من نحن</a></li>
                <li><a href="#" className="hover:text-white transition-colors">الفروع</a></li>
                <li><a href="#" className="hover:text-white transition-colors">وظائف</a></li>
                <li><a href="#" className="hover:text-white transition-colors">تواصل معنا</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">الدعم</h3>
              <ul className="mt-4 space-y-3 text-sm text-surface-400">
                <li><a href="#" className="hover:text-white transition-colors">الأسئلة الشائعة</a></li>
                <li><a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a></li>
                <li><a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a></li>
                <li><a href="#" className="hover:text-white transition-colors">تواصل معنا: 800-ALMOKHTABAR</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-surface-800 pt-8 text-center text-sm text-surface-500">
            © 2024 المختبر | Al Mokhtabar Laboratory. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
