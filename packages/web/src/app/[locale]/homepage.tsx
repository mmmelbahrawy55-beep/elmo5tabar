'use client';

import * as React from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Microscope, TestTube2, Activity, Dna, Droplets, Shield, Clock,
  MapPin, Phone, Mail, Calendar, ChevronLeft, ChevronRight, Star,
  Award, Zap, Users, Target, TrendingUp,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
};

function Section({ children, className = '', id, bg = 'white' }: {
  children: React.ReactNode; className?: string; id?: string; bg?: string;
}) {
  const bgMap: Record<string, string> = {
    white: 'bg-white dark:bg-gray-950',
    light: 'bg-surface-50 dark:bg-gray-900',
    dark: 'bg-gradient-to-br from-brand-600 to-brand-500 text-white',
  };
  return (
    <section id={id} className={`relative overflow-hidden ${bgMap[bg] || bg} ${className}`}>
      {children}
    </section>
  );
}

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

// ============================================================
// 1. NAVIGATION
// ============================================================
function Navigation({ scrolled }: { scrolled: boolean }) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navItems = ['الخدمات', 'الأجهزة', 'الفروع', 'لماذا نحن'];

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-2xl border-b border-surface-100 dark:border-gray-800 shadow-lg shadow-black/5'
          : 'bg-transparent'
      }`}>
        <Container>
          <div className="flex h-16 items-center justify-between lg:h-20">
            <Link href={`/${locale}`} className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/30">
                <TestTube2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className={`text-lg font-bold leading-tight transition-colors ${scrolled ? 'text-surface-900 dark:text-white' : 'text-white'}`}>
                  المختبر
                </span>
                <span className={`text-[10px] leading-tight transition-colors ${scrolled ? 'text-surface-500' : 'text-white/60'}`}>
                  Al Mokhtabar
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <a key={item} href={`#${item}`} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-brand-50 dark:hover:bg-brand-500/10 ${
                  scrolled ? 'text-surface-600 hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-400' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}>{item}</a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link href={`/${locale}/register`}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Calendar className="h-4 w-4" />احجز الآن
              </Link>
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className={`lg:hidden rounded-xl p-2 transition-colors ${scrolled ? 'text-surface-700 dark:text-white hover:bg-surface-100' : 'text-white hover:bg-white/10'}`}>
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </Container>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 z-[99] bg-white dark:bg-gray-950 lg:hidden">
            <Container className="py-6">
              <nav className="flex flex-col gap-2">
                {navItems.map((item, i) => (
                  <motion.a key={item} href={`#${item}`}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="py-3 px-4 text-lg font-medium text-surface-900 dark:text-white rounded-xl hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                    onClick={() => setMobileOpen(false)}>
                    {item}
                  </motion.a>
                ))}
              </nav>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// 2. HERO SECTION
