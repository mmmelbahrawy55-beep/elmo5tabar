'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Microscope, TestTube2, Activity, Dna, Droplets, Shield, Clock,
  MapPin, Phone, Mail, Calendar, ChevronLeft, ChevronRight, Star,
  Award, Zap, Users, Target, TrendingUp, ArrowRight, Heart, Quote,
  FlaskConical, Stethoscope, BadgeCheck, Sparkles, ChevronDown,
  ArrowUpRight, CheckCircle2, Globe, Menu, X,
} from 'lucide-react';

/* ============================================================
   CONSTANTS & ANIMATION VARIANTS
   ============================================================ */

const spring = { type: 'spring' as const, damping: 25, stiffness: 120 };

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: spring },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: spring },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: spring },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: spring },
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: spring },
};

/* ============================================================
   REUSABLE COMPONENTS
   ============================================================ */

function Section({ children, className = '', id }: {
  children: React.ReactNode; className?: string; id?: string;
}) {
  return (
    <section id={id} className={`relative overflow-hidden ${className}`}>
      {children}
    </section>
  );
}

function Container({ children, className = '' }: {
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/* ============================================================
   ANIMATED COUNTER
   ============================================================ */

function AnimatedCounter({ end, suffix = '', duration = 2 }: {
  end: number; suffix?: string; duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    let raf: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isInView, end, duration]);

  return (
    <div ref={ref}>
      {count.toLocaleString('en-US')}{suffix}
    </div>
  );
}

/* ============================================================
   SECTION TITLE (Reusable)
   ============================================================ */

function SectionTitle({ badge, badgeIcon, title, gradient, subtitle }: {
  badge: string; badgeIcon: React.ReactNode; title: string;
  gradient: string; subtitle: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="text-center mb-20"
    >
      <motion.div
        variants={fadeUp}
        className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-[#38bdf8] mb-5 border border-white/[0.06]"
      >
        {badgeIcon}
        {badge}
      </motion.div>
      <motion.h2
        variants={fadeUp}
        className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#e2e8f0] mb-4"
      >
        {title.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i === 0 && <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}> </span>}
          </span>
        ))}
      </motion.h2>
      <motion.p variants={fadeUp} className="text-lg text-[#94a3b8] max-w-2xl mx-auto">
        {subtitle}
      </motion.p>
      <motion.div
        variants={fadeUp}
        className="mt-6 mx-auto w-24 h-1 rounded-full"
        style={{ background: `linear-gradient(to right, ${gradient.includes('sky') ? '#38bdf8' : '#2dd4bf'}, ${gradient.includes('teal') ? '#2dd4bf' : '#38bdf8'})` }}
      />
    </motion.div>
  );
}

/* ============================================================
   1. NAVIGATION
   ============================================================ */

