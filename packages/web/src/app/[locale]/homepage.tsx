'use client';

import * as React from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Microscope, TestTube2, Activity, Dna, Droplets, Shield, Clock,
  MapPin, Phone, Mail, Calendar, ChevronLeft, ChevronRight, Star,
  Award, Zap, Users, Target, TrendingUp, ArrowRight, Heart, Quote,
  FlaskConical, Stethoscope, BadgeCheck, Sparkles, ChevronDown,
  ArrowUpRight, CheckCircle2, Globe, Search, Menu, X,
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

const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

function Section({ children, className = '', id, bg = 'white' }: {
  children: React.ReactNode; className?: string; id?: string; bg?: string;
}) {
  const bgMap: Record<string, string> = {
    white: 'bg-white dark:bg-gray-950',
    light: 'bg-gray-50/80 dark:bg-gray-900/80',
    dark: 'bg-gradient-to-br from-[#023E8A] via-brand-600 to-accent-500 text-white',
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

function AnimatedCounter({ end, suffix = '', duration = 2 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = React.useState(0);
  const [inView, setInView] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!inView) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);

  return <div ref={ref}>{count.toLocaleString('en-US')}{suffix}</div>;
}

function GlassCard({ children, className = '', hover = true }: {
  children: React.ReactNode; className?: string; hover?: boolean;
}) {
  return (
    <div className={`relative rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl ${hover ? 'hover:bg-white/15 hover:border-white/30 hover:shadow-white/10 transition-all duration-500' : ''} ${className}`}>
      {children}
    </div>
  );
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
      <header className={`fixed top-0 inset-x-0 z-[100] transition-all duration-700 ${
        scrolled
          ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-3xl border-b border-white/10 shadow-xl shadow-black/5'
          : 'bg-transparent'
      }`}>
        <Container>
          <div className="flex h-16 items-center justify-between lg:h-20">
            <Link href={`/${locale}`} className="flex items-center gap-3 group">
              <motion.div whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30">
                <TestTube2 className="h-5 w-5" />
              </motion.div>
              <div className="flex flex-col">
                <span className={`text-lg font-extrabold leading-tight transition-colors ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
                  المختبر
                </span>
                <span className={`text-[10px] font-medium leading-tight transition-colors ${scrolled ? 'text-gray-400' : 'text-white/50'}`}>
                  Al Mokhtabar
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <a key={item} href={`#${item}`} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  scrolled
                    ? 'text-gray-600 hover:text-sky-600 hover:bg-sky-50 dark:text-gray-300 dark:hover:text-sky-400 dark:hover:bg-sky-500/10'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}>{item}</a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link href={`/${locale}/register`}
                className="relative flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] overflow-hidden group">
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Calendar className="h-4 w-4 relative z-10" />
                <span className="relative z-10">احجز الآن</span>
              </Link>
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className={`lg:hidden rounded-xl p-2.5 transition-colors ${scrolled ? 'text-gray-700 dark:text-white hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </Container>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 z-[99] bg-white/95 dark:bg-gray-950/95 backdrop-blur-3xl lg:hidden">
            <Container className="py-8">
              <nav className="flex flex-col gap-2">
                {navItems.map((item, i) => (
                  <motion.a key={item} href={`#${item}`}
                    initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, type: 'spring' }}
                    className="py-4 px-6 text-xl font-bold text-gray-900 dark:text-white rounded-2xl hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors"
                    onClick={() => setMobileOpen(false)}>
                    {item}
                  </motion.a>
                ))}
                <motion.a href={`/${locale}/register`}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-cyan-500 px-8 py-4 text-lg font-bold text-white shadow-xl"
                  onClick={() => setMobileOpen(false)}>
                  <Calendar className="h-5 w-5" />احجز موعدك الآن
                </motion.a>
              </nav>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// 2. PREMIUM HERO SECTION