// ============================================================
function HeroSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#023E8A] via-brand-600 to-accent-500">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(6,182,212,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(14,165,233,0.15),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div key={i} className="absolute rounded-full bg-white/5"
            style={{ width: Math.random() * 120 + 40, height: Math.random() * 120 + 40, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -40, 0], x: [0, 20, 0], opacity: [0.03, 0.1, 0.03] }}
            transition={{ duration: Math.random() * 6 + 6, repeat: Infinity, delay: Math.random() * 4 }} />
        ))}
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 w-full">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-32 lg:py-0">
            <div className="text-white">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium border border-white/20 mb-8">
                <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
                أحدث الأجهزة والتقنيات الطبية
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                المختبر<br />
                <span className="bg-gradient-to-r from-accent-400 to-white bg-clip-text text-transparent">
                  منصة التحاليل الطبية
                </span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="mt-6 text-lg sm:text-xl text-white/70 max-w-lg leading-relaxed">
                أحدث الأجهزة والتقنيات الطبية لنتائج دقيقة وموثوقة. أكثر من 500 فحص مخبري في 45 فرع.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                className="mt-10 flex flex-wrap gap-4">
                <Link href={`/${locale}/register`}
                  className="flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-bold text-brand-600 shadow-2xl hover:shadow-3xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Calendar className="h-5 w-5" />احجز الآن
                </Link>
                <Link href={`/${locale}/patient/tests`}
                  className="flex items-center gap-2 rounded-2xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 transition-all hover:border-white/50">
                  تصفح التحاليل
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                className="mt-12 flex flex-wrap gap-3">
                {[
                  { icon: <Award className="h-4 w-4" />, label: 'ISO 15189' },
                  { icon: <Star className="h-4 w-4" />, label: 'تقييم 4.9' },
                  { icon: <Zap className="h-4 w-4" />, label: '+15,000 فحص شهرياً' },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2.5 border border-white/10">
                    <span className="text-accent-400">{b.icon}</span>
                    <span className="text-sm font-medium text-white/80">{b.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }} className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="relative w-[420px] h-[420px] rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <Microscope className="w-32 h-32 text-white/90 mb-6" strokeWidth={1} />
                  <p className="text-3xl font-bold text-white mb-1">500+</p>
                  <p className="text-sm text-white/60">فحص مخبري</p>
                </div>

                <motion.div className="absolute -top-6 -right-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-4 shadow-xl"
                  animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent-500 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">جهاز تحليل الدم الآلي</p>
                      <p className="text-[10px] text-white/60">نتائج خلال 30 دقيقة</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="absolute -bottom-6 -left-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-4 shadow-xl"
                  animate={{ y: [0, 12, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-400 flex items-center justify-center">
                      <Dna className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">جهاز PCR</p>
                      <p className="text-[10px] text-white/60">دقة 99.9%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="absolute top-1/2 -left-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-4 shadow-xl"
                  animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">معتمد دولياً</p>
                      <p className="text-[10px] text-white/60">ISO & CAP</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Container>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2">
          <span className="text-xs text-white/50 font-medium">اكتشف المزيد</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================
// 3. LAB DEVICES SHOWCASE
// ============================================================
function LabDevicesSection() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  const devices = [
    { name: 'جهاز تحليل الدم الآلي', desc: 'تحليل شامل لعناصر الدم بنتائج دقيقة خلال 30 دقيقة', icon: <Activity className="h-8 w-8" />, gradient: 'from-red-500 to-pink-600', bg: 'from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50' },
    { name: 'جهاز التحليل الكيميائي', desc: 'قياس مستويات السكر والكوليسترول والإنزيمات بدقة عالية', icon: <TestTube2 className="h-8 w-8" />, gradient: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50' },
    { name: 'الجهاز المجهري الرقمي', desc: 'فحص عينات الدم والأنسجة بتقنية رقمية متطورة', icon: <Microscope className="h-8 w-8" />, gradient: 'from-purple-500 to-violet-600', bg: 'from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50' },
    { name: 'جهاز التفاعل البوليني PCR', desc: 'كشف الأمراض والعدوى بدقة 99.9% في وقت قياسي', icon: <Dna className="h-8 w-8" />, gradient: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50' },
    { name: 'جهاز تحليل البول الآلي', desc: 'تحليل شامل ودقيق لعينات البول بأحدث التقنيات', icon: <Droplets className="h-8 w-8" />, gradient: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50' },
    { name: 'جهاز التحليل المناعي', desc: 'قياس الأجسام المضادة وأضداد الفيروسات والبكتيريا', icon: <Shield className="h-8 w-8" />, gradient: 'from-cyan-500 to-sky-600', bg: 'from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50' },
    { name: 'جهاز تحليل الهرمونات', desc: 'قياس مستويات الهرمونات بدقة فائقة لتشخيص شامل', icon: <TrendingUp className="h-8 w-8" />, gradient: 'from-rose-500 to-red-600', bg: 'from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-red-950/50' },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
  };

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    const autoScroll = () => {
      if (el && !isDragging) {
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth) el.scrollLeft = 0;
        else el.scrollLeft += 0.5;
      }
      animId = requestAnimationFrame(autoScroll);
    };
    animId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animId);
  }, [isDragging]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 340 : -340, behavior: 'smooth' });
  };

  return (
    <Section id="الأجهزة" bg="light" className="py-20 lg:py-28">
      <Container>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 mb-4">
            <Microscope className="h-4 w-4" />أحدث الأجهزة الطبية
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white">
            أجهزتنا <span className="text-brand-600 dark:text-brand-400">المتطورة</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-surface-500 dark:text-gray-400 max-w-2xl mx-auto">
            نستخدم أحدث الأجهزة والتقنيات الطبية المعتمدة دولياً لضمان دقة النتائج
          </motion.p>
        </motion.div>
      </Container>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex justify-end gap-2">
        <button onClick={() => scroll('right')} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-surface-200 dark:border-gray-700 text-surface-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 transition-colors shadow-sm">
          <ChevronRight className="h-5 w-5" />
        </button>
        <button onClick={() => scroll('left')} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-surface-200 dark:border-gray-700 text-surface-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 transition-colors shadow-sm">
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <div ref={scrollRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
        className={`flex gap-6 overflow-x-auto pb-6 px-4 sm:px-6 lg:px-8 scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollbarWidth: 'none' as const }}>
        <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
        <div className="shrink-0 w-0 lg:w-[calc((100vw-1280px)/2)]" />
        {devices.map((d, i) => (
          <motion.div key={d.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="shrink-0 w-[300px] sm:w-[320px]">
            <div className={`group relative rounded-3xl bg-gradient-to-br ${d.bg} border border-surface-100 dark:border-gray-800 p-6 h-[320px] flex flex-col justify-between hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${d.gradient}`} />
              <div>
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${d.gradient} text-white shadow-lg mb-5`}>
                  {d.icon}
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{d.name}</h3>
                <p className="text-sm text-surface-500 dark:text-gray-400 leading-relaxed">{d.desc}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-400 group-hover:gap-3 transition-all">
                <span>المزيد من التفاصيل</span>
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </motion.div>
        ))}
        <div className="shrink-0 w-0 lg:w-[calc((100vw-1280px)/2)]" />
      </div>
    </Section>
  );
}

