'use client';

import { useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeIn } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

interface FloatingCard {
  id: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
}

interface FloatingCardsProps {
  cards: FloatingCard[];
  layout?: 'grid' | 'stack' | 'carousel';
  floatingIntensity?: 'subtle' | 'medium' | 'strong';
}

const intensityConfig = {
  subtle: { amplitude: 4, rotation: 1, durationRange: [3, 4] as [number, number] },
  medium: { amplitude: 8, rotation: 2, durationRange: [4, 6] as [number, number] },
  strong: { amplitude: 14, rotation: 4, durationRange: [5, 8] as [number, number] },
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function FloatingCards({
  cards,
  layout = 'grid',
  floatingIntensity = 'medium',
}: FloatingCardsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const config = intensityConfig[floatingIntensity];

  const cardAnimations = useMemo(
    () =>
      cards.map((card, i) => {
        const seed = i * 137.5;
        const amplitude = config.amplitude + seededRandom(seed) * config.amplitude;
        const duration = config.durationRange[0] + seededRandom(seed + 1) * (config.durationRange[1] - config.durationRange[0]);
        const rotationAmplitude = config.rotation + seededRandom(seed + 2) * config.rotation;
        const delay = seededRandom(seed + 3) * 2;
        return { amplitude, duration, rotationAmplitude, delay };
      }),
    [cards, config]
  );

  const handleHover = useCallback((id: string | null) => setHoveredId(id), []);

  const layoutClasses = layout === 'grid'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
    : layout === 'stack'
    ? 'flex flex-col gap-4'
    : 'flex gap-6 overflow-x-auto snap-x snap-mandatory';

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className={cn(layoutClasses, 'relative')}
    >
      <AnimatePresence>
        {cards.map((card, i) => {
          const anim = cardAnimations[i];
          return (
            <motion.div
              key={card.id}
              variants={fadeIn('up', 0.1 * i)}
              layout
              animate={{
                y: hoveredId === card.id ? 0 : [0, -anim.amplitude, 0],
                rotate: hoveredId === card.id ? 0 : [0, anim.rotationAmplitude, 0],
              }}
              transition={{
                y: {
                  duration: anim.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: anim.delay,
                },
                rotate: {
                  duration: anim.duration * 1.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: anim.delay + 0.3,
                },
                layout: { type: 'spring', stiffness: 200, damping: 25 },
              }}
              onMouseEnter={() => handleHover(card.id)}
              onMouseLeave={() => handleHover(null)}
              style={card.color ? { '--card-color': card.color } as React.CSSProperties : undefined}
              className={cn(
                'relative rounded-2xl p-6 bg-white border border-surface-100 shadow-md transition-shadow duration-300',
                hoveredId === card.id ? 'shadow-xl z-10' : 'shadow-md',
                hoveredId && hoveredId !== card.id && 'opacity-60 blur-[1px] saturate-50',
                layout === 'carousel' && 'snap-center min-w-[280px] flex-shrink-0',
                'cursor-default'
              )}
            >
              {card.icon && (
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-brand-50 text-brand-500">
                  {card.icon}
                </div>
              )}
              <div>{card.content}</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
