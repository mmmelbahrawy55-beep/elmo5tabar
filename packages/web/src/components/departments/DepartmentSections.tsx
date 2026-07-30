'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Phone,
  Calendar,
  Star,
  AlertTriangle,
  Shield,
  Stethoscope,
  Microscope,
  FlaskConical,
  Zap,
  Award,
  Users,
  TrendingUp,
  BookOpen,
  Plus,
  Minus,
  Quote,
  ArrowRight,
  FileText,
  Sparkles,
  Timer,
  HeartPulse,
  ChevronLeft,
  Info,
  CircleDot,
} from 'lucide-react';
import { Department, getRelatedDepartments } from '@/data/departments';

const CONTAINER = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
const SECTION_PAD = 'py-16 sm:py-20 lg:py-24';
const VP = { once: true, amount: 0.2 } as const;

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView || target === 0) return;
    let current = 0;
    const step = target / 120;
    const id = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(id);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(id);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function parseVal(value: string): { num: number; suffix: string } {
  const clean = value.replace(/[+,]/g, '');
  const num = parseInt(clean, 10);
  return { num: isNaN(num) ? 0 : num, suffix: value.includes('+') ? '+' : '' };
}

function Title({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <motion.div
      className="text-center mb-12 sm:mb-16"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VP}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-extrabold text-surface-900">{children}</h2>
      <div
        className="mt-4 mx-auto h-1 w-20 rounded-full"
        style={{ background: color || '#0077B6' }}
      />
    </motion.div>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   1. DepartmentHero
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentHero({ department }: { department: Department }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const yBg = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacityBg = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 5 + 2,
        dur: Math.random() * 12 + 8,
        delay: Math.random() * 6,
      })),
    [],
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[85vh] flex items-center overflow-hidden"
    >
      {/* gradient background + particles */}
      <motion.div className="absolute inset-0" style={{ y: yBg, opacity: opacityBg }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${department.gradientFrom} 0%, ${department.gradientTo} 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />
        {/* grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-white/20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.15, 0.55, 0.15] }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      <div className={`relative z-10 ${CONTAINER} w-full`}>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* text side */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-2 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80">
              <HeartPulse className="w-4 h-4" />
              <span>المختبر | Al Mokhtabar Laboratory</span>
            </div>

            <motion.div
              className="text-7xl sm:text-8xl mb-4 inline-block"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.35))' }}
            >
              {department.icon}
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-2">
              {department.nameAr}
            </h1>
            <p className="text-lg sm:text-xl text-white/60 font-medium mb-6">
              {department.nameEn}
            </p>
            <p className="text-white/85 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl">
              {department.descriptionAr}
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.a
                href="#booking"
                className="inline-flex items-center gap-2.5 bg-white text-surface-900 font-bold px-8 py-4 rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <Calendar className="w-5 h-5" />
                احجز الآن
              </motion.a>
              <motion.a
                href="#tests"
                className="inline-flex items-center gap-2.5 border-2 border-white/40 text-white font-bold px-8 py-4 rounded-2xl text-lg backdrop-blur-sm hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <FlaskConical className="w-5 h-5" />
                تصفح التحاليل
              </motion.a>
            </div>
          </motion.div>

          {/* stat cards */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 gap-4"
          >
            {department.heroStats.map((stat, i) => {
              const { num, suffix } = parseVal(stat.value);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 + i * 0.1 }}
                  whileHover={{ y: -4, scale: 1.03 }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 sm:p-6 text-center shadow-lg"
                >
                  <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1.5">
                    <CountUp target={num} suffix={suffix} />
                  </div>
                  <div className="text-sm text-white/65 font-medium">{stat.labelAr}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   2. DepartmentOverview
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentOverview({ department }: { department: Department }) {
  const highlights = [
    {
      icon: <FlaskConical className="w-6 h-6" />,
      value: department.totalTests,
      label: 'اختبار متاح',
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: department.totalPatients,
      label: 'مريض تم خدمتهم',
    },
    {
      icon: <TargetIcon className="w-6 h-6" />,
      value: department.accuracy,
      label: 'نسبة الدقة',
    },
    {
      icon: <Award className="w-6 h-6" />,
      value: department.experience,
      label: 'سنوات الخبرة',
    },
  ];

  return (
    <section className={`${SECTION_PAD} bg-white`}>
      <div className={CONTAINER}>
        <Title color={department.color}>نظرة عامة</Title>

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">
          {/* text side */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VP}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              {/* decorative quote mark */}
              <div
                className="absolute -top-6 -right-2 text-8xl font-extrabold opacity-[0.04] leading-none select-none pointer-events-none"
                style={{ color: department.color }}
              >
                &#8220;
              </div>
              <p className="text-surface-600 text-lg leading-[1.9] whitespace-pre-line relative z-10">
                {department.overviewAr}
              </p>
            </div>

            {/* inline trust badges */}
            <div className="flex flex-wrap gap-3 mt-8">
              {['معتمد دولياً', 'نتائج فورية', 'فريق طبي متخصص'].map((badge, bi) => (
                <motion.span
                  key={bi}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={VP}
                  transition={{ duration: 0.3, delay: 0.4 + bi * 0.08 }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: `${department.color}30`,
                    backgroundColor: `${department.color}08`,
                    color: department.color,
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {badge}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* highlight cards */}
          <motion.div
            className="lg:col-span-2 grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VP}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {highlights.map((h, i) => {
              const { num, suffix } = parseVal(String(h.value));
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VP}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.1 }}
                  whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                  className="bg-surface-50/80 backdrop-blur border border-surface-200 rounded-2xl p-5 text-center relative overflow-hidden group"
                >
                  {/* subtle bg accent */}
                  <div
                    className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                    style={{ background: department.color }}
                  />
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 relative z-10"
                    style={{ backgroundColor: `${department.color}12`, color: department.color }}
                  >
                    {h.icon}
                  </div>
                  <div className="text-2xl font-extrabold text-surface-900 mb-1 relative z-10">
                    {num > 0 ? <CountUp target={num} suffix={suffix} /> : h.value}
                  </div>
                  <div className="text-sm text-surface-500 font-medium relative z-10">
                    {h.label}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   3. DepartmentTests
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentTests({ department }: { department: Department }) {
  return (
    <section id="tests" className={`${SECTION_PAD} bg-surface-50`}>
      <div className={CONTAINER}>
        <Title color={department.color}>التحاليل المتاحة</Title>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {department.tests.map((test, i) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VP}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              whileHover={{ y: -6, boxShadow: `0 12px 36px ${department.color}18` }}
              className="bg-white rounded-2xl p-6 border border-surface-200 hover:border-transparent transition-all relative overflow-hidden group"
            >
              {/* popular badge */}
              {test.popular && (
                <div className="absolute top-4 left-4 z-10">
                  <span
                    className="text-[11px] font-bold px-3 py-1 rounded-full text-white shadow-sm"
                    style={{ background: department.color }}
                  >
                    الأكثر طلباً
                  </span>
                </div>
              )}

              {/* decorative corner accent */}
              <div
                className="absolute top-0 right-0 w-20 h-20 opacity-[0.06] rounded-bl-full"
                style={{ background: department.color }}
              />

              <h3 className="font-bold text-surface-900 text-lg mb-1 pr-1">{test.nameAr}</h3>
              <p className="text-sm text-surface-400 mb-3">{test.nameEn}</p>

              <div className="flex items-center gap-2 text-sm text-surface-500 mb-4">
                <Clock className="w-4 h-4" />
                <span>{test.turnaround}</span>
              </div>

              <div className="flex items-end justify-between border-t border-surface-100 pt-4">
                <div>
                  {test.popular && (
                    <span className="text-xs text-surface-400 line-through block mb-0.5">
                      {Math.round(test.price * 1.2)} ر.س
                    </span>
                  )}
                  <span className="text-2xl font-extrabold" style={{ color: department.color }}>
                    {test.price}
                  </span>
                  <span className="text-sm text-surface-400 mr-1">ر.س</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
                  style={{ backgroundColor: `${department.color}10`, color: department.color }}
                >
                  احجز
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
        >
          <motion.a
            href="#all-tests"
            className="inline-flex items-center gap-2 font-bold text-lg group/link"
            style={{ color: department.color }}
            whileHover={{ x: -6 }}
          >
            عرض جميع التحاليل
            <ArrowLeft className="w-5 h-5 transition-transform group-hover/link:-translate-x-1" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   4. DepartmentTeam
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentTeam({ department }: { department: Department }) {
  return (
    <section className={`${SECTION_PAD} bg-white`}>
      <div className={CONTAINER}>
        <Title color={department.color}>الفريق الطبي</Title>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {department.medicalTeam.map((member, i) => {
            const parts = member.nameAr.split(' ');
            const initials = parts.length >= 2 ? parts.slice(0, 2).join(' ') : parts[0];

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VP}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden"
              >
                {/* top gradient accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{
                    background: `linear-gradient(90deg, ${department.gradientFrom}, ${department.gradientTo})`,
                  }}
                />

                <div className="flex items-start gap-4 mb-5">
                  {/* avatar */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${department.gradientFrom}, ${department.gradientTo})`,
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-surface-900 text-lg leading-snug">
                      {member.nameAr}
                    </h3>
                    <p className="text-sm font-semibold" style={{ color: department.color }}>
                      {member.titleAr}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">{member.titleEn}</p>
                  </div>
                </div>

                {/* qualifications */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {member.qualifications.map((q, qi) => (
                    <span
                      key={qi}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-surface-100 text-surface-600"
                    >
                      <CheckCircle2 className="w-3 h-3 text-success-500" />
                      {q}
                    </span>
                  ))}
                </div>

                {/* meta */}
                <div className="flex items-center gap-5 text-sm text-surface-500 border-t border-surface-100 pt-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {member.experience}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" />
                    {member.specialty}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   5. DepartmentEquipment
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentEquipment({ department }: { department: Department }) {
  return (
    <section className={`${SECTION_PAD} bg-surface-900 relative overflow-hidden`}>
      {/* grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${department.color} 1px,transparent 1px),linear-gradient(90deg,${department.color} 1px,transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      {/* large ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-3xl"
        style={{ background: department.color }}
      />

      <div className={`${CONTAINER} relative z-10`}>
        <Title color={department.color}>الأجهزة والمعدات</Title>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {department.equipment.map((eq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VP}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 group hover:bg-white/10 transition-all relative overflow-hidden"
            >
              {/* corner glow */}
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                style={{ background: department.color }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${department.color}25`, color: department.color }}
                  >
                    <Microscope className="w-6 h-6" />
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-xs font-bold uppercase tracking-widest text-white/40">
                    {eq.brand}
                  </div>
                </div>

                <h3 className="font-bold text-white text-lg mb-1">{eq.nameAr}</h3>
                <p className="text-sm text-white/40 mb-3 font-medium">{eq.nameEn}</p>
                <p className="text-sm text-white/55 leading-relaxed">{eq.description}</p>
              </div>

              {/* bottom accent line */}
              <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent relative z-10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   6. DepartmentTechnology
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentTechnology({ department }: { department: Department }) {
  return (
    <section className={`${SECTION_PAD} bg-white`}>
      <div className={CONTAINER}>
        <Title color={department.color}>التقنيات المستخدمة</Title>

        {/* subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          className="text-center text-surface-500 max-w-2xl mx-auto mb-10 -mt-8"
        >
          نستخدم أحدث التقنيات العالمية لضمان دقة وموثوقية نتائج تحاليلك
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {department.technology.map((tech, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={VP}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${department.color}12` }}
              className="bg-surface-50 border border-surface-200 rounded-2xl p-7 text-center relative group hover:border-transparent transition-all cursor-default"
            >
              {/* glow ring on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 2px ${department.color}, 0 0 20px ${department.color}15` }}
              />

              {/* bg decoration */}
              <div
                className="absolute -top-4 -left-4 w-16 h-16 rounded-full opacity-[0.05] group-hover:opacity-[0.1] transition-opacity"
                style={{ background: department.color }}
              />

              <div className="text-5xl mb-5 relative z-10">{tech.icon}</div>
              <h3 className="font-bold text-surface-900 text-xl mb-2 relative z-10">
                {tech.name}
              </h3>
              <p className="text-sm text-surface-500 leading-relaxed relative z-10">
                {tech.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* decorative dotted connector */}
        {department.technology.length >= 3 && (
          <div className="hidden lg:block relative h-0 -mt-[130px] mb-[100px] pointer-events-none">
            <svg className="w-full h-32" preserveAspectRatio="none">
              <line
                x1="17%"
                y1="50%"
                x2="83%"
                y2="50%"
                stroke={department.color}
                strokeWidth="2"
                strokeDasharray="8 8"
                className="opacity-15"
              />
              <circle cx="17%" cy="50%" r="4" fill={department.color} className="opacity-30" />
              <circle cx="50%" cy="50%" r="4" fill={department.color} className="opacity-30" />
              <circle cx="83%" cy="50%" r="4" fill={department.color} className="opacity-30" />
            </svg>
          </div>
        )}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   7. DepartmentPreparation
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentPreparation({ department }: { department: Department }) {
  return (
    <section className={`${SECTION_PAD} bg-surface-50`}>
      <div className={CONTAINER}>
        <Title color={department.color}>التحضير قبل التحليل</Title>

        <div className="max-w-3xl mx-auto">
          {/* intro note */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VP}
            className="flex items-center gap-3 mb-6 text-surface-500"
          >
            <Info className="w-5 h-5 shrink-0" />
            <p className="text-sm">
              اتبع هذه الخطوات للحصول على أفضل النتائج من تحاليل {department.nameAr}
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VP}
          >
            {department.preparationGuide.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={VP}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="flex items-start gap-4 py-4 border-b border-surface-100 last:border-0 group"
              >
                {/* step number */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5 shadow-sm group-hover:scale-110 transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${department.gradientFrom}, ${department.gradientTo})`,
                  }}
                >
                  {i + 1}
                </div>

                <div className="flex-1 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success-500 mt-0.5 shrink-0" />
                  <p className="text-surface-700 leading-relaxed">{step}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* warning callout */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VP}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-saffron-50 border border-saffron-200 rounded-2xl p-5 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-saffron-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-saffron-800 mb-1">تنبيه مهم</h4>
              <p className="text-sm text-saffron-700 leading-relaxed">
                يُرجى الاتصال بالمختبر مسبقاً إذا كنت تتناول أي أدوية أو لديك حالة طبية خاصة.
                يمكننا تكييف التحضير وفقاً لاحتياجاتك الشخصية. جميع التحاليل تتم تحت إشراف طبي مباشر.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   8. DepartmentExpectedTime
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentExpectedTime({ department }: { department: Department }) {
  const levels = [
    {
      label: 'التحاليل العادية',
      sub: ' STANDARD',
      time: department.expectedTime.standard,
      color: '#10B981',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: 'التحاليل المستعجلة',
      sub: ' RUSH',
      time: department.expectedTime.rush,
      color: '#F59E0B',
      bg: '#FFFBEB',
      border: '#FDE68A',
      icon: <Timer className="w-5 h-5" />,
    },
    {
      label: 'حالات الطوارئ',
      sub: ' STAT',
      time: department.expectedTime.stat,
      color: '#EF4444',
      bg: '#FEF2F2',
      border: '#FECACA',
      icon: <Zap className="w-5 h-5" />,
    },
  ];

  return (
    <section className={`${SECTION_PAD} bg-white`}>
      <div className={CONTAINER}>
        <Title color={department.color}>مدة انتظار النتائج</Title>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* timeline line */}
            <div
              className="absolute right-[23px] top-0 bottom-0 w-[3px] rounded-full"
              style={{
                background: 'linear-gradient(to bottom, #10B981 0%, #F59E0B 50%, #EF4444 100%)',
              }}
            />

            <div className="space-y-6">
              {levels.map((lv, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={VP}
                  transition={{ duration: 0.55, delay: i * 0.15 }}
                  className="flex items-center gap-5"
                >
                  {/* circle marker */}
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-md"
                    style={{ backgroundColor: lv.bg, color: lv.color }}
                  >
                    {lv.icon}
                  </motion.div>

                  {/* card */}
                  <div
                    className="flex-1 rounded-2xl p-5 border-2 hover:shadow-lg transition-shadow"
                    style={{ backgroundColor: lv.bg, borderColor: lv.border }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-base" style={{ color: lv.color }}>
                          {lv.label}
                        </h4>
                        <span className="text-xs opacity-50 font-mono">{lv.sub}</span>
                      </div>
                      <div className="text-2xl font-extrabold" style={{ color: lv.color }}>
                        {lv.time}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={VP}
            className="text-center text-sm text-surface-400 mt-8"
          >
            * قد تختلف الأوقات حسب نوع التحليل والعينات المتاحة. للحالات العاجلة يُرجى الاتصال بالمختبر مباشرة.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   9. DepartmentInsurance
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentInsurance({ department }: { department: Department }) {
  const providerColors: Record<string, string> = {
    بوبا: '#1E40AF',
    التعاونية: '#059669',
    مدجلف: '#7C3AED',
    'الراجحي تكافل': '#16A34A',
  };

  return (
    <section className={`${SECTION_PAD} bg-surface-50`}>
      <div className={CONTAINER}>
        <Title color={department.color}>التأمين الطبي</Title>

        <div className="grid sm:grid-cols-2 gap-5">
          {department.insurance.map((ins, i) => {
            const pc = providerColors[ins.provider] || department.color;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VP}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
                className="bg-white rounded-2xl border border-surface-200 overflow-hidden"
              >
                <div className="h-1.5" style={{ backgroundColor: pc }} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md"
                        style={{ backgroundColor: pc }}
                      >
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-surface-900">{ins.provider}</h3>
                      </div>
                    </div>
                    <span
                      className="text-sm font-bold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: `${pc}12`, color: pc }}
                    >
                      {ins.coverage}
                    </span>
                  </div>
                  <p className="text-sm text-surface-500 leading-relaxed">{ins.note}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-blue-800 mb-1">ملاحظة حول التأمين</h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              قد تتطلب بعض التحاليل إجازة (PRE-AUTH) مسبقة من شركة التأمين. يُرجى التواصل معنا
              للتحقق من تغطية اختباراتك قبل الحجز لتجنب أي مفاجآت. فريقنا جاهز لمساعدتك في
              الإجراءات التأمينية.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   10. DepartmentFAQ
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentFAQ({ department }: { department: Department }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className={`${SECTION_PAD} bg-white`}>
      <div className={CONTAINER}>
        <Title color={department.color}>الأسئلة الشائعة</Title>

        {/* contact hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VP}
          className="text-center text-surface-400 text-sm mb-8 -mt-10"
        >
          لم تجد إجابتك؟{' '}
          <a href="#booking" className="font-bold underline" style={{ color: department.color }}>
            تواصل معنا
          </a>
        </motion.p>

        <div className="max-w-3xl mx-auto space-y-3">
          {department.faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VP}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className={`border rounded-2xl overflow-hidden transition-colors ${
                  isOpen
                    ? 'border-surface-300 bg-surface-50 shadow-sm'
                    : 'border-surface-200 bg-white hover:border-surface-300 hover:shadow-xs'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-right"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: isOpen ? `${department.color}15` : '#F1F5F9',
                        color: isOpen ? department.color : '#94A3B8',
                      }}
                    >
                      {i + 1}
                    </div>
                    <span className="font-bold text-surface-900 text-base">{faq.question}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 mr-4"
                  >
                    <ChevronLeft
                      className={`w-5 h-5 transition-colors ${isOpen ? 'text-surface-600' : 'text-surface-300'}`}
                    />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pl-16 text-surface-600 leading-relaxed border-t border-surface-200 pt-4 text-[15px]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   11. DepartmentArticles
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentArticles({ department }: { department: Department }) {
  return (
    <section className={`${SECTION_PAD} bg-surface-50`}>
      <div className={CONTAINER}>
        <Title color={department.color}>مقالات وإرشادات</Title>

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {department.articles.map((article, i) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={VP}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-2xl border border-surface-200 overflow-hidden min-w-[300px] sm:min-w-[360px] snap-center group hover:shadow-xl transition-all flex-shrink-0"
            >
              {/* header gradient */}
              <div
                className="h-36 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${department.gradientFrom}, ${department.gradientTo})`,
                }}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                <span className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/20">
                  {article.category}
                </span>
                <FileText className="absolute bottom-4 left-4 w-8 h-8 text-white/20" />
              </div>

              <div className="p-5">
                <h3 className="font-bold text-surface-900 text-lg mb-2 leading-snug group-hover:text-brand-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-surface-500 leading-relaxed mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-surface-400 border-t border-surface-100 pt-3">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {article.readTime}
                  </span>
                  <span>{article.date}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VP}
        >
          <motion.a
            href="#articles"
            className="inline-flex items-center gap-2 font-bold text-lg group/link"
            style={{ color: department.color }}
            whileHover={{ x: -6 }}
          >
            المزيد من المقالات
            <ArrowLeft className="w-5 h-5 transition-transform group-hover/link:-translate-x-1" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   12. DepartmentCTA
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentCTA({ department }: { department: Department }) {
  return (
    <section id="booking" className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${department.gradientFrom} 0%, ${department.gradientTo} 100%)`,
        }}
      />
      {/* decorative dots */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle,white 1.5px,transparent 1.5px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* large decorative circles */}
      <div
        className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-10"
        style={{ background: 'white' }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'white' }}
      />

      <div className={`${SECTION_PAD} relative z-10`}>
        <div className={CONTAINER}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VP}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <motion.div
              className="text-6xl mb-6"
              animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {department.icon}
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              احجز موعدك الآن
            </h2>
            <p className="text-white/75 text-lg mb-10 leading-relaxed">
              احصل على تحاليل {department.nameAr} بدقة عالية وسرعة فائقة. فريقنا الطبي المتميز
              جاهز لخدمتك في {department.nameEn}.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <motion.a
                href="#booking-form"
                className="inline-flex items-center gap-2.5 bg-white font-bold px-8 py-4 rounded-2xl text-lg shadow-xl"
                style={{ color: department.gradientFrom }}
                whileHover={{ scale: 1.06, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Calendar className="w-5 h-5" />
                احجز الآن
              </motion.a>
              <motion.a
                href="tel:+966555555555"
                className="inline-flex items-center gap-2.5 border-2 border-white/40 text-white font-bold px-8 py-4 rounded-2xl text-lg backdrop-blur-sm hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.97 }}
              >
                <Phone className="w-5 h-5" />
                966-555-555-555+
              </motion.a>
            </div>

            {/* trust items */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 text-sm">
              {['نتائج في وقت قياسي', 'فريق طبي متخصص', 'أجهزة متطورة', 'أسعار منافسة'].map(
                (item, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VP}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {item}
                  </motion.span>
                ),
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   13. DepartmentTestimonials
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentTestimonials({ department }: { department: Department }) {
  return (
    <section className={`${SECTION_PAD} bg-white`}>
      <div className={CONTAINER}>
        <Title color={department.color}>آراء المرضى</Title>

        {/* average rating summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          className="flex items-center justify-center gap-2 mb-8 -mt-8 text-surface-500"
        >
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, si) => (
              <Star key={si} className="w-4 h-4 text-saffron-400 fill-saffron-400" />
            ))}
          </div>
          <span className="text-sm font-bold text-surface-700">4.8</span>
          <span className="text-sm">من {department.testimonials.length} تقييم</span>
        </motion.div>

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {department.testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={VP}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-surface-50 border border-surface-200 rounded-2xl p-6 min-w-[310px] sm:min-w-[380px] snap-center relative overflow-hidden flex-shrink-0"
            >
              {/* quote decoration */}
              <div
                className="absolute top-4 left-4 opacity-[0.07]"
                style={{ color: department.color }}
              >
                <Quote className="w-20 h-20" />
              </div>

              <div className="relative z-10">
                {/* stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star
                      key={si}
                      className={`w-4 h-4 ${
                        si < t.rating
                          ? 'text-saffron-400 fill-saffron-400'
                          : 'text-surface-200 fill-surface-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-surface-400 mr-2">{t.rating}/5</span>
                </div>

                <p className="text-surface-700 leading-relaxed mb-5 text-[15px]">{t.text}</p>

                <div className="flex items-center justify-between border-t border-surface-200 pt-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${department.gradientFrom}, ${department.gradientTo})`,
                      }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-surface-900 text-sm block">{t.name}</span>
                      <span className="text-[11px] text-surface-400">مريض موثق</span>
                    </div>
                  </div>
                  <span className="text-xs text-surface-400">{t.date}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   14. DepartmentRelated
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentRelated({
  department,
  currentSlug,
}: {
  department: Department;
  currentSlug: string;
}) {
  const related = getRelatedDepartments(currentSlug);

  if (related.length === 0) return null;

  return (
    <section className={`${SECTION_PAD} bg-surface-50`}>
      <div className={CONTAINER}>
        <Title color={department.color}>أقسام ذات صلة</Title>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {related.map((rel, i) => (
            <motion.a
              key={rel.id}
              href={`/departments/${rel.id}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VP}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02, boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }}
              className="bg-white rounded-2xl border border-surface-200 p-5 hover:border-transparent transition-all block group overflow-hidden relative"
            >
              {/* gradient bg decoration */}
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                style={{ background: rel.color }}
              />

              <div className="flex items-start gap-4 relative z-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md group-hover:scale-110 transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${rel.gradientFrom}, ${rel.gradientTo})`,
                  }}
                >
                  {rel.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-surface-900 text-lg mb-0.5">{rel.nameAr}</h3>
                  <p className="text-xs text-surface-400 mb-1.5">{rel.nameEn}</p>
                  <p className="text-sm text-surface-500 line-clamp-2 leading-relaxed">
                    {rel.descriptionAr}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-sm font-bold" style={{ color: rel.color }}>
                  <span>اكتشف المزيد</span>
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                </div>
                <div className="flex items-center gap-3 text-xs text-surface-400">
                  <span className="bg-surface-100 px-2 py-1 rounded-md">{rel.totalTests} اختبار</span>
                  <span className="bg-surface-100 px-2 py-1 rounded-md">{rel.accuracy}</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   15. DepartmentStats (Animated Statistics Section)
   ────────────────────────────────────────────────────────────────────────────── */
export function DepartmentStats({ department }: { department: Department }) {
  const stats = [
    {
      value: department.totalTests,
      label: 'إجمالي الاختبارات',
      icon: <FlaskConical className="w-7 h-7" />,
      desc: 'اختبار متوفر في هذا القسم',
    },
    {
      value: department.totalPatients,
      label: 'إجمالي المرضى',
      icon: <Users className="w-7 h-7" />,
      desc: 'مريض تم خدمتهم بنجاح',
    },
    {
      value: department.accuracy,
      label: 'نسبة الدقة',
      icon: <TrendingUp className="w-7 h-7" />,
      desc: 'نسبة دقة النتائج',
    },
    {
      value: department.experience,
      label: 'سنوات الخبرة',
      icon: <Award className="w-7 h-7" />,
      desc: 'عام من التميز الطبي',
    },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* gradient bg */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${department.gradientFrom} 0%, ${department.gradientTo} 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-black/10" />
      {/* decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03] blur-3xl" />

      <div className={`${SECTION_PAD} relative z-10`}>
        <div className={CONTAINER}>
          <Title>إنجازاتنا بالأرقام</Title>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat, i) => {
              const { num, suffix } = parseVal(String(stat.value));
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VP}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                  whileHover={{ y: -8, scale: 1.04 }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-7 text-center shadow-lg relative overflow-hidden group"
                >
                  {/* inner glow on hover */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors rounded-2xl" />

                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4 text-white relative z-10 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1 relative z-10">
                    {num > 0 ? <CountUp target={num} suffix={suffix} /> : stat.value}
                  </div>
                  <div className="text-sm font-bold text-white/90 mb-1 relative z-10">
                    {stat.label}
                  </div>
                  <div className="text-xs text-white/50 relative z-10">{stat.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