// ============================================================
function HeroSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 300]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0]);
  const scale = useTransform(scrollY, [0, 600], [1, 0.95]);

  const heroLetters = 'المختبر'.split('');

  const stats = [
    { value: 50000, suffix: '+', label: 'مريض سعيد' },
    { value: 999, suffix: '%', label: 'دقة النتائج' },
    { value: 24, suffix: '/7', label: 'دعم متواصل' },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#023E8A] via-[#0077B6] to-[#00B4D8]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(6,182,212,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(14,165,233,0.25),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(20,184,166,0.2),transparent_60%)]" />
      </div>

      {/* Mesh grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />

      {/* Floating orbs */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full bg-white/5"
          style={{
            width: Math.random() * 200 + 30,
            height: Math.random() * 200 + 30,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ y: [0, -50, 0], x: [0, 30, 0], opacity: [0.02, 0.08, 0.02] }}
          transition={{ duration: Math.random() * 8 + 6, repeat: Infinity, delay: Math.random() * 5, ease: 'easeInOut' }}
        />
      ))}

      {/* Floating lab equipment icons */}
      {[
        { icon: <Microscope className="w-8 h-8" />, left: '10%', top: '20%', delay: 0 },
        { icon: <TestTube2 className="w-7 h-7" />, left: '85%', top: '15%', delay: 1.5 },
        { icon: <FlaskConical className="w-6 h-6" />, left: '75%', top: '70%', delay: 0.8 },
        { icon: <Dna className="w-7 h-7" />, left: '15%', top: '75%', delay: 2 },
        { icon: <Activity className="w-6 h-6" />, left: '50%', top: '10%', delay: 1.2 },
        { icon: <Heart className="w-6 h-6" />, left: '90%', top: '45%', delay: 0.5 },
        { icon: <Stethoscope className="w-7 h-7" />, left: '5%', top: '50%', delay: 1.8 },
        { icon: <Shield className="w-6 h-6" />, left: '65%', top: '85%', delay: 2.5 },
      ].map((item, i) => (
        <motion.div key={i}
          className="absolute text-white/10"
          style={{ left: item.left, top: item.top }}
          animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, delay: item.delay, ease: 'easeInOut' }}>
          {item.icon}
        </motion.div>
      ))}

      <motion.div style={{ y, opacity, scale }} className="relative z-10 w-full">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-32 lg:py-0">
            <div className="text-white">
              {/* Badge */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring' }}
                className="inline-flex items-center gap-2.5 rounded-full bg-white/10 backdrop-blur-sm px-5 py-2.5 text-sm font-medium border border-white/20 mb-10 shadow-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                أحدث الأجهزة والتقنيات الطبية في مصر
              </motion.div>

              {/* Main title with staggered letter animation */}
              <div className="mb-6">
                <motion.h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[1.1] tracking-tight">
                  {heroLetters.map((letter, i) => (
                    <motion.span key={i}
                      initial={{ opacity: 0, y: 50, rotateX: -90 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ delay: 0.5 + i * 0.12, duration: 0.6, type: 'spring', stiffness: 100 }}
                      className="inline-block">
                      {letter}
                    </motion.span>
                  ))}
                </motion.h1>
              </div>

              {/* Subtitle with typewriter effect */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mb-8">
                <TypewriterText text="منصة التحاليل الطبية الأكثر تطوراً في مصر" delay={1.4} />
              </motion.div>

              {/* Stats counter */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
                className="flex flex-wrap gap-6 mb-12">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="flex flex-col items-center px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                    <div className="text-2xl lg:text-3xl font-black text-white">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2.5} />
                    </div>
                    <div className="text-xs text-white/60 font-medium mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* CTA buttons */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}
                className="flex flex-wrap gap-4">
                <Link href={`/${locale}/register`}
                  className="group relative flex items-center gap-3 rounded-2xl bg-white px-10 py-5 text-base font-extrabold text-[#023E8A] shadow-2xl hover:shadow-white/20 transition-all duration-500 hover:scale-[1.03] active:scale-[0.97] overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-teal-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <Calendar className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">احجز موعدك الآن</span>
                  <ArrowUpRight className="h-4 w-4 relative z-10 group-hover:rotate-45 transition-transform duration-300" />
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/30 to-teal-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
                <Link href={`/${locale}/patient/tests`}
                  className="flex items-center gap-2 rounded-2xl border-2 border-white/25 px-8 py-5 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:border-white/50 hover:scale-[1.02]">
                  تصفح التحاليل
                </Link>
              </motion.div>

              {/* Trust badges */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2 }}
                className="mt-12 flex flex-wrap gap-3">
                {[
                  { icon: <BadgeCheck className="h-4 w-4" />, label: 'ISO 15189' },
                  { icon: <Star className="h-4 w-4" />, label: 'تقييم 4.9' },
                  { icon: <Zap className="h-4 w-4" />, label: '+15,000 فحص شهرياً' },
                  { icon: <Globe className="h-4 w-4" />, label: 'معتمد دولياً' },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2.5 border border-white/10 hover:bg-white/15 transition-colors duration-300">
                    <span className="text-cyan-300">{b.icon}</span>
                    <span className="text-sm font-medium text-white/80">{b.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right side floating cards */}
            <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.6, duration: 0.9, type: 'spring' }} className="hidden lg:flex items-center justify-center">
              <div className="relative">
                {/* Main glass card */}
                <GlassCard className="relative w-[440px] h-[440px] p-8 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl" />
                  <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                    <Microscope className="w-36 h-36 text-white/90 mb-6" strokeWidth={0.8} />
                  </motion.div>
                  <p className="text-4xl font-black text-white mb-1">500+</p>
                  <p className="text-sm text-white/60 font-medium">فحص مخبري متخصص</p>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-teal-500 to-cyan-500 rounded-t-3xl" />
                </GlassCard>

                {/* Floating mini cards */}
                <motion.div className="absolute -top-8 -right-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-5 shadow-2xl"
                  animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">جهاز تحليل الدم الآلي</p>
                      <p className="text-xs text-white/50">نتائج خلال 30 دقيقة</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="absolute -bottom-8 -left-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-5 shadow-2xl"
                  animate={{ y: [0, 15, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1, ease: 'easeInOut' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                      <Dna className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">جهاز PCR عالي الدقة</p>
                      <p className="text-xs text-white/50">دقة 99.9%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="absolute top-1/2 -left-12 -translate-y-1/2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-5 shadow-2xl"
                  animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">معتمد دولياً</p>
                      <p className="text-xs text-white/50">ISO & CAP</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="absolute top-1/2 -right-12 -translate-y-1/2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-5 shadow-2xl"
                  animate={{ y: [0, 10, 0] }} transition={{ duration: 3.8, repeat: Infinity, delay: 1.5, ease: 'easeInOut' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">أحدث التقنيات</p>
                      <p className="text-xs text-white/50">مستوى عالمي</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Container>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-3">
          <span className="text-xs text-white/40 font-medium tracking-wider">اكتشف المزيد</span>
          <motion.div className="w-7 h-11 rounded-full border-2 border-white/25 flex items-start justify-center p-2">
            <motion.div animate={{ y: [0, 14, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// Typewriter effect component
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = React.useState('');
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  React.useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [started, text]);

  return (
    <p className="text-xl sm:text-2xl text-white/70 max-w-lg leading-relaxed font-medium">
      {displayed}
      {started && displayed.length < text.length && (
        <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-0.5 h-6 bg-cyan-400 ml-1 align-middle" />
      )}
    </p>
  );
}

// ============================================================
// 3. LAB DEVICES SHOWCASE — PREMIUM CAROUSEL
// ============================================================
function LabDevicesSection() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  const devices = [
    { name: 'جهاز تحليل الدم الآلي', desc: 'تحليل شامل لعناصر الدم بنتائج دقيقة خلال 30 دقيقة فقط', icon: <Activity className="h-8 w-8" />, gradient: 'from-red-500 to-pink-600', shadow: 'shadow-red-500/20' },
    { name: 'جهاز التحليل الكيميائي التلقائي', desc: 'قياس مستويات السكر والكوليسترول والإنزيمات بدقة عالية', icon: <TestTube2 className="h-8 w-8" />, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
    { name: 'مجهر رقمي ذكي', desc: 'فحص عينات الدم والأنسجة بتقنية رقمية متطورة ودقة عالية', icon: <Microscope className="h-8 w-8" />, gradient: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20' },
    { name: 'جهاز PCR عالي الدقة', desc: 'كشف الأمراض والعدوى بدقة 99.9% في وقت قياسي', icon: <Dna className="h-8 w-8" />, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
    { name: 'جهاز تحليل البول الآلي', desc: 'تحليل شامل ودقيق لعينات البول بأحدث التقنيات العالمية', icon: <Droplets className="h-8 w-8" />, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
    { name: 'جهاز التحليل المناعي', desc: 'قياس الأجسام المضادة وأضداد الفيروسات والبكتيريا بدقة', icon: <Shield className="h-8 w-8" />, gradient: 'from-cyan-500 to-sky-600', shadow: 'shadow-cyan-500/20' },
    { name: 'جهاز قياس الهرمونات', desc: 'قياس مستويات الهرمونات بدقة فائقة لتشخيص شامل وشامل', icon: <TrendingUp className="h-8 w-8" />, gradient: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/20' },
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
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 360 : -360, behavior: 'smooth' });
  };

  return (
    <Section id="الأجهزة" bg="light" className="py-24 lg:py-32">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.05),transparent_70%)]" />

      <Container>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2.5 rounded-full bg-sky-50 dark:bg-sky-500/10 px-5 py-2.5 text-sm font-semibold text-sky-600 dark:text-sky-400 mb-5 border border-sky-100 dark:border-sky-500/20">
            <Microscope className="h-4 w-4" />أحدث الأجهزة الطبية
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
            أجهزتنا <span className="bg-gradient-to-r from-sky-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">المتطورة</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            نستخدم أحدث الأجهزة والتقنيات الطبية المعتمدة دولياً لضمان دقة النتائج
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 mx-auto w-24 h-1 bg-gradient-to-r from-sky-500 via-teal-500 to-cyan-500 rounded-full" />
        </motion.div>
      </Container>

      {/* Carousel controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex justify-end gap-3">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => scroll('right')} className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm">
          <ChevronRight className="h-5 w-5" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => scroll('left')} className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm">
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Scrollable carousel */}
      <div ref={scrollRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
        className={`flex gap-6 overflow-x-auto pb-8 px-4 sm:px-6 lg:px-8 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollbarWidth: 'none' as const }}>
        <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
        <div className="shrink-0 w-0 lg:w-[calc((100vw-1280px)/2)]" />
        {devices.map((d, i) => (
          <motion.div key={d.name} initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 100 }}
            className="shrink-0 w-[300px] sm:w-[340px]">
            <motion.div whileHover={{ scale: 1.03, y: -8 }} whileTap={{ scale: 0.98 }}
              className="group relative rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-7 h-[340px] flex flex-col justify-between hover:shadow-2xl transition-all duration-500 overflow-hidden">
              {/* Gradient top border */}
              <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${d.gradient} rounded-t-3xl`} />
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${d.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />

              <div className="relative z-10">
                <motion.div whileHover={{ rotate: 12 }}
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${d.gradient} text-white shadow-xl ${d.shadow} mb-6`}>
                  {d.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{d.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{d.desc}</p>
              </div>

              <div className="relative z-10 flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-400 group-hover:gap-3 transition-all duration-300">
                <span>اعرف المزيد</span>
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </motion.div>
          </motion.div>
        ))}
        <div className="shrink-0 w-0 lg:w-[calc((100vw-1280px)/2)]" />
      </div>
    </Section>
  );
}

function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

// ============================================================
// 4. SERVICES — PREMIUM GRID
// ============================================================
function ServicesSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const services = [
    {
      icon: <FlaskConical className="h-7 w-7" />,
      title: 'التحاليل المخبرية الشاملة',
      desc: 'أكثر من 500 فحص مخبري شامل في مختلف التخصصات الطبية مع نتائج دقيقة وموثوقة خلال ساعات قليلة',
      gradient: 'from-sky-500 to-blue-600',
      shadow: 'shadow-sky-500/25',
      link: '#',
    },
    {
      icon: <Stethoscope className="h-7 w-7" />,
      title: 'الفحص المنزلي',
      desc: 'خدمة فحص منزلي على مدار الساعة مع فريق طبي معتمد ومعدات متطورة في راحة منزلك',
      gradient: 'from-teal-500 to-emerald-600',
      shadow: 'shadow-teal-500/25',
      link: '#',
    },
    {
      icon: <Calendar className="h-7 w-7" />,
      title: 'حجز المواعيد الإلكترونية',
      desc: 'احجز موعدك بسهولة عبر الإنترنت واختار الفرع والوقت المناسب لك بدون انتظار',
      gradient: 'from-cyan-500 to-sky-600',
      shadow: 'shadow-cyan-500/25',
      link: `/${locale}/register`,
    },
  ];

  return (
    <Section id="الخدمات" className="py-24 lg:py-32">
      <Container>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-20">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2.5 rounded-full bg-teal-50 dark:bg-teal-500/10 px-5 py-2.5 text-sm font-semibold text-teal-600 dark:text-teal-400 mb-5 border border-teal-100 dark:border-teal-500/20">
            <Sparkles className="h-4 w-4" />خدماتنا المتكاملة
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
            خدماتنا <span className="bg-gradient-to-r from-teal-500 via-sky-500 to-cyan-500 bg-clip-text text-transparent">المخبرية</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            نقدم مجموعة شاملة من الخدمات المخبرية عالية الجودة بأحدث التقنيات
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 mx-auto w-24 h-1 bg-gradient-to-r from-teal-500 via-sky-500 to-cyan-500 rounded-full" />
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((s) => (
            <motion.div key={s.title} variants={scaleIn}>
              <Link href={s.link} className="block group">
                <motion.div whileHover={{ scale: 1.03, y: -8 }} whileTap={{ scale: 0.98 }}
                  className="relative rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-9 h-full hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  {/* Top gradient line */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${s.gradient} rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  {/* Hover overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-3xl`} />

                  <div className="relative z-10">
                    <motion.div whileHover={{ rotate: 12, scale: 1.1 }}
                      className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-xl ${s.shadow} mb-7`}>
                      {s.icon}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{s.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">{s.desc}</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-sky-600 dark:text-sky-400 group-hover:gap-3 transition-all duration-300">
                      <span>اعرف المزيد</span>
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 5. WHY CHOOSE US — ANIMATED FEATURES
// ============================================================
function WhyChooseSection() {
  const reasons = [
    { icon: <Target className="h-7 w-7" />, title: 'دقة النتائج 99.9%', desc: 'نظام ضمان جودة متعدد الطبقات يضمن دقة فائقة في جميع النتائج المخبرية', color: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/25' },
    { icon: <Zap className="h-7 w-7" />, title: 'سرعة التحويل خلال ساعات', desc: 'نتائج جاهزة خلال 2-24 ساعة حسب نوع الفحص مع إشعارات فورية', color: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/25' },
    { icon: <Users className="h-7 w-7" />, title: 'فريق طبي متخصص', desc: 'أطباء وفنيون مختبرات معتمدون بخبرة تزيد عن 15 عاماً في مجال التحاليل', color: 'from-cyan-500 to-sky-600', shadow: 'shadow-cyan-500/25' },
    { icon: <Microscope className="h-7 w-7" />, title: 'أحدث الأجهزة العالمية', desc: 'أجهزة مخبرية من أفضل الماركات العالمية مع صيانة دورية وتحديث مستمر', color: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/25' },
  ];

  return (
    <Section id="لماذا نحن" bg="light" className="py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.05),transparent_60%)]" />

      <Container>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-20">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2.5 rounded-full bg-sky-50 dark:bg-sky-500/10 px-5 py-2.5 text-sm font-semibold text-sky-600 dark:text-sky-400 mb-5 border border-sky-100 dark:border-sky-500/20">
            <Award className="h-4 w-4" />لماذا المختبر؟
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
            لماذا <span className="bg-gradient-to-r from-sky-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">تختارنا</span>؟
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            نلتزم بأعلى معايير الجودة لتقديم أفضل خدمات التحاليل الطبية
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 mx-auto w-24 h-1 bg-gradient-to-r from-sky-500 via-teal-500 to-cyan-500 rounded-full" />
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((r, i) => (
            <motion.div key={r.title} variants={fadeUp}>
              <motion.div whileHover={{ scale: 1.04, y: -10 }} whileTap={{ scale: 0.97 }}
                className="group relative rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 text-center hover:shadow-2xl transition-all duration-500 overflow-hidden">
                {/* Number badge */}
                <div className="absolute -top-3 -left-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-xs font-black text-gray-500 dark:text-gray-400 shadow-md">
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Pulse animation behind icon */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2">
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                    className={`h-20 w-20 rounded-full bg-gradient-to-br ${r.color} opacity-20`} />
                </div>

                <div className="relative z-10">
                  <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}
                    className={`inline-flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br ${r.color} text-white shadow-xl ${r.shadow} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {r.icon}
                  </motion.div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{r.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{r.desc}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 6. BRANCHES — MAP-LIKE SECTION
// ============================================================
function BranchesSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const branches = [
    { name: 'فرع التجمع الخامس', address: 'التجمع الخامس، القاهرة', hours: 'السبت - الخميس: 8 ص - 10 م', phone: '02281234567', isMain: true },
    { name: 'فرع مدينة نصر', address: 'شارع مصطفى النحاس، مدينة نصر', hours: 'السبت - الخميس: 7 ص - 11 م', phone: '02227345678', isMain: false },
    { name: 'فرع المعادي', address: 'شارع 9، المعادي، القاهرة', hours: 'السبت - الخميس: 8 ص - 10 م', phone: '02251987654', isMain: false },
  ];

  return (
    <Section id="الفروع" className="py-24 lg:py-32">
      <Container>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-20">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2.5 rounded-full bg-teal-50 dark:bg-teal-500/10 px-5 py-2.5 text-sm font-semibold text-teal-600 dark:text-teal-400 mb-5 border border-teal-100 dark:border-teal-500/20">
            <MapPin className="h-4 w-4" />فروعنا
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
            فروعنا <span className="bg-gradient-to-r from-teal-500 via-sky-500 to-cyan-500 bg-clip-text text-transparent">قريبة منك</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            فروع منتشرة في مختلف أنحاء القاهرة لخدمتك
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 mx-auto w-24 h-1 bg-gradient-to-r from-teal-500 via-sky-500 to-cyan-500 rounded-full" />
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches.map((b) => (
            <motion.div key={b.name} variants={fadeUp}>
              <motion.div whileHover={{ scale: 1.03, y: -8 }} whileTap={{ scale: 0.98 }}
                className={`relative rounded-3xl bg-white dark:bg-gray-900 border p-8 transition-all duration-500 hover:shadow-2xl overflow-hidden ${
                  b.isMain ? 'border-sky-200 dark:border-sky-500/30 ring-2 ring-sky-500/10' : 'border-gray-100 dark:border-gray-800'
                }`}>
                {b.isMain && (
                  <div className="absolute top-0 right-8 rounded-b-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg">
                    الفرع الرئيسي
                  </div>
                )}

                <div className="mb-6">
                  <motion.div whileHover={{ rotate: 12 }}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-xl shadow-sky-500/20 mb-5">
                    <MapPin className="h-6 w-6" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{b.name}</h3>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{b.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{b.hours}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    <p className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">{b.phone}</p>
                  </div>
                </div>

                <Link href={`/${locale}/register`}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition-all duration-300 hover:scale-[1.02]">
                  <Calendar className="h-4 w-4" />احجز في هذا الفرع
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 7. TESTIMONIALS — CAROUSEL
// ============================================================
function TestimonialsSection() {
  const [active, setActive] = React.useState(0);

  const testimonials = [
    {
      name: 'أحمد محمد',
      text: 'تجربة رائعة جداً! النتائج كانت دقيقة جداً ووصلتني في وقت قياسي. الطاقم الطبي كان محترف ومتعاون بشكل كبير. أنصح الجميع بزيارة المختبر.',
      rating: 5,
      location: 'القاهرة',
    },
    {
      name: 'سارة علي',
      text: 'خدمة ممتازة ومحترفة. الفحص المنزلي كان في الموعد المحدد بالضبط والطاقم كان مجهز بأحدث المعدات. سعيدة جداً بالخدمة.',
      rating: 5,
      location: 'الإسكندرية',
    },
    {
      name: 'محمد حسن',
      text: 'من أفضل مراكز التحاليل الطبية في مصر. الأجهزة حديثة والنتائج موثوقة. التطبيق سهل الاستخدام والحجز عبر الإنترنت مريح جداً.',
      rating: 5,
      location: 'الجيزة',
    },
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <Section bg="light" className="py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.05),transparent_60%)]" />

      <Container>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-20">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2.5 rounded-full bg-sky-50 dark:bg-sky-500/10 px-5 py-2.5 text-sm font-semibold text-sky-600 dark:text-sky-400 mb-5 border border-sky-100 dark:border-sky-500/20">
            <Quote className="h-4 w-4" />شهادات عملائنا
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
           ماذا يقول <span className="bg-gradient-to-r from-sky-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">عملاؤنا</span>
          </motion.h2>
          <motion.div variants={fadeUp} className="mt-6 mx-auto w-24 h-1 bg-gradient-to-r from-sky-500 via-teal-500 to-cyan-500 rounded-full" />
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <div className="relative rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-10 lg:p-14 text-center shadow-2xl">
                {/* Quote icon */}
                <div className="absolute top-8 right-8">
                  <Quote className="h-12 w-12 text-sky-100 dark:text-sky-900/50" />
                </div>

                {/* Stars */}
                <div className="flex items-center justify-center gap-1 mb-8">
                  {Array.from({ length: testimonials[active].rating }).map((_, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.05 }}>
                      <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                    </motion.div>
                  ))}
                </div>

                {/* Quote text */}
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="text-xl lg:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed mb-8 font-medium">
                  "{testimonials[active].text}"
                </motion.p>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {testimonials[active].name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 dark:text-white">{testimonials[active].name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonials[active].location}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex items-center justify-center gap-3 mt-8">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === active ? 'w-8 h-3 bg-gradient-to-r from-sky-500 to-teal-500' : 'w-3 h-3 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                }`} />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ============================================================
// 8. BOOKING CTA — PREMIUM
// ============================================================
function BookingCTASection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  return (
    <Section bg="dark" className="py-28 lg:py-36">
      {/* Animated background particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full bg-white/5"
          style={{
            width: Math.random() * 150 + 20,
            height: Math.random() * 150 + 20,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ y: [0, -30, 0], opacity: [0.02, 0.08, 0.02] }}
          transition={{ duration: Math.random() * 6 + 4, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      {/* Decorative shapes */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <Container className="relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center">
          <motion.div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-white/80 mb-8 border border-white/15">
            <Calendar className="h-4 w-4" />احجز الآن
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight">
            احجز موعدك <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">الآن</span>
          </h2>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            لا تنتظر. احجز فحصك في أي فرع أو اطلب خدمة الفحص المنزلي. النتائج جاهزة خلال ساعات.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 mb-14">
            <Link href={`/${locale}/register`}
              className="group relative flex items-center gap-3 rounded-2xl bg-white px-12 py-5 text-lg font-extrabold text-[#023E8A] shadow-2xl hover:shadow-white/20 transition-all duration-500 hover:scale-[1.03] active:scale-[0.97] overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-teal-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Calendar className="h-6 w-6 relative z-10" />
              <span className="relative z-10">احجز موعدك الآن</span>
              <ArrowUpRight className="h-5 w-5 relative z-10 group-hover:rotate-45 transition-transform duration-300" />
              <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
            <a href="tel:+202281234567"
              className="flex items-center gap-2 rounded-2xl border-2 border-white/25 px-10 py-5 text-lg font-semibold text-white hover:bg-white/10 transition-all duration-500 hover:border-white/50 hover:scale-[1.02]">
              <Phone className="h-5 w-5" />اتصل بنا
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-10 text-white/50 text-sm">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/5 border border-white/10">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>السبت - الخميس: 7 صباحاً - 10 مساءً</span>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/5 border border-white/10">
              <Phone className="h-4 w-4 text-cyan-400" />
              <span dir="ltr">02281234567</span>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/5 border border-white/10">
              <Mail className="h-4 w-4 text-cyan-400" />
              <span>info@almokhtabar.com</span>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}

// ============================================================
// 9. FOOTER — PREMIUM
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

  const socialIcons = [
    { label: 'X', href: '#' },
    { label: 'IG', href: '#' },
    { label: 'FB', href: '#' },
    { label: 'YT', href: '#' },
    { label: 'WA', href: '#' },
  ];

  return (
    <footer className="bg-gray-950 text-white">
      <Container className="py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-teal-500 to-cyan-500 text-white shadow-xl shadow-sky-500/20">
                <TestTube2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold">المختبر</span>
                <span className="block text-xs text-gray-400 font-medium">Al Mokhtabar</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-sm">
              معامل تحليل طبي معتمدة دولياً تقدم أكثر من 500 فحص مخبري في مختلف الفروع. نلتزم بأعلى معايير الجودة والدقة.
            </p>
            <div className="flex gap-3">
              {socialIcons.map((s) => (
                <motion.a key={s.label} href={s.href} whileHover={{ scale: 1.15, y: -3 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800/80 text-xs font-bold text-gray-400 hover:bg-gradient-to-br hover:from-sky-500 hover:to-teal-500 hover:text-white transition-all duration-300 shadow-md">
                  {s.label}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300 hover:translate-x-1 inline-block">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t border-gray-800/80">
        <Container className="py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 font-medium">© 2026 المختبر — Al Mokhtabar. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-5 text-xs text-gray-500">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50">
                <BadgeCheck className="h-3.5 w-3.5 text-cyan-400" />ISO 15189
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50">
                <Award className="h-3.5 w-3.5 text-cyan-400" />CAP
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />ZATCA
              </span>
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
      <WhyChooseSection />
      <BranchesSection />
      <TestimonialsSection />
      <BookingCTASection />
      <FooterSection />
    </main>
  );
}
