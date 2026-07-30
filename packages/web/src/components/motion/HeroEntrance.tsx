'use client';

import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  staggerContainer,
  textVariant,
  fadeIn,
  springGentle,
  brandCurve,
} from '@/lib/motion/variants';

interface HeroEntranceProps {
  badge?: string;
  headline: string;
  subheadline?: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  image?: string;
  variant?: 'default' | 'centered' | 'split' | 'fullscreen';
  align?: 'left' | 'center' | 'right';
  dir?: 'ltr' | 'rtl';
}

export function HeroEntrance({
  badge,
  headline,
  subheadline,
  cta,
  secondaryCta,
  image,
  variant = 'default',
  align = 'center',
  dir = 'ltr',
}: HeroEntranceProps) {
  const containerRef = useRef<HTMLDivElement>(null!);
  const isRtl = dir === 'rtl';

  const alignClasses = useMemo(() => {
    if (align === 'left') return isRtl ? 'items-end text-right' : 'items-start text-left';
    if (align === 'right') return isRtl ? 'items-start text-left' : 'items-end text-right';
    return 'items-center text-center';
  }, [align, isRtl]);

  const headlineChars = useMemo(() => headline.split(''), [headline]);

  const imageSlideDir = isRtl ? 'left' : 'right';

  return (
    <motion.section
      ref={containerRef}
      className={`relative overflow-hidden ${
        variant === 'fullscreen' ? 'min-h-screen' : 'min-h-[70vh]'
      } flex items-center justify-center`}
      initial="hidden"
      animate="visible"
      dir={dir}
    >
      {variant === 'fullscreen' && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-surface-900 to-brand-900 -z-10" />
      )}
      {variant === 'fullscreen' && (
        <div className="absolute inset-0 opacity-20 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500 rounded-full blur-[100px]" />
        </div>
      )}

      <motion.div
        variants={staggerContainer}
        className={`flex flex-col ${
          variant === 'split' ? 'lg:flex-row' : ''
        } items-center gap-12 w-full max-w-7xl mx-auto px-6 ${alignClasses}`}
      >
        <div className={`flex-1 ${variant === 'centered' ? 'max-w-3xl' : 'max-w-2xl'}`}>
          {badge && (
            <motion.span
              variants={fadeIn('up', 0.3)}
              className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-brand-50 text-brand-600 border border-brand-100"
            >
              {badge}
            </motion.span>
          )}

          <motion.h1
            variants={textContainerVariants()}
            className={`text-display-lg font-display font-extrabold leading-tight ${
              variant === 'fullscreen' ? 'text-white' : 'text-surface-900'
            }`}
          >
            <motion.span variants={textContainerVariants()} className="inline-flex flex-wrap">
              {headlineChars.map((char, i) => (
                <motion.span
                  key={`${char}-${i}`}
                  variants={textVariant(0.5 + i * 0.03)}
                  className="inline-block"
                  style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.span>
          </motion.h1>

          {subheadline && (
            <motion.p
              variants={fadeIn('up', 0.8)}
              className={`mt-6 text-body-lg max-w-xl ${
                variant === 'fullscreen'
                  ? 'text-surface-300'
                  : 'text-surface-500'
              } ${align === 'center' ? 'mx-auto' : ''}`}
            >
              {subheadline}
            </motion.p>
          )}

          {(cta || secondaryCta) && (
            <motion.div
              variants={fadeIn('up', 1.0)}
              className={`flex flex-wrap gap-4 mt-8 ${
                align === 'center' ? 'justify-center' : ''
              } ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              {cta && (
                <Link
                  href={cta.href}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-lg transition-all duration-200 ease-brand active:scale-[0.97]"
                >
                  {cta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-xl border-2 border-surface-300 text-surface-700 hover:border-surface-400 hover:bg-surface-50 transition-all duration-200 ease-brand active:scale-[0.97]"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </motion.div>
          )}
        </div>

        {image && (
          <motion.div
            variants={slideInCustom(imageSlideDir, 0.6)}
            className="flex-1 flex justify-center"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ perspective: 1000 }}
            >
              <motion.img
                src={image}
                alt=""
                className="w-full max-w-lg h-auto object-contain drop-shadow-2xl"
                style={{ rotateY: isRtl ? 5 : -5 }}
                initial={{ rotateY: isRtl ? 25 : -25, opacity: 0 }}
                animate={{ rotateY: isRtl ? 5 : -5, opacity: 1 }}
                transition={{ duration: 0.8, ease: brandCurve, delay: 0.6 }}
              />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.section>
  );
}

function textContainerVariants() {
  return {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.5 } },
  };
}

function slideInCustom(dir: string, delay: number) {
  const x = dir === 'left' ? 100 : dir === 'right' ? -100 : 0;
  return {
    hidden: { x, opacity: 0, rotateY: dir === 'left' ? 15 : -15 },
    visible: {
      x: 0, opacity: 1, rotateY: dir === 'left' ? -5 : 5,
      transition: { type: 'spring', stiffness: 100, damping: 20, mass: 1, delay },
    },
  };
}
