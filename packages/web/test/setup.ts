import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: {
      div: 'div',
      span: 'span',
      button: 'button',
      section: 'section',
      article: 'article',
      nav: 'nav',
      ul: 'ul',
      li: 'li',
      p: 'p',
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      svg: 'svg',
      path: 'path',
      circle: 'circle',
      rect: 'rect',
      g: 'g',
      a: 'a',
      header: 'header',
      img: 'img',
    },
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useMotionValue: (val: number) => ({ get: () => val, set: vi.fn(), onChange: vi.fn() }),
    useTransform: () => ({ get: () => 0 }),
    useScroll: () => ({ scrollY: { get: () => 0 }, scrollYProgress: { get: () => 0 } }),
    useSpring: (val: number) => ({ get: () => val, set: vi.fn() }),
    useMotionValueEvent: vi.fn(),
  };
});

vi.mock('@react-three/fiber', () => ({
  Canvas: 'canvas',
  useFrame: vi.fn(),
  useThree: () => ({ size: { width: 1920, height: 1080 }, viewport: { width: 1920, height: 1080 } }),
}));

vi.mock('@react-three/drei', () => ({
  MeshDistortMaterial: 'meshDistortMaterial',
  Float: 'float',
  Environment: 'environment',
  Stats: 'stats',
}));

vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: 'effectComposer',
  Bloom: 'bloom',
  Noise: 'noise',
  Vignette: 'vignette',
}));

class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
