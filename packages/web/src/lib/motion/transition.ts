'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { animatePageExit } from './timeline';

export const pageTransitionConfig = {
  defaultTransition: { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 },
  routeChangeDuration: 0.3,
} as const;

export function usePageTransition() {
  const router = useRouter();
  const animatingRef = useRef(false);

  const navigate = useCallback(
    async (href: string) => {
      if (animatingRef.current) return;
      animatingRef.current = true;

      const container = document.querySelector('[data-page-container]');
      if (container) {
        await animatePageExit(container);
      }
      router.push(href);
      animatingRef.current = false;
    },
    [router]
  );

  return { navigate, isAnimating: animatingRef.current };
}