// ============================================================
// 4. SERVICES SECTION
// ============================================================
function ServicesSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const services = [
    { icon: <TestTube2 className="h-6 w-6" />, title: 'التحاليل المخبرية', desc: 'أكثر من 500 فحص مخبري شامل في مختلف التخصصات الطبية مع نتائج دقيقة وموثوقة', color: 'from-brand-500 to-brand-600', link: '#' },
    { icon: <Users className="h-6 w-6" />, title: 'الفحص المنزلي', desc: 'خدمة فحص منزلي على مدار الساعة مع فريق طبي معتمد ومعدات متطورة', color: 'from-accent-500 to-cyan-600', link: '#' },
    { icon: <Calendar className="h-6 w-6" />, title: 'حجز المواعيد', desc: 'احجز موعدك بسهولة عبر الإنترنت واختار الفرع والوقت المناسب لك', color: 'from-emerald-500 to-teal-600', link: `/${locale}/register` },
  ];

  return (
    <Section id="الخدمات" className="py-20 lg:py-28">
      <Container>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 mb-4">
            خدماتنا المتكاملة
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white">
            خدماتنا <span className="text-brand-600 dark:text-brand-400">المخبرية</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-surface-500 dark:text-gray-400 max-w-2xl mx-auto">
            نقدم مجموعة شاملة من الخدمات المخبرية عالية الجودة
          </motion.p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {services.map((s) => (
            <motion.div key={s.title} variants={scaleIn}>
              <Link href={s.link} className="block group">
                <div className="relative rounded-3xl bg-white dark:bg-gray-900 border border-surface-100 dark:border-gray-800 p-8 h-full hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-500/30 transition-all duration-500 hover:-translate-y-1">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-lg mb-6`}>{s.icon}</div>
                  <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{s.title}</h3>
                  <p className="text-surface-500 dark:text-gray-400 leading-relaxed mb-6">{s.desc}</p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 group-hover:gap-3 transition-all">
                    <span>اعرف المزيد</span>
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  </div>
                  <div className={`absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r ${s.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 5. BRANCHES / LOCATIONS
// ============================================================
function BranchesSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const branches = [
    { name: 'فرع الرياض — العليا', address: 'شارع التحلية، حي العليا، الرياض', hours: 'السبت - الخميس: 7 ص - 10 م', phone: '+966 50 123 4567', isMain: true },
    { name: 'فرع جدة — الروضة', address: 'شارع الأمير سلطان، حي الروضة، جدة', hours: 'السبت - الخميس: 7 ص - 10 م', phone: '+966 50 234 5678', isMain: false },
    { name: 'فرع الدمام — الشاطئ', address: 'شارع الشاطئ، حي الشاطئ، الدمام', hours: 'السبت - الخميس: 8 ص - 9 م', phone: '+966 50 345 6789', isMain: false },
    { name: 'فرع مكة المكرمة — العزيزية', address: 'شارع العزيزية، حي العزيزية، مكة المكرمة', hours: 'السبت - الخميس: 7 ص - 10 م', phone: '+966 50 456 7890', isMain: false },
  ];

  return (
    <Section id="الفروع" bg="light" className="py-20 lg:py-28">
      <Container>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 mb-4">
            <MapPin className="h-4 w-4" />فروعنا
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white">
            فروعنا <span className="text-brand-600 dark:text-brand-400">قريبة منك</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-surface-500 dark:text-gray-400 max-w-2xl mx-auto">
            أكثر من 45 فرع في المملكة العربية السعودية لخدمتك
          </motion.p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {branches.map((b) => (
            <motion.div key={b.name} variants={fadeUp}
              className={`relative rounded-3xl bg-white dark:bg-gray-900 border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                b.isMain ? 'border-brand-200 dark:border-brand-500/30 ring-2 ring-brand-500/10' : 'border-surface-100 dark:border-gray-800'
              }`}>
              {b.isMain && (
                <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  الفرع الرئيسي
                </div>
              )}
              <div className="mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-4">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">{b.name}</h3>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-surface-400 dark:text-gray-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-surface-500 dark:text-gray-400">{b.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-surface-400 dark:text-gray-500 shrink-0" />
                  <p className="text-sm text-surface-500 dark:text-gray-400">{b.hours}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-surface-400 dark:text-gray-500 shrink-0" />
                  <p className="text-sm text-surface-500 dark:text-gray-400" dir="ltr">{b.phone}</p>
                </div>
              </div>
              <Link href={`/${locale}/register`}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 px-5 py-3 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white transition-all">
                <Calendar className="h-4 w-4" />احجز في هذا الفرع
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 6. WHY CHOOSE US
// ============================================================
function WhyChooseSection() {
  const reasons = [
    { icon: <Target className="h-6 w-6" />, title: 'دقة النتائج', desc: 'نظام ضمان جودة متعدد الطبقات يضمن دقة 99.7% في جميع النتائج المخبرية', color: 'from-brand-500 to-brand-600' },
    { icon: <Zap className="h-6 w-6" />, title: 'سرعة التحويل', desc: 'نتائج جاهزة خلال 2-24 ساعة حسب نوع الفحص مع إشعارات فورية', color: 'from-accent-500 to-cyan-600' },
    { icon: <Users className="h-6 w-6" />, title: 'فريق متخصص', desc: 'أطباء وفنيون مختبرات معتمدون بخبرة تزيد عن 15 عاماً في مجال التحاليل', color: 'from-emerald-500 to-teal-600' },
    { icon: <Microscope className="h-6 w-6" />, title: 'أحدث الأجهزة', desc: 'أجهزة مخبرية من أفضل الماركات العالمية مع صيانة دورية وتحديث مستمر', color: 'from-purple-500 to-violet-600' },
  ];

  return (
    <Section id="لماذا نحن" className="py-20 lg:py-28">
      <Container>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 mb-4">
            <Award className="h-4 w-4" />لماذا المختبر؟
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white">
            لماذا <span className="text-brand-600 dark:text-brand-400">تختارنا</span>؟
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-surface-500 dark:text-gray-400 max-w-2xl mx-auto">
            نلتزم بأعلى معايير الجودة لتقديم أفضل خدمات التحاليل الطبية
          </motion.p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r, i) => (
            <motion.div key={r.title} variants={fadeUp}
              className="group relative rounded-3xl bg-white dark:bg-gray-900 border border-surface-100 dark:border-gray-800 p-6 text-center hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-500/30 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 dark:bg-gray-800 text-xs font-bold text-surface-500 dark:text-gray-400">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${r.color} text-white shadow-lg mb-5 group-hover:scale-110 transition-transform`}>
                {r.icon}
              </div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{r.title}</h3>
              <p className="text-sm text-surface-500 dark:text-gray-400 leading-relaxed">{r.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 7. BOOKING CTA
// ============================================================
function BookingCTASection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  return (
    <Section bg="dark" className="py-20 lg:py-28">
      <Container>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <motion.div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 mb-6">
            <Calendar className="h-4 w-4" />احجز الآن
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            احجز موعدك <span className="text-accent-400">الآن</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">
            لا تنتظر. احجز فحصك في أي فرع أو اطلب خدمة الفحص المنزلي. النتائج جاهزة خلال ساعات.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link href={`/${locale}/register`}
              className="flex items-center gap-3 rounded-2xl bg-white px-10 py-4 text-base font-bold text-brand-600 shadow-2xl hover:shadow-3xl transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Calendar className="h-5 w-5" />احجز موعدك الآن
            </Link>
            <a href="tel:+966501234567"
              className="flex items-center gap-2 rounded-2xl border-2 border-white/30 px-10 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all">
              <Phone className="h-5 w-5" />اتصل بنا
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/50 text-sm">
            <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>السبت - الخميس: 7 صباحاً - 10 مساءً</span></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><span dir="ltr">+966 50 123 4567</span></div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>info@almokhtabar.com</span></div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 8. FOOTER
// ============================================================
function FooterSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const footerLinks: Record<string, { label: string; href: string }[]> = {
    المختبر: [
      { label: 'من نحن', href: '#' },
      { label: 'الفروع', href: '#الفروع' },
      { label: 'الوظائف', href: '#' },
      { label: 'الأخبار', href: '#' },
    ],
    الخدمات: [
      { label: 'التحاليل المخبرية', href: '#الخدمات' },
      { label: 'الفحص المنزلي', href: '#' },
      { label: 'حجز المواعيد', href: `/${locale}/register` },
      { label: 'باقات التحاليل', href: '#' },
    ],
    الدعم: [
      { label: 'الأسئلة الشائعة', href: '#' },
      { label: 'الشروط والأحكام', href: `/${locale}/terms` },
      { label: 'سياسة الخصوصية', href: `/${locale}/privacy` },
      { label: 'تواصل معنا', href: '#' },
    ],
  };

  return (
    <footer className="bg-gray-950 text-white">
      <Container className="py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                <TestTube2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold">المختبر</span>
                <span className="block text-[10px] text-gray-400">Al Mokhtabar</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              معامل تحليل طبي معتمدة دولياً تقدم أكثر من 500 فحص مخبري في 45 فرع بالمملكة.
            </p>
            <div className="flex gap-3">
              {['X', 'IG', 'FB', 'YT', 'WA'].map((s) => (
                <a key={s} href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-gray-400 hover:bg-brand-500 hover:text-white transition-colors">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-bold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t border-gray-800">
        <Container className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">© 2026 المختبر — Al Mokhtabar. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>🏅 ISO 15189</span>
              <span>🏆 CAP</span>
              <span>📋 ZATCA</span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}

// ============================================================
// MAIN HOMEPAGE
// ============================================================
export default function HomePage() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Navigation scrolled={scrolled} />
      <HeroSection />
      <LabDevicesSection />
      <ServicesSection />
      <BranchesSection />
      <WhyChooseSection />
      <BookingCTASection />
      <FooterSection />
    </main>
  );
}