function Navigation({ scrolled }: { scrolled: boolean }) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = ['الخدمات', 'الأجهزة', 'الفروع', 'لماذا نحن'];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-[100] transition-all duration-700 ${
          scrolled
            ? 'bg-[#0a0a0f]/80 backdrop-blur-3xl border-b border-white/[0.06] shadow-xl shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <Container>
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={spring}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38bdf8] via-[#2dd4bf] to-[#38bdf8] text-white shadow-lg shadow-[#38bdf8]/20"
              >
                <TestTube2 className="h-5 w-5" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold leading-tight text-[#e2e8f0]">
                  المختبر
                </span>
                <span className="text-[10px] font-medium leading-tight text-[#94a3b8]">
                  Al Mokhtabar
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item}`}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-[#38bdf8] hover:bg-white/[0.04] transition-all duration-300"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* CTA + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/register`}
                className="relative flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] px-6 py-2.5 text-sm font-bold text-[#0a0a0f] shadow-lg shadow-[#38bdf8]/20 hover:shadow-[#38bdf8]/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] overflow-hidden group"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Calendar className="h-4 w-4 relative z-10" />
                <span className="relative z-10">احجز الآن</span>
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden rounded-xl p-2.5 text-[#94a3b8] hover:bg-white/[0.04] transition-colors"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 z-[99] bg-[#0a0a0f]/95 backdrop-blur-3xl lg:hidden"
          >
            <Container className="py-8">
              <nav className="flex flex-col gap-2">
                {navItems.map((item, i) => (
                  <motion.a
                    key={item}
                    href={`#${item}`}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, ...spring }}
                    className="py-4 px-6 text-xl font-bold text-[#e2e8f0] rounded-2xl hover:bg-white/[0.04] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item}
                  </motion.a>
                ))}
                <motion.a
                  href={`/${locale}/register`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] px-8 py-4 text-lg font-bold text-[#0a0a0f] shadow-xl"
                  onClick={() => setMobileOpen(false)}
                >
                  <Calendar className="h-5 w-5" />
                  احجز موعدك الآن
                </motion.a>
              </nav>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
   2. HERO — CINEMATIC EXPERIENCE
   ============================================================ */

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
    { value: 999, suffix: '.9%', label: 'دقة النتائج' },
    { value: 15, suffix: '+', label: 'سنة خبرة' },
    { value: 24, suffix: '/7', label: 'دعم متواصل' },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Deep dark base */}
      <div className="absolute inset-0 bg-[#0a0a0f]" />

      {/* Animated gradient orbs — slow 20s+ cycles */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)', top: '-20%', left: '-10%' }}
        animate={{ x: [0, 80, 0], y: [0, 60, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #2dd4bf, transparent 70%)', bottom: '-15%', right: '-5%' }}
        animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #34d399, transparent 70%)', top: '40%', right: '30%' }}
        animate={{ x: [0, 40, 0], y: [0, -50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Floating micro-particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[#38bdf8]/[0.03]"
          style={{
            width: Math.random() * 150 + 20,
            height: Math.random() * 150 + 20,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ y: [0, -40, 0], x: [0, 20, 0], opacity: [0.01, 0.05, 0.01] }}
          transition={{ duration: Math.random() * 10 + 8, repeat: Infinity, delay: Math.random() * 5, ease: 'easeInOut' }}
        />
      ))}

      <motion.div style={{ y, opacity, scale }} className="relative z-10 w-full">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-32 lg:py-0">
            {/* Left Content */}
            <div>
              {/* Status Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ...spring }}
                className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-[#94a3b8] border border-white/[0.06] mb-10"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                </span>
                أحدث الأجهزة والتقنيات الطبية في مصر
              </motion.div>

              {/* Main Title — Letter-by-letter stagger 0.03s */}
              <div className="mb-6">
                <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[1.1] text-[#e2e8f0]">
                  {heroLetters.map((letter, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 50, rotateX: -90 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ delay: 0.5 + i * 0.03, ...spring }}
                      className="inline-block"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </h1>
              </div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-xl sm:text-2xl text-[#94a3b8] max-w-lg leading-relaxed font-medium mb-10"
              >
                منصة التحاليل الطبية الأكثر تطوراً في مصر
              </motion.p>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, ...spring }}
                className="flex flex-wrap gap-4 mb-12"
              >
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center px-5 py-4 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]"
                  >
                    <div className="text-2xl lg:text-3xl font-black text-[#e2e8f0]">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2.5} />
                    </div>
                    <div className="text-xs text-[#94a3b8] font-medium mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, ...spring }}
                className="flex flex-wrap gap-4"
              >
                <Link
                  href={`/${locale}/register`}
                  className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] px-10 py-5 text-base font-extrabold text-[#0a0a0f] shadow-2xl shadow-[#38bdf8]/20 hover:shadow-[#38bdf8]/40 transition-all duration-500 hover:scale-[1.03] active:scale-[0.97] overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <Calendar className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">احجز موعدك الآن</span>
                  <ArrowUpRight className="h-4 w-4 relative z-10 group-hover:rotate-45 transition-transform duration-300" />
                  {/* Subtle glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#38bdf8]/20 to-[#2dd4bf]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
                <Link
                  href={`/${locale}/patient/tests`}
                  className="flex items-center gap-2 rounded-2xl border border-white/[0.08] px-8 py-5 text-base font-semibold text-[#94a3b8] hover:bg-white/[0.04] hover:text-[#e2e8f0] transition-all duration-500 hover:border-white/[0.15] hover:scale-[1.02]"
                >
                  تصفح التحاليل
                </Link>
              </motion.div>
            </div>

            {/* Right Side — Floating Glass Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.6, duration: 0.9, ...spring }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="relative">
                {/* Main glass card */}
                <div className="relative w-[400px] h-[400px] rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-8 flex flex-col items-center justify-center shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-3xl" />
                  <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                    <Microscope className="w-32 h-32 text-[#e2e8f0]/80 mb-6" strokeWidth={0.8} />
                  </motion.div>
                  <p className="text-4xl font-black text-[#e2e8f0] mb-1">500+</p>
                  <p className="text-sm text-[#94a3b8] font-medium">فحص مخبري متخصص</p>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#38bdf8] via-[#2dd4bf] to-[#38bdf8] rounded-t-3xl" />
                </div>

                {/* Floating mini cards */}
                <motion.div
                  className="absolute -top-6 -right-6 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] px-5 py-4 shadow-2xl"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-[#38bdf8]/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-[#38bdf8]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#e2e8f0]">جهاز تحليل الدم الآلي</p>
                      <p className="text-xs text-[#94a3b8]">نتائج خلال 30 دقيقة</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-6 -left-6 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] px-5 py-4 shadow-2xl"
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-[#34d399]/10 flex items-center justify-center">
                      <Dna className="h-5 w-5 text-[#34d399]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#e2e8f0]">جهاز PCR عالي الدقة</p>
                      <p className="text-xs text-[#94a3b8]">دقة 99.9%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute top-1/2 -left-10 -translate-y-1/2 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] px-5 py-4 shadow-2xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-[#2dd4bf]/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-[#2dd4bf]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#e2e8f0]">معتمد دولياً</p>
                      <p className="text-xs text-[#94a3b8]">ISO & CAP</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute top-1/2 -right-10 -translate-y-1/2 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] px-5 py-4 shadow-2xl"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, delay: 1.5, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#e2e8f0]">أحدث التقنيات</p>
                      <p className="text-xs text-[#94a3b8]">مستوى عالمي</p>
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
        transition={{ delay: 2.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex flex-col items-center gap-3">
          <span className="text-xs text-[#94a3b8] font-medium tracking-wider">اكتشف المزيد</span>
          <motion.div className="w-7 h-11 rounded-full border border-white/[0.08] flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ============================================================
   3. DEVICES — HORIZONTAL SHOWCASE
   ============================================================ */

function DevicesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const devices = [
    { name: 'جهاز تحليل الدم الآلي', desc: 'تحليل شامل لعناصر الدم بنتائج دقيقة خلال 30 دقيقة', icon: <Activity className="h-7 w-7" />, gradient: 'from-red-500/20 to-pink-500/20', iconColor: 'text-red-400' },
    { name: 'جهاز التحليل الكيميائي', desc: 'قياس مستويات السكر والكوليسترول بدقة عالية', icon: <TestTube2 className="h-7 w-7" />, gradient: 'from-blue-500/20 to-indigo-500/20', iconColor: 'text-blue-400' },
    { name: 'مجهر رقمي ذكي', desc: 'فحص عينات الدم والأنسجة بتقنية رقمية متطورة', icon: <Microscope className="h-7 w-7" />, gradient: 'from-purple-500/20 to-violet-500/20', iconColor: 'text-purple-400' },
    { name: 'جهاز PCR عالي الدقة', desc: 'كشف الأمراض بدقة 99.9% في وقت قياسي', icon: <Dna className="h-7 w-7" />, gradient: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-400' },
    { name: 'جهاز تحليل البول الآلي', desc: 'تحليل شامل لعينات البول بأحدث التقنيات', icon: <Droplets className="h-7 w-7" />, gradient: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400' },
    { name: 'جهاز التحليل المناعي', desc: 'قياس الأجسام المضادة بدقة فائقة', icon: <Shield className="h-7 w-7" />, gradient: 'from-cyan-500/20 to-sky-500/20', iconColor: 'text-cyan-400' },
    { name: 'جهاز قياس الهرمونات', desc: 'قياس مستويات الهرمونات لتشخيص شامل', icon: <TrendingUp className="h-7 w-7" />, gradient: 'from-rose-500/20 to-red-500/20', iconColor: 'text-rose-400' },
  ];

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    updateScrollButtons();
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [updateScrollButtons]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 380 : -380, behavior: 'smooth' });
  };

  return (
    <Section id="الأجهزة" className="py-24 lg:py-32 bg-[#0a0a0f]">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.03),transparent_70%)]" />

      <Container>
        <SectionTitle
          badge="أحدث الأجهزة الطبية"
          badgeIcon={<Microscope className="h-4 w-4" />}
          title="أجهزةنا المتطورة"
          gradient="from-[#38bdf8] to-[#2dd4bf]"
          subtitle="نستخدم أحدث الأجهزة والتقنيات الطبية المعتمدة دولياً لضمان دقة النتائج"
        />
      </Container>

      {/* Scroll Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex justify-end gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] text-[#94a3b8] hover:bg-white/[0.06] hover:text-[#38bdf8] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] text-[#94a3b8] hover:bg-white/[0.06] hover:text-[#38bdf8] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Horizontal Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-8 px-4 sm:px-6 lg:px-8 scroll-smooth"
        style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}
      >
        <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
        <div className="shrink-0 w-0 lg:w-[calc((100vw-1280px)/2)]" />
        {devices.map((d, i) => (
          <motion.div
            key={d.name}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: i * 0.08, ...spring }}
            className="shrink-0 w-[320px] sm:w-[360px]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              whileTap={{ scale: 0.98 }}
              className="group relative rounded-3xl bg-white/[0.02] border border-white/[0.06] p-8 h-[360px] flex flex-col justify-between hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500 overflow-hidden"
            >
              {/* Subtle top gradient */}
              <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${d.gradient.replace('/20', '/40')}`} />

              {/* Hover glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${d.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-2xl`} />

              <div className="relative z-10">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${d.gradient} ${d.iconColor} mb-6`}>
                  {d.icon}
                </div>
                <h3 className="text-xl font-bold text-[#e2e8f0] mb-3">{d.name}</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">{d.desc}</p>
              </div>

              <div className="relative z-10 flex items-center gap-2 text-sm font-semibold text-[#38bdf8] group-hover:gap-3 transition-all duration-300">
                <span>اعرف المزيد</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-1 rotate-180" />
              </div>
            </motion.div>
          </motion.div>
        ))}
        <div className="shrink-0 w-0 lg:w-[calc((100vw-1280px)/2)]" />
      </div>
    </Section>
  );
}

/* ============================================================
   4. SERVICES — CLEAN GRID
   ============================================================ */

function ServicesSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  const services = [
    {
      icon: <FlaskConical className="h-7 w-7" />,
      title: 'التحاليل المخبرية الشاملة',
      desc: 'أكثر من 500 فحص مخبري شامل في مختلف التخصصات الطبية مع نتائج دقيقة وموثوقة',
      gradient: 'from-[#38bdf8]/15 to-blue-500/15',
      iconColor: 'text-[#38bdf8]',
      link: '#',
    },
    {
      icon: <Stethoscope className="h-7 w-7" />,
      title: 'الفحص المنزلي',
      desc: 'خدمة فحص منزلي على مدار الساعة مع فريق طبي معتمد ومعدات متطورة',
      gradient: 'from-[#2dd4bf]/15 to-emerald-500/15',
      iconColor: 'text-[#2dd4bf]',
      link: '#',
    },
    {
      icon: <Calendar className="h-7 w-7" />,
      title: 'حجز المواعيد الإلكترونية',
      desc: 'احجز موعدك بسهولة عبر الإنترنت واختار الفرع والوقت المناسب لك',
      gradient: 'from-cyan-500/15 to-[#38bdf8]/15',
      iconColor: 'text-cyan-400',
      link: `/${locale}/register`,
    },
  ];

  return (
    <Section id="الخدمات" className="py-24 lg:py-32 bg-[#0a0a0f]">
      <Container>
        <SectionTitle
          badge="خدماتنا المتكاملة"
          badgeIcon={<Sparkles className="h-4 w-4" />}
          title="خدماتنا المخبرية"
          gradient="from-[#2dd4bf] to-[#38bdf8]"
          subtitle="نقدم مجموعة شاملة من الخدمات المخبرية عالية الجودة بأحدث التقنيات"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {services.map((s) => (
            <motion.div key={s.title} variants={staggerItem}>
              <Link href={s.link} className="block group">
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  whileTap={{ scale: 0.98 }}
                  className="relative rounded-3xl bg-white/[0.02] border border-white/[0.06] p-9 h-full hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500 overflow-hidden"
                >
                  {/* Hover glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-2xl`} />

                  <div className="relative z-10">
                    <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} ${s.iconColor} mb-7`}>
                      {s.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-[#e2e8f0] mb-4">{s.title}</h3>
                    <p className="text-[#94a3b8] leading-relaxed mb-8">{s.desc}</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#38bdf8] group-hover:gap-3 transition-all duration-300">
                      <span>اعرف المزيد</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-1 rotate-180" />
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

/* ============================================================
   5. STATS — COUNTER SECTION
   ============================================================ */

function StatsSection() {
  const stats = [
    { icon: <Users className="h-6 w-6" />, value: 50000, suffix: '+', label: 'مريض سعيد', color: 'text-[#38bdf8]' },
    { icon: <Target className="h-6 w-6" />, value: 999, suffix: '.9%', label: 'دقة في النتائج', color: 'text-[#34d399]' },
    { icon: <Award className="h-6 w-6" />, value: 15, suffix: '+', label: 'سنة خبرة', color: 'text-[#2dd4bf]' },
    { icon: <Clock className="h-6 w-6" />, value: 24, suffix: '/7', label: 'دعم متواصل', color: 'text-purple-400' },
  ];

  return (
    <Section className="py-24 lg:py-32 bg-[#0a0a0f]">
      {/* Subtle top/bottom gradient separators */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                className="text-center p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all duration-500"
              >
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ${stat.color} mb-5`}>
                  {stat.icon}
                </div>
                <div className="text-4xl lg:text-5xl font-black text-[#e2e8f0] mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2.5} />
                </div>
                <div className="text-sm text-[#94a3b8] font-medium">{stat.label}</div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

