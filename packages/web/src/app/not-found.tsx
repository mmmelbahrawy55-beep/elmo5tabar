'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function DNAHelix() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      setOffset((prev) => (prev + 0.5) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <svg viewBox="0 0 200 600" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[800px]">
        {Array.from({ length: 20 }, (_, i) => {
          const y = i * 30;
          const x1 = Math.sin((y + offset) * 0.02) * 60;
          const x2 = Math.sin((y + offset + 180) * 0.02) * 60;
          return (
            <g key={i}>
              <circle cx={100 + x1} cy={y} r={4} fill="#0077B6" opacity={0.6 + Math.sin((y + offset) * 0.03) * 0.4} />
              <circle cx={100 + x2} cy={y} r={4} fill="#10B981" opacity={0.6 + Math.cos((y + offset) * 0.03) * 0.4} />
              {i % 2 === 0 && (
                <line x1={100 + x1} y1={y} x2={100 + x2} y2={y} stroke="#0077B6" strokeWidth={1} opacity={0.3} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 3 === 0 ? '#0077B6' : i % 3 === 1 ? '#10B981' : '#F59E0B',
            opacity: Math.random() * 0.4 + 0.1,
            animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-5px); }
          75% { transform: translateY(-30px) translateX(15px); }
        }
      `}</style>
    </div>
  );
}

function MicroscopeIcon() {
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 mx-auto" fill="none">
      <defs>
        <linearGradient id="grad404" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0077B6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#grad404)" opacity="0.1" />
      <circle cx="60" cy="60" r="44" fill="url(#grad404)" opacity="0.15" />
      <circle cx="60" cy="42" r="20" stroke="url(#grad404)" strokeWidth="3" fill="none" />
      <circle cx="60" cy="42" r="12" stroke="#0077B6" strokeWidth="2" fill="#0077B6" opacity="0.15" />
      <line x1="60" y1="62" x2="60" y2="95" stroke="url(#grad404)" strokeWidth="3" strokeLinecap="round" />
      <line x1="45" y1="95" x2="75" y2="95" stroke="url(#grad404)" strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="85" x2="80" y2="85" stroke="url(#grad404)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="60" cy="42" r="5" fill="#0077B6" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <DNAHelix />
      <FloatingParticles />

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="mb-8 animate-[scale-in_0.5s_ease-out]">
          <MicroscopeIcon />
        </div>

        <div className="mb-6 animate-[fade-in-up_0.6s_ease-out_0.1s_both]">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-semibold tracking-wide mb-4">
            خطأ 404
          </span>
          <h1 className="text-6xl sm:text-7xl font-extrabold bg-gradient-to-l from-brand-600 via-brand-500 to-accent-500 bg-clip-text text-transparent mb-4" style={{ fontFamily: 'Plus Jakarta Sans, IBM Plex Sans Arabic, sans-serif' }}>
            404
          </h1>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white mb-4 animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
          الصفحة غير موجودة
        </h2>
        <p className="text-lg text-surface-600 dark:text-surface-400 mb-10 leading-relaxed animate-[fade-in-up_0.6s_ease-out_0.3s_both]">
          عذراً، يبدو أن هذه الصفحة قد تم نقلها أو حذفها. تأكد من صحة الرابط أو عد للصفحة الرئيسية.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fade-in-up_0.6s_ease-out_0.4s_both]">
          <Link
            href="/"
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold rounded-2xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-l from-brand-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2">
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              العودة للرئيسية
            </span>
          </Link>
          <Link
            href="/ar/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 font-semibold rounded-2xl border border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            تسجيل الدخول
          </Link>
        </div>

        <div className="mt-16 animate-[fade-in-up_0.6s_ease-out_0.5s_both]">
          <div className="flex items-center justify-center gap-3 text-sm text-surface-400 dark:text-surface-500">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="font-semibold text-surface-600 dark:text-surface-300">المختبر</span>
            <span className="text-surface-300 dark:text-surface-600">|</span>
            <span>نظام إدارة المختبرات المتقدم</span>
          </div>
        </div>
      </div>
    </div>
  );
}
