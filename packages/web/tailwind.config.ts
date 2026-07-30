import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  future: { hoverOnlyWhenSupported: true },
  theme: {
    // ============================================================
    // GRID SYSTEM
    // ============================================================
    screens: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem', xl: '2.5rem', '2xl': '3rem' },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px' },
    },
    extend: {
      // ============================================================
      // COLOR TOKENS
      // ============================================================
      colors: {
        // Brand Blue — Laboratory Blue
        brand: {
          50:  '#EFF8FF', 100: '#DBEEFE', 200: '#BFDDFE', 300: '#93C5FD',
          400: '#60A5FA', 500: '#0077B6', 600: '#005F8F', 700: '#004E72',
          800: '#003853', 900: '#002838', 950: '#001A25',
          DEFAULT: '#0077B6',
        },
        // Accent Teal — Precision Teal
        accent: {
          50:  '#F0FDF9', 100: '#CCFBEF', 200: '#99F6DE', 300: '#5EEAD4',
          400: '#2DD4BF', 500: '#10B981', 600: '#059669', 700: '#047857',
          800: '#065F46', 900: '#064E3B',
          DEFAULT: '#10B981',
        },
        // Saffron Gold — Premium Gold
        saffron: {
          50:  '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
          400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
          800: '#92400E', 900: '#78350F',
          DEFAULT: '#F59E0B',
        },
        // Surface Neutrals
        surface: {
          0:   '#FFFFFF', 50:  '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0',
          300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B', 600: '#475569',
          700: '#334155', 800: '#1E293B', 900: '#0F172A', 950: '#020617',
        },
        // Semantic — Success
        success: {
          50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC',
          400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
          DEFAULT: '#22C55E',
        },
        // Semantic — Warning
        warning: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
          400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
          DEFAULT: '#F59E0B',
        },
        // Semantic — Danger
        danger: {
          50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5',
          400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C',
          DEFAULT: '#EF4444',
        },
        // Semantic — Info
        info: {
          50: '#EFF8FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
          400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
          DEFAULT: '#3B82F6',
        },
        // Border color
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // ============================================================
      // TYPOGRAPHY SCALE
      // ============================================================
      fontSize: {
        'display-lg': ['3.75rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }],
        'display':    ['3rem',     { lineHeight: '1.15', fontWeight: '800', letterSpacing: '-0.02em' }],
        'h1':         ['2.25rem',  { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'h2':         ['1.875rem', { lineHeight: '1.25', fontWeight: '700' }],
        'h3':         ['1.5rem',   { lineHeight: '1.3', fontWeight: '600' }],
        'h4':         ['1.25rem',  { lineHeight: '1.35', fontWeight: '600' }],
        'h5':         ['1rem',     { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg':    ['1.125rem', { lineHeight: '1.65', fontWeight: '400' }],
        'body':       ['1rem',     { lineHeight: '1.65', fontWeight: '400' }],
        'body-sm':    ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption':    ['0.75rem',  { lineHeight: '1.5', fontWeight: '400' }],
        'overline':   ['0.6875rem',{ lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.1em' }],
        'mono':       ['0.875rem', { lineHeight: '1.5', fontWeight: '400', fontFamily: 'var(--font-mono)' }],
      },
      fontFamily: {
        sans: ['var(--font-arabic)', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        display: ['var(--font-english)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
        arabic: ['IBM Plex Sans Arabic', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
        english: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },

      // ============================================================
      // SPACING SYSTEM (4px base)
      // ============================================================
      spacing: {
        '4.5': '1.125rem', // 18px
        '13': '3.25rem',   // 52px
        '15': '3.75rem',   // 60px
        '18': '4.5rem',    // 72px
        '22': '5.5rem',    // 88px
        '26': '6.5rem',    // 104px
        '30': '7.5rem',    // 120px
        '34': '8.5rem',    // 136px
        '38': '9.5rem',    // 152px
        '42': '10.5rem',   // 168px
        '46': '11.5rem',   // 184px
        '50': '12.5rem',   // 200px
        '54': '13.5rem',   // 216px
        '58': '14.5rem',   // 232px
        '62': '15.5rem',   // 248px
        '66': '16.5rem',   // 264px
        '70': '17.5rem',   // 280px
        '74': '18.5rem',   // 296px
        '78': '19.5rem',   // 312px
        '82': '20.5rem',   // 328px
        '86': '21.5rem',   // 344px
        '90': '22.5rem',   // 360px
        '94': '23.5rem',   // 376px
        '98': '24.5rem',   // 392px
        '100': '25rem',    // 400px
        '104': '26rem',    // 416px
        '108': '27rem',    // 432px
        'sidebar': '16rem',
        'sidebar-collapsed': '4.5rem',
      },

      // ============================================================
      // BORDER RADIUS
      // ============================================================
      borderRadius: {
        'xs': '0.125rem',   // 2px
        'sm': '0.25rem',    // 4px
        'md': '0.375rem',   // 6px
        'lg': '0.5rem',     // 8px
        'xl': '0.75rem',    // 12px
        '2xl': '1rem',      // 16px
        '3xl': '1.25rem',   // 20px
        '4xl': '1.5rem',    // 24px
        '5xl': '2rem',      // 32px
      },

      // ============================================================
      // SHADOW SYSTEM
      // ============================================================
      boxShadow: {
        'xs':     '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        '2xs':    '0 1px 2px 0 rgb(0 0 0 / 0.02)',
        'sm':     '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
        'DEFAULT':'0 1px 3px 0 rgb(0 0 0 / 0.04), 0 2px 4px -1px rgb(0 0 0 / 0.03)',
        'md':     '0 2px 4px 0 rgb(0 0 0 / 0.02), 0 4px 8px -1px rgb(0 0 0 / 0.04)',
        'lg':     '0 4px 6px -1px rgb(0 0 0 / 0.04), 0 8px 16px -2px rgb(0 0 0 / 0.04)',
        'xl':     '0 8px 16px -2px rgb(0 0 0 / 0.06), 0 16px 32px -4px rgb(0 0 0 / 0.04)',
        '2xl':    '0 12px 24px -4px rgb(0 0 0 / 0.08), 0 24px 48px -8px rgb(0 0 0 / 0.04)',
        '3xl':    '0 16px 32px -4px rgb(0 0 0 / 0.10), 0 32px 64px -8px rgb(0 0 0 / 0.06)',
        'brand':  '0 4px 16px -2px rgb(0 119 182 / 0.20)',
        'brand-lg':'0 8px 24px -4px rgb(0 119 182 / 0.30)',
        'brand-glow':'0 0 24px rgb(0 119 182 / 0.15)',
        'success':'0 4px 16px -2px rgb(34 197 94 / 0.20)',
        'danger': '0 4px 16px -2px rgb(239 68 68 / 0.20)',
        'inner':  'inset 0 2px 4px 0 rgb(0 0 0 / 0.04)',
        'glass':  '0 8px 32px rgb(0 0 0 / 0.08)',
        'elevated':'0 8px 16px rgb(0 0 0 / 0.04), 0 16px 48px rgb(0 0 0 / 0.04)',
        'none':   'none',
      },

      // ============================================================
      // ANIMATION / MOTION
      // ============================================================
      keyframes: {
        'fade-in':     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-out':    { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        'fade-in-up':  { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-down':{ '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-left':{ '0%': { opacity: '0', transform: 'translateX(8px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'fade-in-right':{ '0%': { opacity: '0', transform: 'translateX(-8px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'scale-in':    { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'scale-out':   { '0%': { opacity: '1', transform: 'scale(1)' }, '100%': { opacity: '0', transform: 'scale(0.95)' } },
        'slide-in-right':{ '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        'slide-in-left': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        'slide-in-up':   { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        'slide-in-down': { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(0)' } },
        'spin':        { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        'pulse':       { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        'bounce':      { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
        'shimmer':     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'count-up':    { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'draw-check':  { '0%': { 'stroke-dashoffset': '20' }, '100%': { 'stroke-dashoffset': '0' } },
        'ripple':      { '0%': { transform: 'scale(0)', opacity: '1' }, '100%': { transform: 'scale(4)', opacity: '0' } },
        'toast-in':    { '0%': { opacity: '0', transform: 'translateX(100%) scale(0.95)' }, '100%': { opacity: '1', transform: 'translateX(0) scale(1)' } },
        'toast-out':   { '0%': { opacity: '1', transform: 'translateX(0) scale(1)' }, '100%': { opacity: '0', transform: 'translateX(100%) scale(0.95)' } },
        'accordion-down':{ '0%': { height: '0' }, '100%': { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':  { '0%': { height: 'var(--radix-accordion-content-height)' }, '100%': { height: '0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'fade-in-down': 'fade-in-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'scale-out': 'scale-out 0.15s ease-in',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-up': 'slide-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin': 'spin 1s linear infinite',
        'spin-slow': 'spin 2s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'count-up': 'count-up 0.5s ease-out',
        'toast-in': 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-out': 'toast-out 0.2s ease-in',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },

      // ============================================================
      // Z-INDEX SCALE
      // ============================================================
      zIndex: {
        'below': '-1',
        'base': '0',
        'dropdown': '50',
        'sticky': '100',
        'overlay': '200',
        'modal': '300',
        'popover': '400',
        'toast': '500',
        'tooltip': '600',
        'max': '9999',
      },

      // ============================================================
      // TRANSITION TIMING
      // ============================================================
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      transitionTimingFunction: {
        'brand': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};

export default config;