/* ============================================================
   6. BRANCHES — LOCATION CARDS
   ============================================================ */

function BranchesSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  const branches = [
    { name: 'فرع التجمع الخامس', address: 'التجمع الخامس، القاهرة', hours: 'السبت - الخميس: 8 ص - 10 م', phone: '02281234567', isMain: true },
    { name: 'فرع مدينة نصر', address: 'شارع مصطفى النحاس، مدينة نصر', hours: 'السبت - الخميس: 7 ص - 11 م', phone: '02227345678', isMain: false },
    { name: 'فرع المعادي', address: 'شارع 9، المعادي، القاهرة', hours: 'السبت - الخميس: 8 ص - 10 م', phone: '02251987654', isMain: false },
  ];

  return (
    <Section id="الفروع" className="py-24 lg:py-32 bg-[#0a0a0f]">
      <Container>
        <SectionTitle
          badge="فروعنا"
          badgeIcon={<MapPin className="h-4 w-4" />}
          title="فروعنا قريبة منك"
          gradient="from-[#2dd4bf] to-[#38bdf8]"
          subtitle="فروع منتشرة في مختلف أنحاء القاهرة لخدمتك"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {branches.map((b) => (
            <motion.div key={b.name} variants={staggerItem}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-3xl bg-white/[0.02] backdrop-blur-xl border p-8 transition-all duration-500 hover:bg-white/[0.04] overflow-hidden ${
                  b.isMain ? 'border-[#38bdf8]/20 shadow-[0_0_40px_rgba(56,189,248,0.05)]' : 'border-white/[0.06]'
                }`}
              >
                {b.isMain && (
                  <div className="absolute top-0 right-8 rounded-b-2xl bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] px-4 py-2 text-xs font-bold text-[#0a0a0f] shadow-lg">
                    الفرع الرئيسي
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#38bdf8]/10 text-[#38bdf8] mb-5">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#e2e8f0] mb-2">{b.name}</h3>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-[#94a3b8] mt-0.5 shrink-0" />
                    <p className="text-sm text-[#94a3b8]">{b.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-[#94a3b8] shrink-0" />
                    <p className="text-sm text-[#94a3b8]">{b.hours}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#94a3b8] shrink-0" />
                    <p className="text-sm text-[#94a3b8]" dir="ltr">{b.phone}</p>
                  </div>
                </div>

                <Link
                  href={`/${locale}/register`}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] px-6 py-3.5 text-sm font-bold text-[#0a0a0f] shadow-lg shadow-[#38bdf8]/10 hover:shadow-[#38bdf8]/30 transition-all duration-300 hover:scale-[1.02]"
                >
                  <Calendar className="h-4 w-4" />
                  احجز في هذا الفرع
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

/* ============================================================
   7. TESTIMONIALS — CROSSFADE CAROUSEL
   ============================================================ */

function TestimonialsSection() {
  const [active, setActive] = useState(0);

  const testimonials = [
    {
      name: 'أحمد محمد',
      text: 'تجربة رائعة جداً! النتائج كانت دقيقة جداً ووصلتني في وقت قياسي. الطاقم الطبي كان محترف ومتعاون بشكل كبير.',
      rating: 5,
      location: 'القاهرة',
    },
    {
      name: 'سارة علي',
      text: 'خدمة ممتازة ومحترفة. الفحص المنزلي كان في الموعد المحدد بالضبط والطاقم كان مجهز بأحدث المعدات.',
      rating: 5,
      location: 'الإسكندرية',
    },
    {
      name: 'محمد حسن',
      text: 'من أفضل مراكز التحاليل الطبية في مصر. الأجهزة حديثة والنتائج موثوقة. التطبيق سهل الاستخدام جداً.',
      rating: 5,
      location: 'الجيزة',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <Section className="py-24 lg:py-32 bg-[#0a0a0f]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.03),transparent_60%)]" />

      <Container>
        <SectionTitle
          badge="شهادات عملائنا"
          badgeIcon={<Quote className="h-4 w-4" />}
          title={`ماذا يقول\nعملاؤنا`}
          gradient="from-[#38bdf8] to-[#2dd4bf]"
          subtitle=""
        />

        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative rounded-3xl bg-white/[0.02] border border-white/[0.06] p-10 lg:p-14 text-center">
                {/* Quote icon */}
                <div className="absolute top-8 right-8">
                  <Quote className="h-12 w-12 text-white/[0.04]" />
                </div>

                {/* Stars */}
                <div className="flex items-center justify-center gap-1 mb-8">
                  {Array.from({ length: testimonials[active].rating }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.05, ...spring }}
                    >
                      <Star className="h-6 w-6 fill-amber-400/80 text-amber-400/80" />
                    </motion.div>
                  ))}
                </div>

                {/* Quote */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl lg:text-2xl text-[#94a3b8] leading-relaxed mb-8 font-medium italic"
                >
                  &ldquo;{testimonials[active].text}&rdquo;
                </motion.p>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#2dd4bf] flex items-center justify-center text-[#0a0a0f] font-bold text-lg shadow-lg">
                    {testimonials[active].name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#e2e8f0]">{testimonials[active].name}</p>
                    <p className="text-sm text-[#94a3b8]">{testimonials[active].location}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dot Navigation */}
          <div className="flex items-center justify-center gap-3 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === active
                    ? 'w-8 h-3 bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf]'
                    : 'w-3 h-3 bg-white/[0.08] hover:bg-white/[0.15]'
                }`}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ============================================================
   8. CTA SECTION — BOOKING
   ============================================================ */

function CTASection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  return (
    <Section className="py-28 lg:py-36 bg-[#0a0a0f]">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f]" />

      {/* Floating orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)', top: '-10%', right: '10%' }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03]"
        style={{ background: 'radial-gradient(circle, #2dd4bf, transparent 70%)', bottom: '-10%', left: '15%' }}
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={spring}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-[#94a3b8] mb-8 border border-white/[0.06]">
            <Calendar className="h-4 w-4" />
            احجز الآن
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-[#e2e8f0] mb-6 leading-tight">
            احجز موعدك{' '}
            <span className="bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] bg-clip-text text-transparent">الآن</span>
          </h2>

          <p className="text-xl text-[#94a3b8] max-w-2xl mx-auto mb-12 leading-relaxed">
            لا تنتظر. احجز فحصك في أي فرع أو اطلب خدمة الفحص المنزلي. النتائج جاهزة خلال ساعات.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 mb-14">
            <Link
              href={`/${locale}/register`}
              className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] px-12 py-5 text-lg font-extrabold text-[#0a0a0f] shadow-2xl shadow-[#38bdf8]/20 hover:shadow-[#38bdf8]/40 transition-all duration-500 hover:scale-[1.03] active:scale-[0.97] overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Calendar className="h-6 w-6 relative z-10" />
              <span className="relative z-10">احجز موعدك الآن</span>
              <ArrowUpRight className="h-5 w-5 relative z-10 group-hover:rotate-45 transition-transform duration-300" />
              <div className="absolute -inset-1 bg-gradient-to-r from-[#38bdf8]/20 to-[#2dd4bf]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
            <a
              href="tel:+202281234567"
              className="flex items-center gap-2 rounded-2xl border border-white/[0.08] px-10 py-5 text-lg font-semibold text-[#94a3b8] hover:bg-white/[0.04] hover:text-[#e2e8f0] transition-all duration-500 hover:border-white/[0.15] hover:scale-[1.02]"
            >
              <Phone className="h-5 w-5" />
              اتصل بنا
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[#94a3b8] text-sm">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Clock className="h-4 w-4 text-[#38bdf8]" />
              <span>السبت - الخميس: 7 صباحاً - 10 مساءً</span>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Phone className="h-4 w-4 text-[#38bdf8]" />
              <span dir="ltr">02281234567</span>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Mail className="h-4 w-4 text-[#38bdf8]" />
              <span>info@almokhtabar.com</span>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}

/* ============================================================
   9. FOOTER — MINIMAL PREMIUM
   ============================================================ */

function FooterSection() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';

  const footerLinks: Record<string, { label: string; href: string }[]> = {
    'روابط سريعة': [
      { label: 'من نحن', href: '#' },
      { label: 'الفروع', href: '#الفروع' },
      { label: 'الوظائف', href: '#' },
      { label: 'الأخبار', href: '#' },
    ],
    'تواصل معنا': [
      { label: 'التحاليل المخبرية', href: '#الخدمات' },
      { label: 'الفحص المنزلي', href: '#' },
      { label: 'حجز المواعيد', href: `/${locale}/register` },
      { label: 'باقات التحاليل', href: '#' },
    ],
    'ساعات العمل': [
      { label: 'السبت - الخميس', href: '#' },
      { label: '7 صباحاً - 10 مساءً', href: '#' },
      { label: 'خدمة الطوارئ 24/7', href: '#' },
      { label: 'الفحص المنزلي', href: '#' },
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
    <footer className="bg-[#0a0a0f] text-[#e2e8f0] border-t border-white/[0.04]">
      <Container className="py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38bdf8] via-[#2dd4bf] to-[#38bdf8] text-[#0a0a0f] shadow-xl shadow-[#38bdf8]/10">
                <TestTube2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold">المختبر</span>
                <span className="block text-xs text-[#94a3b8] font-medium">Al Mokhtabar</span>
              </div>
            </div>
            <p className="text-sm text-[#94a3b8] leading-relaxed mb-8 max-w-sm">
              معامل تحليل طبي معتمدة دولياً تقدم أكثر من 500 فحص مخبري في مختلف الفروع. نلتزم بأعلى معايير الجودة والدقة.
            </p>
            <div className="flex gap-3">
              {socialIcons.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  whileHover={{ y: -3, transition: spring }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-xs font-bold text-[#94a3b8] hover:bg-[#38bdf8]/10 hover:text-[#38bdf8] transition-all duration-300"
                >
                  {s.label}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-bold text-[#e2e8f0] mb-6 tracking-wide">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[#94a3b8] hover:text-[#38bdf8] transition-colors duration-300 inline-block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t border-white/[0.04]">
        <Container className="py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#94a3b8] font-medium">
              &copy; 2026 المختبر &mdash; Al Mokhtabar. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-5 text-xs text-[#94a3b8]">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <BadgeCheck className="h-3.5 w-3.5 text-[#38bdf8]" />
                ISO 15189
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Award className="h-3.5 w-3.5 text-[#38bdf8]" />
                CAP
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#38bdf8]" />
                ZATCA
              </span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}

/* ============================================================
   MAIN HOMEPAGE EXPORT
   ============================================================ */

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navigation scrolled={scrolled} />
      <HeroSection />
      <DevicesSection />
      <ServicesSection />
      <StatsSection />
      <BranchesSection />
      <TestimonialsSection />
      <CTASection />
      <FooterSection />
    </main>
  );
}
