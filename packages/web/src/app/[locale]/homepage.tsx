'use client';

import * as React from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============================================================
// ANIMATION UTILITIES
// ============================================================
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// ============================================================
// ANIMATED COUNTER HOOK
// ============================================================
function useCounter(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = React.useState(false);

  React.useEffect(() => {
    if (!startOnView) { setHasStarted(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) setHasStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView, hasStarted]);

  React.useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

// ============================================================
// SECTION WRAPPER
// ============================================================
function Section({ children, className = '', id, bg = 'white' }: { children: React.ReactNode; className?: string; id?: string; bg?: string }) {
  const bgClasses: Record<string, string> = {
    white: 'bg-white',
    light: 'bg-surface-50',
    dark: 'bg-gradient-to-br from-[#023E8A] to-[#0077B6] text-white',
    navy: 'bg-[#023E8A] text-white',
  };
  return (
    <section id={id} className={`relative overflow-hidden ${bgClasses[bg] || bg} ${className}`}>
      {children}
    </section>
  );
}

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

// ============================================================
// 1. PRELOADER
// ============================================================
function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(timer); setTimeout(onComplete, 400); return 100; }
        return p + 2;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#023E8A]"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <svg className="h-16 w-16" viewBox="0 0 64 64" fill="none">
            <motion.path
              d="M32 8 L32 24 M24 24 L40 24 M20 24 L20 48 C20 52 24 56 32 56 C40 56 44 52 44 48 L44 24"
              stroke="#10B981"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <motion.circle
              cx="32" cy="16" r="3"
              fill="#F59E0B"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            />
          </svg>
        </div>
        <motion.h1
          className="text-2xl font-bold text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          المختبر
        </motion.h1>
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#10B981] to-[#F59E0B] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-white/60">{progress}%</p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// 2. NAVIGATION
// ============================================================
function Navigation({ scrolled }: { scrolled: boolean }) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-[100] transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-surface-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <Container>
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 3L9 11M15 3L15 11M6 11L6 19C6 21 9 23 12 23C15 23 18 21 18 19L18 11M6 11H18" strokeLinecap="round" />
                </svg>
              </div>
              <span className={`text-lg font-bold ${scrolled ? 'text-surface-900' : 'text-white'}`}>
                المختبر
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {['الخدمات', 'التحاليل', 'الفروع', 'من نحن', 'تواصل معنا'].map((item) => (
                <a
                  key={item}
                  href={`#${item}`}
                  className={`text-sm font-medium transition-colors hover:text-brand-500 ${
                    scrolled ? 'text-surface-700' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className={`hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                scrolled ? 'text-surface-600 hover:bg-surface-100' : 'text-white/80 hover:text-white'
              }`}>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" />
                </svg>
                EN
              </button>
              <Link
                href={`/${locale}/register`}
                className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                احجز الآن
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`lg:hidden rounded-xl p-2 ${scrolled ? 'text-surface-700' : 'text-white'}`}
              >
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  {mobileOpen ? (
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[99] bg-white lg:hidden"
          >
            <div className="flex flex-col p-6 pt-20">
              {['الخدمات', 'التحاليل', 'الفروع', 'من نحن', 'تواصل معنا'].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="py-4 text-lg font-medium text-surface-900 border-b border-surface-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {item}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <Link
                  href={`/${locale}/register`}
                  className="flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-base font-semibold text-white"
                >
                  احجز الآن
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// 3. HERO SECTION
// ============================================================
function HeroSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#023E8A] via-[#0077B6] to-[#0096C7]">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,158,11,0.1),transparent_50%)]" />
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: Math.random() * 100 + 20,
              height: Math.random() * 100 + 20,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 w-full">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-32 lg:py-0">
            {/* Text Content */}
            <div className="text-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium border border-white/20 mb-6"
              >
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                معتمد دولياً — ISO 15189 & CAP
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight"
              >
                دقة في كل
                <br />
                <span className="bg-gradient-to-r from-[#10B981] to-[#F59E0B] bg-clip-text text-transparent">
                  تفصيلة
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-lg sm:text-xl text-white/70 max-w-lg leading-relaxed"
              >
                أكثر من 500 فحص مخبري، نتائج خلال ساعات، 45 فرع في المملكة العربية السعودية.
                صحتك أمانة، ونحن نضمن لك الدقة.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link
                  href={`/${locale}/register`}
                  className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#023E8A] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  احجز الآن
                  <svg className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link
                   href={`/${locale}/patient/tests`}
                  className="flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 transition-all hover:border-white/50"
                >
                  تصفح التحاليل
                </Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="mt-12 flex flex-wrap gap-4"
              >
                {[
                  { icon: '🏅', label: 'ISO 15189' },
                  { icon: '🏆', label: 'CAP' },
                  { icon: '📊', label: '+15,000 فحص شهرياً' },
                  { icon: '⭐', label: '4.9 تقييم' },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2.5 border border-white/10"
                  >
                    <span className="text-lg">{badge.icon}</span>
                    <span className="text-sm font-medium text-white/80">{badge.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="relative">
                {/* Glass Card */}
                <div className="relative w-96 h-96 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 flex flex-col items-center justify-center">
                  <svg className="w-40 h-40 text-white/90" viewBox="0 0 120 120" fill="none">
                    <path d="M60 10 L60 45 M45 45 L75 45 M40 45 L40 85 C40 95 48 105 60 105 C72 105 80 95 80 85 L80 45" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="60" cy="25" r="6" fill="#10B981" />
                    <circle cx="55" cy="75" r="4" fill="#F59E0B" opacity="0.8" />
                    <circle cx="65" cy="80" r="3" fill="#10B981" opacity="0.6" />
                    <circle cx="60" cy="68" r="3.5" fill="#F59E0B" opacity="0.7" />
                  </svg>
                  <div className="mt-6 text-center">
                    <p className="text-2xl font-bold text-white">500+</p>
                    <p className="text-sm text-white/60">فحص مخبري</p>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  className="absolute -top-4 -left-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-3 shadow-xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[#10B981] flex items-center justify-center">
                      <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">نتيجة جاهزة</p>
                      <p className="text-[10px] text-white/60">CBC — أحمد محمد</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -right-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-3 shadow-xl"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[#F59E0B] flex items-center justify-center">
                      <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">تقييم 4.9</p>
                      <p className="text-[10px] text-white/60">من 2,340 مريض</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Container>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/50">اكتشف المزيد</span>
          <svg className="h-5 w-5 text-white/50" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================
// 4. TRUST INDICATORS
// ============================================================
function TrustIndicators() {
  const items = [
    { icon: '🏅', title: 'ISO 15189', subtitle: 'معتمد دولياً' },
    { icon: '🏆', title: 'CAP', subtitle: 'College of American Pathologists' },
    { icon: '🏛️', title: 'CBAHI', subtitle: 'هيئة التأهيل الصحية' },
    { icon: '📋', title: 'ZATCA', subtitle: 'متوافق مع الزكاة والضريبة' },
  ];

  return (
    <Section bg="light" className="py-6 border-b border-surface-100">
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="flex flex-wrap items-center justify-center gap-6 lg:gap-12"
        >
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="flex items-center gap-3 px-4 py-2"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-bold text-surface-900">{item.title}</p>
                <p className="text-xs text-surface-500">{item.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 5. STATISTICS
// ============================================================
function StatisticsSection() {
  const stats = [
    { end: 15247, suffix: '+', label: 'فحص شهرياً', labelEn: 'Tests per Month' },
    { end: 98.7, suffix: '%', label: 'دقة النتائج', labelEn: 'Accuracy Rate' },
    { end: 45, suffix: '', label: 'فرع في المملكة', labelEn: 'Branches' },
    { end: 150000, suffix: '+', label: 'مريض سعيد', labelEn: 'Happy Patients' },
  ];

  return (
    <Section bg="dark" className="py-20 lg:py-28">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            أرقام تتحدث عن <span className="text-[#10B981]">جودتنا</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-white/60">
            Numbers That Speak Our Quality
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat) => {
            const { count, ref } = useCounter(stat.end);
            return (
              <motion.div
                key={stat.label}
                ref={ref}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 p-6 lg:p-8"
              >
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-mono">
                  {count.toLocaleString('ar-SA')}{stat.suffix}
                </p>
                <p className="mt-2 text-sm font-medium text-white/80">{stat.label}</p>
                <p className="text-xs text-white/40">{stat.labelEn}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// ============================================================
// 6. SERVICES
// ============================================================
function ServicesSection() {
  const services = [
    { icon: '🩸', title: 'تحليل الدم', titleEn: 'Hematology', tests: 15, price: '150', color: 'from-red-500 to-red-600' },
    { icon: '🧪', title: 'التحاليل الكيميائية', titleEn: 'Chemistry', tests: 22, price: '200', color: 'from-blue-500 to-blue-600' },
    { icon: '⚗️', title: 'التحاليل الهرمونية', titleEn: 'Endocrinology', tests: 12, price: '320', color: 'from-purple-500 to-purple-600' },
    { icon: '🦠', title: 'البكتريولوجيا', titleEn: 'Microbiology', tests: 18, price: '250', color: 'from-green-500 to-green-600' },
    { icon: '🛡️', title: 'المناعة', titleEn: 'Immunology', tests: 10, price: '280', color: 'from-yellow-500 to-yellow-600' },
    { icon: '🧬', title: 'الوراثة', titleEn: 'Genetics', tests: 8, price: '450', color: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <Section id="الخدمات" className="py-20 lg:py-28">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900">
            خدماتنا <span className="text-brand-600">المخبرية</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-surface-500 max-w-2xl mx-auto">
            نقدم أكثر من 500 فحص مخبري في مختلف التخصصات الطبية
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={scaleIn}
              className="group relative rounded-2xl border border-surface-100 bg-white p-6 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${service.color} text-2xl shadow-lg`}>
                {service.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
                {service.title}
              </h3>
              <p className="mt-1 text-sm text-surface-500">{service.titleEn}</p>
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs font-medium text-surface-400">{service.tests} فحص</span>
                <span className="text-sm font-bold text-brand-600">من {service.price} ر.س</span>
              </div>
              <a href="#" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                المزيد
                <svg className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 7. WHY CHOOSE US
// ============================================================
function WhyChooseSection() {
  const reasons = [
    { icon: '🎯', title: 'دقة عالية', desc: 'نظام ضمان جودة متعدد الطبقات يضمن دقة 98.7% في جميع النتائج' },
    { icon: '⚡', title: 'سرعة النتائج', desc: 'نتائج جاهزة خلال 2-24 ساعة حسب نوع الفحص' },
    { icon: '🔒', title: 'أمان البيانات', desc: 'تشفير من الدرجة العسكرية وتوافق مع نظام حماية البيانات الشخصية' },
    { icon: '🤖', title: 'تحليل ذكي', desc: 'ذكاء اصطناعي يحلل نتائجك ويقدم توصيات مخصصة' },
    { icon: '💰', title: 'أسعار منافسة', desc: 'أسعار واضحة بدون تكاليف مخفية، ونوفر باقات مخفضة' },
    { icon: '📱', title: 'تجربة رقمية', desc: 'احجز، تتبع، وحمل نتائجك من تطبيقناบน هاتفك' },
  ];

  return (
    <Section bg="light" className="py-20 lg:py-28">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900">
            لماذا <span className="text-brand-600">المختبر</span>؟
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl bg-white p-6 shadow-sm border border-surface-100 hover:shadow-lg transition-shadow"
            >
              <span className="absolute top-4 left-4 text-5xl font-bold text-brand-50/80 font-mono">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="relative">
                <span className="text-3xl">{reason.icon}</span>
                <h3 className="mt-3 text-lg font-bold text-surface-900">{reason.title}</h3>
                <p className="mt-2 text-sm text-surface-500 leading-relaxed">{reason.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ============================================================
// 8. HOME VISIT
// ============================================================
function HomeVisitSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  return (
    <Section className="py-20 lg:py-28">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center overflow-hidden">
              <div className="text-center p-8">
                <div className="text-8xl mb-4">🏥</div>
                <p className="text-brand-600 font-semibold">فحص منزلي</p>
              </div>
            </div>
            {/* Floating card */}
            <motion.div
              className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-xl border border-surface-100"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#10B981] flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">متاح 24/7</p>
                  <p className="text-xs text-surface-500">خدمة على مدار الساعة</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">
              فحوصات منزلية
              <br />
              <span className="text-brand-600">صحتك تأتي أولاً</span>
            </h2>
            <p className="mt-4 text-lg text-surface-500 leading-relaxed">
              فريق طبي معتمد يزورك في منزلك أو مكتبك. معدات متنقلة متطورة ونتائج خلال 24 ساعة.
            </p>
            <div className="mt-8 space-y-4">
              {['فريق طبي معتمد وذو خبرة', 'معدات متنقلة بأحدث التقنيات', 'نتائج جاهزة خلال 24 ساعة', 'خدمة على مدار الساعة طوال أيام الأسبوع'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10B981]/10">
                    <svg className="h-3.5 w-3.5 text-[#10B981]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-surface-700">{item}</span>
                </div>
              ))}
            </div>
            <Link
               href={`/${locale}/book`}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              احجز فحص منزلي
              <svg className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}

// ============================================================
// 9. TESTIMONIALS
// ============================================================
function TestimonialsSection() {
  const testimonials = [
    { name: 'أحمد محمد', text: 'خدمة ممتازة ونتائج سريعة. الموظفون محترفون وودودون. أنصح الجميع بالتعامل مع المختبر.', rating: 5, avatar: 'أ' },
    { name: 'فاطمة العلي', text: 'تجربة رائعة من الحجز حتى استلام النتائج. التطبيق سهل جداً والنتائج واضحة ومفصّلة.', rating: 5, avatar: 'ف' },
    { name: 'خالد الشمري', text: 'الدقة في النتائج مذهلة. استخدمت خدمة الفحص المنزلي وكانت ممتازة. شكراً لكم.', rating: 5, avatar: 'خ' },
    { name: 'نورة الحربي', text: 'أفضل مختبر تعاملت معه. الأسعار معقولة والجودة عالية. النتائج جاهزة بسرعة.', rating: 5, avatar: 'ن' },
  ];

  return (
    <Section bg="light" className="py-20 lg:py-28">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900">
            ماذا يقول <span className="text-brand-600">مرضانا</span>؟
          </motion.h2>
          <motion.div variants={fadeUp} className="mt-4 flex items-center justify-center gap-2">
            <span className="text-lg">⭐</span>
            <span className="text-lg font-bold text-surface-900">4.9</span>
            <span className="text-sm text-surface-500">— تقييم Google من 2,340 مراجعة</span>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white p-6 shadow-sm border border-surface-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} className="text-[#F59E0B]">⭐</span>
                ))}
              </div>
              <p className="text-sm text-surface-600 leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-surface-100">
                <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">{t.name}</p>
                  <p className="text-xs text-surface-500">مريض معتمد ✓</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ============================================================
// 10. BOOKING CTA
// ============================================================
function BookingCTASection() {
  return (
    <Section bg="dark" className="py-20 lg:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            احجز فحصك المخبري <span className="text-[#10B981]">الآن</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">
            لا تنتظر. احجز فحصك في أي فرع أو اطلب خدمة الفحص المنزلي. النتائج جاهزة خلال ساعات.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/ar/register"
              className="flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-bold text-[#023E8A] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              احجز موعدك الآن
              <svg className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <a
              href="tel:+966501234567"
              className="flex items-center gap-2 rounded-xl border-2 border-white/30 px-10 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              اتصل بنا
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-white/50 text-sm">
            <span className="flex items-center gap-2">📞 +966 50 123 4567</span>
            <span className="flex items-center gap-2">📧 info@almokhtabar.com</span>
            <span className="flex items-center gap-2">🏢 45 فرع في المملكة</span>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 11. CONTACT SECTION
// ============================================================
function ContactSection() {
  return (
    <Section id="تواصل-معنا" className="py-20 lg:py-28">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900">
            تواصل <span className="text-brand-600">معنا</span>
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-white p-8 shadow-sm border border-surface-100"
          >
            <form className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">الاسم</label>
                  <input className="w-full rounded-xl border border-surface-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">البريد الإلكتروني</label>
                  <input type="email" className="w-full rounded-xl border border-surface-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">الرسالة</label>
                <textarea rows={4} className="w-full rounded-xl border border-surface-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none" />
              </div>
              <button
                type="button"
                className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                إرسال الرسالة
              </button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {[
              { icon: '📍', title: 'العنوان', value: 'الرياض، المملكة العربية السعودية' },
              { icon: '📞', title: 'الهاتف', value: '+966 50 123 4567' },
              { icon: '📧', title: 'البريد', value: 'info@almokhtabar.com' },
              { icon: '⏰', title: 'ساعات العمل', value: 'السبت - الخميس: 7 صباحاً - 10 مساءً' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-xl bg-surface-50 p-5">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-surface-900">{item.title}</p>
                  <p className="text-sm text-surface-500 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              {['𝕏', 'IG', 'FB', 'YT', 'WA'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-sm font-bold text-surface-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}

// ============================================================
// 12. FOOTER
// ============================================================
function PremiumFooter() {
  const columns = [
    {
      title: 'المختبر',
      links: ['من نحن', 'الفروع', 'الوظائف', 'الأخبار', 'تواصل معنا'],
    },
    {
      title: 'الخدمات',
      links: ['تحليل الدم', 'التحاليل الكيميائية', 'التحاليل الهرمونية', 'البكتريولوجيا', 'المناعة'],
    },
    {
      title: 'المرضى',
      links: ['حجز موعد', 'تصفح التحاليل', 'طلباتي', 'تقاريري', 'الفواتير'],
    },
    {
      title: 'الدعم',
      links: ['الأسئلة الشائعة', 'الشروط والأحكام', 'سياسة الخصوصية', 'الإبلاغ عن مشكلة'],
    },
  ];

  return (
    <footer className="bg-[#023E8A] text-white">
      <Container className="py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <svg className="h-5 w-5 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 3L9 11M15 3L15 11M6 11L6 19C6 21 9 23 12 23C15 23 18 21 18 19L18 11M6 11H18" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-lg font-bold">المختبر</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              معامل تحليل طبي معتمدة دولياً تقدم أكثر من 500 فحص مخبري في 45 فرع بالمملكة.
            </p>
            <div className="mt-6 flex gap-3">
              {['App Store', 'Google Play'].map((store) => (
                <a
                  key={store}
                  href="#"
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
                >
                  {store === 'App Store' ? '🍎' : '▶️'} {store}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © 2026 المختبر — Al Mokhtabar. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40">🏅 ISO 15189 | 🏆 CAP | 📋 ZATCA</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

// ============================================================
// MAIN HOMEPAGE
// ============================================================
export default function HomePage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const [loading, setLoading] = React.useState(true);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && <Preloader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <main>
          <Navigation scrolled={scrolled} />
          <HeroSection />
          <TrustIndicators />
          <StatisticsSection />
          <ServicesSection />
          <HomeVisitSection />
          <WhyChooseSection />
          <TestimonialsSection />
          <BookingCTASection />
          <ContactSection />
          <PremiumFooter />
        </main>
      )}
    </>
  );
}
