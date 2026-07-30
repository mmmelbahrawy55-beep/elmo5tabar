import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EASING } from './gsap-plugins';

gsap.registerPlugin(ScrollTrigger);

export function createAnimationTimeline(config?: { defaults?: object; paused?: boolean }): gsap.core.Timeline {
  return gsap.timeline({
    defaults: { ease: EASING.brand, ...config?.defaults },
    paused: config?.paused ?? false,
  });
}

interface ScrollTimelineConfig {
  trigger: Element | string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  markers?: boolean;
  toggleActions?: string;
}

export function createScrollTimeline(
  trigger: Element | string,
  config?: Partial<ScrollTimelineConfig>
): gsap.core.Timeline {
  const tl = createAnimationTimeline();
  ScrollTrigger.create({
    trigger,
    start: config?.start ?? 'top 85%',
    end: config?.end ?? 'top 30%',
    scrub: config?.scrub ?? 1,
    markers: config?.markers ?? false,
    toggleActions: config?.toggleActions ?? 'play none none reverse',
    animation: tl,
  });
  return tl;
}

export function animatePageEnter(container: Element): gsap.core.Timeline {
  const children = container.querySelectorAll('[data-animate]');
  const tl = createAnimationTimeline({ paused: false });
  tl.from(container, { opacity: 0, duration: 0.2, ease: EASING.smooth });
  if (children.length > 0) {
    tl.from(children, {
      y: 30,
      opacity: 0,
      duration: 0.5,
      ease: EASING.brand,
      stagger: 0.08,
    }, '-=0.1');
  }
  return tl;
}

export function animatePageExit(container: Element): Promise<void> {
  return new Promise((resolve) => {
    const children = container.querySelectorAll('[data-animate]');
    const tl = createAnimationTimeline({ paused: false });
    if (children.length > 0) {
      tl.to(children, {
        y: -15,
        opacity: 0,
        duration: 0.2,
        ease: EASING.smooth,
        stagger: 0.03,
      });
    }
    tl.to(container, {
      opacity: 0,
      duration: 0.15,
      ease: EASING.smooth,
      onComplete: resolve,
    }, '-=0.05');
    if (children.length === 0) {
      tl.progress(1);
      resolve();
    }
  });
}

export function animateNumberCounter(
  element: Element,
  from: number,
  to: number,
  duration = 1.5
): gsap.core.Tween {
  return gsap.fromTo(
    element,
    { textContent: from },
    {
      textContent: to,
      duration,
      ease: EASING.brand,
      snap: { textContent: 1 },
      overwrite: 'auto',
    }
  );
}

export function animateProgressBar(
  element: Element,
  to: number,
  duration = 1
): gsap.core.Tween {
  return gsap.to(element, {
    scaleX: to / 100,
    duration,
    ease: EASING.brand,
    transformOrigin: 'left center',
    overwrite: 'auto',
  });
}
