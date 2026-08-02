'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AuthLayoutProps {
  children: ReactNode;
}

function DNAHelix() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      setOffset((prev) => (prev + 0.3) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg viewBox="0 0 200 400" className="absolute right-10 top-1/2 -translate-y-1/2 w-[300px] h-[500px] opacity-10">
      {Array.from({ length: 15 }, (_, i) => {
        const y = i * 28;
        const x1 = Math.sin((y + offset) * 0.025) * 50;
        const x2 = Math.sin((y + offset + 180) * 0.025) * 50;
        return (
          <g key={i}>
            <circle cx={100 + x1} cy={y} r={3.5} fill="#FFFFFF" opacity={0.7} />
            <circle cx={100 + x2} cy={y} r={3.5} fill="#FFFFFF" opacity={0.7} />
            {i % 2 === 0 && (
              <line x1={100 + x1} y1={y} x2={100 + x2} y2={y} stroke="#FFFFFF" strokeWidth={1} opacity={0.3} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[
        { size: 200, x: '10%', y: '20%', color: '#0077B6', delay: '0s' },
        { size: 150, x: '70%', y: '60%', color: '#10B981', delay: '2s' },
        { size: 180, x: '40%', y: '80%', color: '#F59E0B', delay: '4s' },
        { size: 120, x: '80%', y: '10%', color: '#0077B6', delay: '1s' },
      ].map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            backgroundColor: orb.color,
            opacity: 0.15,
            animation: `orbFloat 15s ease-in-out infinite`,
            animationDelay: orb.delay,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'ar';
  const otherLocale = currentLocale === 'ar' ? 'en' : 'ar';
  const otherLocaleLabel = currentLocale === 'ar' ? 'English' : 'العربية';

  return (
    <div className="min-h-screen flex" dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Left Panel - Brand (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 overflow-hidden">
        <FloatingOrbs />
        <DNAHelix />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold text-white mb-4 text-center" style={{ fontFamily: 'Plus Jakarta Sans, IBM Plex Sans Arabic, sans-serif' }}>
            المختبر
          </h1>
          <p className="text-xl text-white/70 mb-12 text-center max-w-sm">
            منصة إدارة المختبرات المتكاملة
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-md">
            {[
              { value: '+50K', label: ' Patient' },
              { value: '99.9%', label: 'وقت التشغيل' },
              { value: '24/7', label: 'الدعم الفني' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="mt-12 space-y-4 w-full max-w-md">
            {[
              { icon: '🔬', text: 'إدارة نتائج الفحوصات' },
              { icon: '📊', text: 'تقارير وتحليلات متقدمة' },
              { icon: '🔒', text: 'أمان على مستوى المؤسسات' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <span className="text-xl">{feature.icon}</span>
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col relative bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
        {/* Language switcher */}
        <div className="absolute top-5 left-5 z-10">
          <Link
            href={`/${otherLocale}${pathname.replace(`/${currentLocale}`, '')}`}
            className="group flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm rounded-xl text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-800 transition-all duration-300 shadow-sm hover:shadow-md border border-surface-100 dark:border-surface-700"
          >
            <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            {otherLocaleLabel}
          </Link>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Footer */}
        <footer className="py-5 px-6 text-center border-t border-surface-100 dark:border-surface-800">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">المختبر</span>
          </div>
          <p className="text-xs text-surface-400 dark:text-surface-500">
            © {new Date().getFullYear()} المختبر. جميع الحقوق محفوظة.
          </p>
        </footer>
      </div>
    </div>
  );
}
