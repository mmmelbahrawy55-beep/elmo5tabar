# AL MOKHTABAR — Award-Winning Homepage Design Specification

> **Design Philosophy:** Precision meets Luxury. Every pixel communicates trust.  
> **Target:** Awwwards, FWA, CSS Design Awards quality.  
> **Score Target:** Lighthouse 100 across all metrics.

---

## Design Principles

1. **Precision** — Clean geometry, mathematical spacing, exact alignment
2. **Trust** — Every element reinforces credibility and authority
3. **Motion** — Purposeful animation that guides, never distracts
4. **Premium** — Luxury feel without sacrificing healthcare clarity
5. **Bilingual** — Seamless RTL/LTR without layout compromise

---

## Color System

```
Primary Blue:       #0077B6  (Pantone 3005 C — Scientific Authority)
Deep Navy:          #023E8A  (Trust & Stability)
Teal Innovation:    #10B981  (Health & Vitality)
Saffron Gold:       #F59E0B  (Luxury Accent)
Pure White:         #FFFFFF
Off White:          #F8FAFC
Surface Light:      #F1F5F9
Surface Medium:     #E2E8F0
Text Primary:       #0F172A
Text Secondary:     #64748B
Glass White:        rgba(255, 255, 255, 0.12)
Glass Border:       rgba(255, 255, 255, 0.18)
Glass Shadow:       rgba(0, 0, 0, 0.08)
```

## Typography Scale

```
Hero Title:         clamp(3rem, 6vw, 5.5rem)   — IBM Plex Sans Arabic (800)
Section Title:      clamp(2rem, 3.5vw, 3.5rem)  — IBM Plex Sans Arabic (700)
Subtitle:           clamp(1rem, 1.5vw, 1.25rem)  — Plus Jakarta Sans (400)
Body:               1rem (16px)                   — Plus Jakarta Sans (400)
Caption:            0.875rem (14px)               — Plus Jakarta Sans (500)
Stat Number:        clamp(2.5rem, 5vw, 4rem)     — JetBrains Mono (700)
```

## Spacing System (8px base)

```
4:   0.25rem   (4px)
8:   0.5rem    (8px)
12:  0.75rem   (12px)
16:  1rem      (16px)
20:  1.25rem   (20px)
24:  1.5rem    (24px)
32:  2rem      (32px)
40:  2.5rem    (40px)
48:  3rem      (48px)
64:  4rem      (64px)
80:  5rem      (80px)
96:  6rem      (96px)
128: 8rem      (128px)
160: 10rem     (160px)
```

## Animation Curves

```
Ease Out Expo:    cubic-bezier(0.16, 1, 0.3, 1)
Ease Out Quint:   cubic-bezier(0.22, 1, 0.36, 1)
Ease In Out:      cubic-bezier(0.65, 0, 0.35, 1)
Spring:           cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

# Component Hierarchy & Specifications

## Page Structure

```
<body>
  ├── <Preloader />                    — Branded loading screen
  ├── <Navigation />                   — Fixed glassmorphism navbar
  ├── <HeroSection />                  — Full-screen with particles
  ├── <TrustIndicators />              — Accreditation bar
  ├── <StatisticsSection />            — Animated counters
  ├── <ServicesSection />              — Featured services grid
  ├── <DepartmentsSection />           — Department carousel
  ├── <PopularTestsSection />          — Test catalog preview
  ├── <HomeVisitSection />             — Home visit CTA
  ├── <CorporateSection />             — Corporate services
  ├── <WhyChooseSection />             — Value propositions
  ├── <TechnologySection />            — Tech showcase
  ├── <SpecialistsSection />           — Doctor cards
  ├── <EquipmentSection />             — Equipment showcase
  ├── <TestimonialsSection />          — Patient reviews
  ├── <InsuranceSection />             — Partner logos
  ├── <ArticlesSection />              — Blog preview
  ├── <AppDownloadSection />           — Mobile app CTA
  ├── <BookingCTASection />            — Final CTA
  ├── <MapSection />                   — Branch locations
  ├── <ContactSection />               — Contact form
  ├── <PremiumFooter />                — Full footer
  └── <FloatingActions />              — FAB + scroll-to-top
</body>
```

---

## 1. Preloader

```
Visual:
┌─────────────────────────────────────────┐
│                                         │
│           [Logo Animation]              │
│         Flask icon morphs in            │
│         Brand name fades up             │
│                                         │
│         ████████░░░░  65%               │
│                                         │
└─────────────────────────────────────────┘

Behavior:
- Logo flask icon draws itself (SVG stroke animation)
- Brand name fades up with slide
- Progress bar fills smoothly
- Entire screen fades out with scale + blur
- Duration: 2-3 seconds max
- Skip button appears after 1s

Implementation:
- CSS keyframes for SVG stroke
- requestAnimationFrame for progress
- will-change: opacity, transform
```

---

## 2. Navigation

```
Desktop (Scrolled):
┌─────────────────────────────────────────────────────────┐
│ 🏛 Logo   |  Services  Tests  Book  About  Contact  |  🌐 🔔 [Book]  │
│           │  (links)                                  │  (actions)     │
└─────────────────────────────────────────────────────────┘

Desktop (Top of page - Transparent):
┌─────────────────────────────────────────────────────────┐
│ 🏛 Logo (white)  |  (white links)  |  🌐 [Book CTA]   │
│ (transparent bg)                                        │
└─────────────────────────────────────────────────────────┘

Mobile:
┌─────────────────────────────┐
│ 🏛 Logo (left)    🌐  ☰ (right) │
└─────────────────────────────┘

Behavior:
- Transparent at top, glassmorphism on scroll (> 80px)
- Backdrop-filter: blur(20px) + saturate(180%)
- Smooth transition: background 0.3s, box-shadow 0.3s
- Active link: brand-500 underline with 2px
- Book button: gradient brand-500 → brand-600, hover scale 1.02
- Mobile menu: Full-screen overlay with staggered animations
- Language toggle: Animated pill switch (AR/EN)

Sticky behavior:
- Hide on scroll down, show on scroll up
- Minimum height: 64px (desktop), 56px (mobile)
- z-index: 1000
```

---

## 3. Hero Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │  Particle animation layer (medical molecules)     │  │
│  │                                                   │  │
│  │  ┌─────────────────────┐  ┌───────────────────┐  │  │
│  │  │                     │  │                   │  │  │
│  │  │  Heading (RTL)      │  │  3D Flask Image   │  │  │
│  │  │  "المختبر"          │  │  (floating,       │  │  │
│  │  │  "دقة في كل تفصيلة" │  │   rotating slowly)│  │  │
│  │  │                     │  │                   │  │  │
│  │  │  Subtitle           │  └───────────────────┘  │  │
│  │  │  Body text          │                          │  │
│  │  │                     │                          │  │
│  │  │  [Book Now] [Tests] │                          │  │
│  │  │                     │                          │  │
│  │  │  Trust badges row   │                          │  │
│  │  │  ISO | CAP | 15K+   │                          │  │
│  │  └─────────────────────┘                          │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Scroll indicator ↓ (bouncing chevron)                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

Background:
- Gradient: deep-navy → brand-700 → brand-500 (135deg)
- Animated gradient overlay (subtle hue shift, 20s loop)
- Medical molecule particles (canvas or CSS)
  - 30-50 floating circles with connecting lines
  - Subtle parallax on mouse move
  - Opacity: 0.1-0.3
- Optional: 3D DNA helix animation (Three.js, lightweight)

Text Animations (GSAP):
- Heading: Split text, each character slides up with stagger (0.03s)
- Subtitle: Fade up, delay 0.4s
- CTA buttons: Scale from 0.8 + fade, delay 0.6s
- Trust badges: Slide up, delay 0.8s

3D Element:
- CSS 3D transform on flask image
- Subtle float animation (translateY oscillation)
- Mouse parallax (move 10-20px based on cursor)
- Drop shadow: 0 25px 60px rgba(0,0,0,0.3)

CTA Buttons:
- Primary: "احجز الآن" — Gradient fill, white text, glow on hover
- Secondary: "تصفح التحاليل" — Glass border, white text
- Both: 48px height, 24px horizontal padding, rounded-2xl
- Hover: scale(1.02), shadow intensifies, border becomes solid
- Click: scale(0.98) spring animation

Trust Badges (below CTAs):
- Row of 4 items: ISO 15189 | CAP | +15,000 tests | ⭐ 4.9
- Each: Glass card, icon + text, subtle border
- Stagger animation on load

Scroll Indicator:
- Bottom center
- Bouncing chevron (CSS animation, 2s loop)
- Text: "اكتشف المزيد" (Discover More)
- Fades out on scroll (> 200px)
```

---

## 4. Trust Indicators Bar

```
Layout:
┌─────────────────────────────────────────────────────────┐
│  🏅 ISO 15189  |  🏅 CAP  |  🏅 CBAHI  |  🏅 ZATCA  │
└─────────────────────────────────────────────────────────┘

Visual:
- Full-width bar, surface-light background
- Horizontal scroll on mobile (snap)
- Each item: logo/icon + certification name + "معتمد" badge
- Subtle gradient separator between items
- Glass border bottom

Animation:
- Scroll-triggered: items fade in from bottom with stagger
- Number count-up for any numeric badges
- Hover: subtle scale(1.05) + shadow
```

---

## 5. Statistics Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "أرقام تتحدث عن جودتنا"                               │
│  "Numbers That Speak Our Quality"                       │
│                                                         │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │  15,247  │   98.7%  │    45    │  150K+   │         │
│  │  فحص شهرياً│ دقة النتائج│  فرع    │ مريض سعيد│         │
│  │  Tests/Mo │ Accuracy │ Branches │ Patients │         │
│  │  [counter]│  [counter]│ [counter]│ [counter]│         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

Background:
- Gradient section (brand-600 → deep-navy)
- Subtle mesh gradient overlay
- Medical pattern (faint crosses, molecules)

Counter Animation:
- GSAP ScrollTrigger
- Start counting when section enters viewport
- Duration: 2s per counter
- Easing: easeOutExpo
- Format: Arabic numerals (١٥,٢٤٧) or Western (15,247) based on locale
- Suffix: + for approximate numbers

Card Style:
- Glassmorphism cards on gradient background
- Large number: JetBrains Mono, 4rem, white, bold
- Label: Plus Jakarta Sans, 0.875rem, white/70
- Icon: 48px circle, brand-300/20 bg, brand-300 icon
- Hover: translateY(-4px), shadow-glow

Mobile:
- 2x2 grid (instead of 4 columns)
- Numbers: clamp to 2.5rem
- Cards stack vertically with gap
```

---

## 6. Services Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "خدماتنا المخبرية"                                     │
│  "Our Laboratory Services"                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [All] [Hematology] [Chemistry] [Hormones] ... │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│  │  [icon]   │ │  [icon]   │ │  [icon]   │            │
│  │           │ │           │ │           │            │
│  │ Hematology│ │ Chemistry │ │ Hormones  │            │
│  │           │ │           │ │           │            │
│  │CBC, ESR.. │ │Glucose..  │ │TSH, T4.. │            │
│  │           │ │           │ │           │            │
│  │ 15 tests  │ │ 22 tests  │ │ 12 tests  │            │
│  │           │ │           │ │           │            │
│  │ من 150 ر.س│ │ من 200 ر.س│ │ من 320 ر.س│            │
│  │           │ │           │ │           │            │
│  │ [المزيد →]│ │ [المزيد →]│ │ [المزيد →]│            │
│  └───────────┘ └───────────┘ └───────────┘            │
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│  │ Microbio  │ │ Immunology│ │ Genetics  │            │
│  │           │ │           │ │           │            │
│  │ ...       │ │ ...       │ │ ...       │            │
│  └───────────┘ └───────────┘ └───────────┘            │
│                                                         │
│  [عرض جميع الخدمات ←]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Category Filter:
- Horizontal pill buttons
- Active: brand-500 fill, white text
- Inactive: surface-100 fill, surface-600 text
- Smooth width animation on active change

Card Design:
- White background, rounded-2xl
- Border: 1px surface-100
- Icon: 56px circle, gradient brand-50 → brand-100, brand-600 icon
- Title: 1.125rem, font-semibold, surface-900
- Description: 0.875rem, surface-500, 2 lines max (line-clamp-2)
- Test count: Badge, secondary variant
- Price: "من X ر.س" — brand-600, font-semibold
- Link: "المزيد ←" — brand-600, hover brand-700

Animation:
- Cards: stagger fade-up on scroll (0.1s delay each)
- Hover: translateY(-8px), shadow-xl, border-brand-200
- Icon: subtle rotate(5deg) on hover
- Price: scale animation on hover

Grid:
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column (full width)
- Gap: 24px
```

---

## 7. Departments Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "أقسامنا"          [السابق] [التالي]                   │
│  "Our Departments"                                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ← Scrollable carousel →                        │   │
│  │                                                  │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐  │   │
│  │  │            │ │            │ │            │  │   │
│  │  │  [Photo]   │ │  [Photo]   │ │  [Photo]   │  │   │
│  │  │            │ │            │ │            │  │   │
│  │  │ Hematology │ │ Chemistry  │ │ Endocrino- │  │   │
│  │  │            │ │            │ │ logy       │  │   │
│  │  │ Blood      │ │ Chemical   │ │ Hormonal   │  │   │
│  │  │ analysis   │ │ analysis   │ │ tests      │  │   │
│  │  │            │ │            │ │            │  │   │
│  │  │ [15 tests] │ │ [22 tests] │ │ [12 tests] │  │   │
│  │  └────────────┘ └────────────┘ └────────────┘  │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ● ○ ○ ○ ○ (pagination dots)                           │
│                                                         │
└─────────────────────────────────────────────────────────┘

Card Design:
- Aspect ratio: 4:5 (portrait photo)
- Photo: Cover, rounded-2xl, subtle zoom on hover (scale 1.05)
- Overlay gradient: transparent → deep-navy/80 (bottom 60%)
- Text: White, positioned at bottom
- Department name: 1.25rem, bold
- Brief description: 0.875rem, white/70
- Test count badge: Glass badge

Carousel:
- CSS scroll-snap (no JS dependency)
- snap-type: x mandatory
- Scroll-padding: 24px
- Navigation arrows: Absolute positioned, glass circles
- Dots: Active = brand-500, Inactive = surface-300
- Auto-play: Pause on hover, resume on leave
- Speed: 5000ms interval

Mobile:
- Full-width cards with horizontal scroll
- Snap to each card
- Height: 320px
```

---

## 8. Popular Tests Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "التحاليل الأكثر طلباً"                                │
│  "Most Popular Tests"                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Test name    │ Category │ Price  │ Time │ CTA  │   │
│  ├───────────────┼──────────┼────────┼──────┼──────┤   │
│  │ 🔬 CBC        │ Hemato   │ 150 ر.س│ 2hr  │ احجز │   │
│  │ 🔬 Lipid      │ Chem     │ 200 ر.س│ 4hr  │ احجز │   │
│  │ 🔬 TSH        │ Endo     │ 320 ر.س│ 6hr  │ احجز │   │
│  │ 🔬 HbA1c      │ Endo     │ 180 ر.س│ 3hr  │ احجز │   │
│  │ 🔬 Vitamin D  │ Endo     │ 280 ر.س│ 8hr  │ احجز │   │
│  │ 🔬 Liver      │ Chem     │ 250 ر.س│ 4hr  │ احجز │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [عرض جميع التحاليل →]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Table Design:
- Alternating row backgrounds: white / surface-50
- Row hover: brand-50/50 background
- Mobile: Cards instead of table

Desktop Table:
- Test name: Icon + name (bold) + Arabic name
- Category: Badge (color-coded per category)
- Price: JetBrains Mono, brand-600
- Time: Surface-500, with clock icon
- CTA: "احجز الآن" button, ghost variant, brand on hover

Mobile Cards:
┌─────────────────────────────┐
│ 🔬 CBC — صورة دم شاملة     │
│ Hematology    150 ر.س      │
│ ⏱️ 2 ساعات                  │
│ ──────────────────────────  │
│ [احجز الآن]                │
└─────────────────────────────┘

Animation:
- Rows slide in from right (RTL) with stagger
- Price numbers count up
- CTA button: pulse animation on first view
```

---

## 9. Home Visit Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │              │  │                          │  │   │
│  │  │  [Photo:     │  │  فحوصات منزلية           │  │   │
│  │  │  nurse at    │  │  "Health Comes to You"   │  │   │
│  │  │  home]       │  │                          │  │   │
│  │  │              │  │  ✅ فريق طبي معتمد       │  │   │
│  │  │              │  │  ✅ معدات متنقلة          │  │   │
│  │  │              │  │  ✅ نتائج خلال 24 ساعة    │  │   │
│  │  │              │  │  ✅ خدمة على مدار الساعة  │  │   │
│  │  │              │  │                          │  │   │
│  │  │              │  │  [احجز فحص منزلي ←]      │  │   │
│  │  └──────────────┘  └──────────────────────────┘  │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Background:
- Surface-light or very subtle gradient
- Left image: Rounded-2xl, 50% width on desktop, 100% on mobile
- Right content: Vertical center, 48px padding

Features List:
- Checkmark icon (brand-500) + text
- Stagger animation on scroll
- Each item: slide in from right with 0.1s delay

CTA Button:
- Primary gradient
- Arrow icon animated on hover (slide right)
- Glow effect on hover
```

---

## 10. Corporate Services Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "خدمات الشركات"                                        │
│  "Corporate Solutions"                                  │
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│  │  [icon]   │ │  [icon]   │ │  [icon]   │            │
│  │           │ │           │ │           │            │
│  │ Workforce │ │ Executive │ │ On-site   │            │
│  │ Screening │ │ Health    │ │ Services  │            │
│  │           │ │ Packages  │ │           │            │
│  │ Comprehensive│ │Premium  │ │ Mobile    │            │
│  │ employee  │ │ health    │ │ lab at    │            │
│  │ health    │ │ checkups  │ │ your      │            │
│  │ checks    │ │ for       │ │ office    │            │
│  │           │ │ executives│ │           │            │
│  │ [Learn →] │ │ [Learn →] │ │ [Learn →] │            │
│  └───────────┘ └───────────┘ └───────────┘            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  "Partner with us for your corporate health     │   │
│  │   needs. Flexible packages, dedicated support."  │   │
│  │                                                  │   │
│  │  [Request a Quote]  [View Packages]             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Card Design:
- White bg, rounded-2xl, border
- Icon: 64px, gradient bg
- Hover: border-brand-300, shadow-lg
- Bottom CTA: text link with arrow

Bottom CTA Bar:
- Glass card on gradient background
- Two buttons: Ghost + Primary
```

---

## 11. Why Choose Us Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "لماذا المختبر؟"                                       │
│  "Why Al Mokhtabar?"                                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐           │   │
│  │  │  1  │──│  2  │──│  3  │──│  4  │           │   │
│  │  └─────┘  └─────┘  └─────┘  └─────┘           │   │
│  │                                                   │   │
│  │  (Connected line between numbers — SVG)           │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  │  🎯  │ │  ⚡  │ │  🔒  │ │  🤖  │ │  💰  │ │  📱  │
│  │Dounce│ │ Speed│ │Secure│ │  AI  │ │Value │ │Digit.│
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
│                                                         │
└─────────────────────────────────────────────────────────┘

Feature Cards:
- 6 items in 3x2 grid (desktop), 2x3 (tablet), 1x6 (mobile)
- Each card:
  - Number: 48px, brand-500, JetBrains Mono, semi-transparent
  - Icon: 48px, gradient circle
  - Title: 1rem, font-semibold
  - Description: 0.875rem, surface-500, 3 lines max
- Connected line: SVG path between numbers (desktop only)
  - Brand-200 color, animated dash-offset on scroll

Animation:
- Numbers count up
- Cards stagger in
- Connecting line draws itself (stroke-dasharray animation)
```

---

## 12. Technology Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "تقنيتنا المتقدمة"                                     │
│  "Advanced Technology"                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │                                           │  │   │
│  │  │  [3D/Interactive Equipment Visualization] │  │   │
│  │  │   Rotating analyzer with hotspots         │  │   │
│  │  │                                           │  │   │
│  │  │  Hotspot 1 ──→ "Automated Hematology"    │  │   │
│  │  │  Hotspot 2 ──→ "Mass Spectrometry"       │  │   │
│  │  │  Hotspot 3 ──→ "Real-time PCR"           │  │   │
│  │  │                                           │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  │                                                   │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │   │
│  │  │ AI   │ │ HL7  │ │ IoT  │ │ Cloud│           │   │
│  │  │Analy.│ │Inter.│ │Sensors│ │Based │           │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘           │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

3D Visualization:
- CSS 3D perspective on equipment image
- Hotspot dots: Pulsing brand-500 circles
- On hover: Info card slides out
- Alternative: Static image with interactive hotspots (CSS)

Tech Feature Cards:
- Horizontal row of 4
- Each: Icon + title + brief
- Glass background
- Hover: scale(1.05), glow
```

---

## 13. Specialists Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "فريقنا الطبي"           [السابق] [التالي]            │
│  "Our Medical Team"                                     │
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│  │           │ │           │ │           │            │
│  │  [Photo]  │ │  [Photo]  │ │  [Photo]  │            │
│  │           │ │           │ │           │            │
│  │  Dr.      │ │  Dr.      │ │  Dr.      │            │
│  │  Sarah    │ │  Mohammed │ │  Fatima   │            │
│  │  Al-Ahmad │ │  Al-Rashid│ │  Al-Zahra │            │
│  │           │ │           │ │           │            │
│  │  Hemato-  │ │  Clinical │ │  Endocri- │            │
│  │  logy     │ │  Chemistry│ │  nology   │            │
│  │           │ │           │ │           │            │
│  │  15 years │ │  12 years │ │  18 years │            │
│  │           │ │           │ │           │            │
│  └───────────┘ └───────────┘ └───────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘

Card Design:
- Photo: 1:1 aspect ratio, rounded-2xl, object-cover
- On hover: slight zoom, overlay with "عرض الملف" (View Profile)
- Name: 1.125rem, font-semibold
- Specialty: brand-600, 0.875rem
- Experience: surface-500, 0.875rem, clock icon

Carousel:
- Same as departments carousel
- CSS scroll-snap
```

---

## 14. Equipment Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "معداتنا المخبرية"                                     │
│  "Laboratory Equipment"                                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ← Large equipment showcase (tabbed) →           │   │
│  │                                                   │   │
│  │  [Hematology] [Chemistry] [Microbiology] [Other] │   │
│  │                                                   │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │                                           │  │   │
│  │  │  [Equipment Photo]    Specs & Features    │  │   │
│  │  │                       ────────────────    │  │   │
│  │  │  Sysmex XN-1000       ✅ Throughput: ...  │  │   │
│  │  │  Hematology Analyzer  ✅ Accuracy: ...    │  │   │
│  │  │                       ✅ Automation: ...  │  │   │
│  │  │                       ✅ Certification: ..│  │   │
│  │  │                                           │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  │                                                   │   │
│  │  ● ○ ○ ○ (pagination)                            │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Tab Design:
- Pill buttons, same as services section
- Active: brand-500, white text

Showcase:
- Left: Large equipment photo (60% width)
- Right: Specifications list (40%)
- Photo: rounded-2xl, subtle shadow
- Specs: Checkmark list with values

Animation:
- Photo crossfade on tab switch
- Specs slide in from right
```

---

## 15. Testimonials Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "ماذا يقول مرضانا"                                     │
│  "What Our Patients Say"                                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │                                           │  │   │
│  │  │  "Exceptional service and fast results.   │  │   │
│  │  │   The staff is professional and caring."   │  │   │
│  │  │                                           │  │   │
│  │  │  ┌──────┐  أحمد محمد                      │  │   │
│  │  │  │Avatar│  ⭐⭐⭐⭐⭐                       │  │   │
│  │  │  └──────┘  Verified Patient               │  │   │
│  │  │                                           │  │   │
│  │  │  ● ○ ○ ○ ○                                │  │   │
│  │  │                                           │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  │                                                   │   │
│  │  Google Rating: ⭐ 4.9/5 (2,340 reviews)        │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Card Design:
- Large glassmorphism card
- Quote: 1.25rem, italic, surface-700
- Quote mark: 4rem, brand-100, absolute positioned
- Avatar: 56px circle
- Name: font-semibold
- Rating: Star icons, gold-500
- "Verified Patient" badge

Carousel:
- Auto-play (5s)
- Pause on hover
- Swipe on mobile
- Dots navigation
- Fade transition (not slide)

Google Rating:
- Below carousel
- Google logo + rating + review count
- Links to Google Reviews page
```

---

## 16. Insurance Partners

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "شركاء التأمين"                                        │
│  "Insurance Partners"                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  [Logo] [Logo] [Logo] [Logo] [Logo] [Logo]      │   │
│  │  [Logo] [Logo] [Logo] [Logo] [Logo] [Logo]      │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  "نتعامل مع جميع شركات التأمين الرئيسية"                │
│                                                         │
└─────────────────────────────────────────────────────────┘

Logo Display:
- Grayscale by default
- Color on hover
- Infinite scroll animation (CSS)
- 2 rows, offset for visual interest

Animation:
- Smooth horizontal scroll (CSS marquee)
- Speed: 30px/second
- Pause on hover
- Duplicate logos for seamless loop
```

---

## 17. Articles Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "المقالات الطبية"        [عرض المقالات الكلية →]       │
│  "Medical Articles"                                     │
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│  │           │ │           │ │           │            │
│  │  [Image]  │ │  [Image]  │ │  [Image]  │            │
│  │           │ │           │ │           │            │
│  │  Category │ │  Category │ │  Category │            │
│  │  Title... │ │  Title... │ │  Title... │            │
│  │           │ │           │ │           │            │
│  │  5 min    │ │  8 min    │ │  4 min    │            │
│  │  read     │ │  read     │ │  read     │            │
│  │           │ │           │ │           │            │
│  │  [Read →] │ │  [Read →] │ │  [Read →] │            │
│  └───────────┘ └───────────┘ └───────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘

Card Design:
- Image: 16:9 aspect ratio, rounded-2xl top
- Category: Badge, positioned on image (top-right)
- Title: 1.125rem, font-semibold, 2 lines max
- Read time: Surface-500, clock icon
- Link: "اقرأ المزيد →" brand-600

Animation:
- Cards: stagger fade-up
- Image: scale(1.05) on hover
- Category badge: slide in from right
```

---

## 18. App Download Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │              │  │                          │  │   │
│  │  │  [Phone      │  │  تطبيق المختبر           │  │   │
│  │  │  Mockup]     │  │  "Your Lab in Your       │  │   │
│  │  │              │  │   Pocket"                │  │   │
│  │  │  App         │  │                          │  │   │
│  │  │  screenshots │  │  ✅ حجز فوري             │  │   │
│  │  │  floating    │  │  ✅ نتائج فورية          │  │   │
│  │  │              │  │  ✅ تذكيرات ذكية         │  │   │
│  │  │              │  │  ✅ دفع إلكتروني          │  │   │
│  │  │              │  │                          │  │   │
│  │  │              │  │  [App Store] [Google Pay]│  │   │
│  │  │              │  │                          │  │   │
│  │  └──────────────┘  └──────────────────────────┘  │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Phone Mockup:
- CSS 3D perspective
- Floating animation
- Screenshots cycle through (fade)
- Drop shadow: 0 30px 60px rgba(0,0,0,0.3)

App Store Buttons:
- Official badges (SVG)
- Hover: scale(1.05)
- Subtle glow on hover

Background:
- Gradient or mesh pattern
- Subtle particles
```

---

## 19. Booking CTA Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  "احجز فحصك المخبري الآن"                        │   │
│  │  "Book Your Lab Test Now"                         │   │
│  │                                                   │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │  📱 +966 50 123 4567                    │    │   │
│  │  │  📧 info@almokhtabar.com                │    │   │
│  │  │  🏢 45 فرع في المملكة                   │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │                                                   │   │
│  │  [احجز موعدك الآن ←]  [اتصل بنا]                │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Design:
- Full-width gradient (brand-600 → deep-navy)
- Glass card with large text
- CTA button: Large (56px height), white, with glow
- Contact info: Glass cards with icons
- Background: Animated mesh gradient
```

---

## 20. Map Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "فروعنا"                                               │
│  "Our Branches"                                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  ┌──────────┐  ┌──────────────────────────────┐  │   │
│  │  │ Branch   │  │                              │  │   │
│  │  │ List     │  │     [Interactive Map]        │  │   │
│  │  │          │  │     (Google Maps / Mapbox)    │  │   │
│  │  │ ● Riyadh │  │                              │  │   │
│  │  │ ○ Jeddah │  │     Markers for each branch  │  │   │
│  │  │ ○ Dammam │  │     Click → Info window      │  │   │
│  │  │ ○ Mecca  │  │                              │  │   │
│  │  │          │  │                              │  │   │
│  │  │ [View    │  │                              │  │   │
│  │  │  All →]  │  │                              │  │   │
│  │  └──────────┘  └──────────────────────────────┘  │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Branch List:
- Scrollable (max-height: 400px)
- Each branch: Name, address, phone, hours
- Active: Brand-500 left border, brand-50 bg
- Click: Centers map on branch, opens info window

Map:
- Custom styled map (match brand colors)
- Markers: Custom SVG (brand-500 pin)
- Info window: Glass card with branch details
- Cluster markers when zoomed out

Mobile:
- Full-width map on top
- Branch list below (horizontal scroll)
```

---

## 21. Contact Section

```
Layout:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  "تواصل معنا"                                           │
│  "Contact Us"                                           │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │                  │  │                  │            │
│  │  Contact Form    │  │  Contact Info    │            │
│  │                  │  │                  │            │
│  │  ┌────────────┐  │  │  📍 Address      │            │
│  │  │ Name       │  │  │  📞 Phone        │            │
│  │  └────────────┘  │  │  📧 Email        │            │
│  │  ┌────────────┐  │  │  ⏰ Hours        │            │
│  │  │ Email      │  │  │                  │            │
│  │  └────────────┘  │  │  Social:         │            │
│  │  ┌────────────┐  │  │  [X] [IG] [WA]  │            │
│  │  │ Phone      │  │  │                  │            │
│  │  └────────────┘  │  │  ──────────────  │            │
│  │  ┌────────────┐  │  │                  │            │
│  │  │ Subject    │  │  │  WhatsApp:       │            │
│  │  └────────────┘  │  │  [Chat Now →]    │            │
│  │  ┌────────────┐  │  │                  │            │
│  │  │ Message    │  │  │                  │            │
│  │  │            │  │  │                  │            │
│  │  └────────────┘  │  │                  │            │
│  │                  │  │                  │            │
│  │  [إرسال الرسالة] │  │                  │            │
│  │                  │  │                  │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘

Form Design:
- Glass card background
- Inputs: 52px height, rounded-xl, brand focus ring
- Labels: Floating labels (animate on focus)
- Submit: Full-width, gradient, 52px height
- Success state: Green checkmark animation

Contact Info:
- Glass card
- Each item: Icon + label + value
- Social icons: Glass circles, hover brand color
- WhatsApp: Green button, direct link
```

---

## 22. Premium Footer

```
Layout:
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────┐   │
│  │  About    Services  Tests   Branches  Support   │   │
│  │  ─────    ────────  ─────   ───────  ───────   │   │
│  │  About    Hemato-   CBC     Riyadh   Help       │   │
│  │  Us       logy      Lipid   Jeddah   FAQ        │   │
│  │  Careers  Chemistry TSH     Dammam   Contact    │   │
│  │  Press    Hormones  HbA1c   Mecca    Feedback   │   │
│  │  Blog     Microbio  VitD    ...      Live Chat  │   │
│  │                                                   │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                   │   │
│  │  🏛 Logo + Description                           │   │
│  │                                                   │   │
│  │  📱 App Download                                 │   │
│  │  [App Store] [Google Play]                       │   │
│  │                                                   │   │
│  │  🌐 Social Media                                 │   │
│  │  [X] [IG] [FB] [YT] [WA] [TG]                  │   │
│  │                                                   │   │
│  │  📬 Newsletter                                   │   │
│  │  [Email input] [Subscribe]                       │   │
│  │                                                   │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                   │   │
│  │  © 2026 Al Mokhtabar. All rights reserved.       │   │
│  │  Privacy | Terms | Sitemap | Accessibility       │   │
│  │                                                   │   │
│  │  🏅 ISO 15189 | CAP | ZATCA Compliant           │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Design:
- Background: deep-navy
- Text: White (primary), white/60 (secondary)
- Links: White/60, hover: brand-300
- Newsletter input: Glass border, white text
- Social icons: Glass circles
- Bottom bar: Border-top white/10

Newsletter:
- Email input + Subscribe button (inline)
- Success: "شكراً لاشتراكك!" with checkmark
- Validation: Real-time email format check
```

---

## 23. Floating Actions

```
Layout:
┌─────────────────────────────┐
│                        [↑]  │  ← Scroll to top (appears > 500px)
│                             │
│                    [WhatsApp]│  ← WhatsApp chat (fixed)
│                             │
│                    [📞]     │  ← Call us (fixed)
│                             │
│  [Book Appointment]         │  ← Bottom bar on mobile
└─────────────────────────────┘

Scroll-to-Top:
- Circular, 48px, brand-500
- Appears after scrolling 500px
- Rotate arrow based on scroll direction
- Smooth scroll to top
- Hover: scale(1.1), shadow

WhatsApp:
- Fixed position: bottom-left (RTL) / bottom-right (LTR)
- Green circle, 56px
- Pulse animation
- Opens WhatsApp with pre-filled message
- Tooltip on hover: "تحدث معنا"

Call Button:
- Fixed position: above WhatsApp
- Brand-500 circle, 48px
- Tel: link
- Tooltip: "اتصل بنا"

Mobile Book Bar:
- Fixed bottom, full-width
- Gradient background
- "احجز موعدك الآن" text + arrow
- Only on mobile, appears after scrolling past hero
```

---

# Interaction Specifications

## Micro-interactions

### Button Hover
```
State: Default → Hover → Active
Default:   transform: none,          shadow: none
Hover:     transform: translateY(-1px), shadow: md
Active:    transform: translateY(0),   shadow: sm, scale(0.98)
Duration:  200ms ease-out
```

### Card Hover
```
State: Default → Hover
Default:   transform: none,          shadow: sm,     border: surface-100
Hover:     transform: translateY(-4px), shadow: xl,  border: brand-200
Duration:  300ms cubic-bezier(0.34, 1.56, 0.64, 1)  (spring)
```

### Link Hover
```
State: Default → Hover
Default:   color: brand-600
Hover:     color: brand-700, text-decoration: underline
Underline: slides in from right (RTL) / left (LTR)
Duration:  200ms
```

### Input Focus
```
State: Default → Focus → Error
Default:   border: surface-200,  ring: none
Focus:     border: brand-500,    ring: 3px brand-500/20
Error:     border: danger-500,   ring: 3px danger-500/20
Duration:  200ms
```

### Toggle/Switch
```
State: Off → On
Off:       bg: surface-200,  dot: white,  position: left
On:        bg: brand-500,    dot: white,  position: right
Animation: spring transition, 300ms
```

## Scroll Animations

### Reveal on Scroll
```
Trigger: Element enters viewport (IntersectionObserver)
Animation: 
  - translateY(30px) → translateY(0)
  - opacity(0) → opacity(1)
Duration: 600ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)
Delay: Stagger (0.1s per item)
Threshold: 0.1 (10% visible)
```

### Parallax
```
Elements: Hero background, decorative shapes
Speed: 0.3x (moves 30% of scroll distance)
Implementation: CSS transform: translateY(calc(var(--scroll) * 0.3))
Performance: will-change: transform, GPU accelerated
```

### Counter Animation
```
Trigger: Element in viewport
Duration: 2000ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)
Format: Number with locale-specific separators
```

---

# Performance Specifications

## Loading Strategy

```
1. Critical CSS (inline)
   - Navigation
   - Hero (above fold)
   - Preloader
   
2. Deferred CSS
   - All other sections
   
3. JavaScript
   - GSAP: Load after interactive
   - Framer Motion: Lazy
   - Three.js: On demand (hero only)
   
4. Images
   - Hero: High priority, preload
   - Below fold: Lazy load with blur placeholder
   - WebP/AVIF with fallbacks
   
5. Fonts
   - IBM Plex Sans Arabic: Preload (weights 700, 800)
   - Plus Jakarta Sans: Preload (weights 400, 500, 600)
   - JetBrains Mono: Preload (weight 700)
   - font-display: swap
```

## Image Optimization

```
Format priority: AVIF > WebP > JPEG
Sizes: 
  - Hero: 1920w, quality 80
  - Cards: 800w, quality 75
  - Thumbnails: 400w, quality 70
  - Icons: SVG (inline or sprite)
  
Lazy loading:
  - Native loading="lazy" for below-fold
  - Blur placeholder (20px gaussian)
  - IntersectionObserver for animations
```

## Core Web Vitals Targets

```
LCP:  < 1.5s  (Hero image + text)
FID:  < 50ms  (Any interaction)
CLS:  < 0.05  (Layout stability)
INP:  < 100ms (All interactions)
TTFB: < 200ms (Server response)
```

---

# Responsive Specifications

## Breakpoints

```css
/* Mobile First */
sm:  640px   /* Large phone */
md:  768px   /* Tablet portrait */
lg:  1024px  /* Tablet landscape / small laptop */
xl:  1280px  /* Laptop */
2xl: 1536px  /* Desktop */
```

## Layout Changes by Breakpoint

| Section | Mobile (<768) | Tablet (768-1024) | Desktop (>1024) |
|---------|--------------|-------------------|-----------------|
| Hero | Stack, 100vh | Side by side, 100vh | Side by side, 100vh |
| Stats | 2x2 grid | 4 columns | 4 columns |
| Services | 1 column | 2 columns | 3 columns |
| Departments | Horizontal scroll | Horizontal scroll | Grid |
| Tests | Cards | Cards | Table |
| Home Visit | Stack | Side by side | Side by side |
| Corporate | 1 column | 3 columns | 3 columns |
| Why Us | 2 columns | 3 columns | 6 columns |
| Specialists | Horizontal scroll | Horizontal scroll | Grid |
| Testimonials | Single card | Single card | Carousel |
| Map | Full-width map + list | Side by side | Side by side |
| Footer | Stacked columns | 2x2 grid | 4 columns |

---

# RTL/LTR Specifications

## Layout Mirroring

```
RTL (Arabic):
- Text align: right
- Margins/paddings: mirrored
- Icons: directional arrows flip
- Navigation: Right to left
- Grid: First item on right

LTR (English):
- Text align: left
- Margins/paddins: standard
- Icons: standard
- Navigation: Left to right
- Grid: First item on left
```

## Implementation

```css
/* Base */
html[dir="rtl"] {
  --direction: rtl;
}

/* Example */
.card {
  padding-inline-start: 1rem;  /* Logical property */
  margin-inline-end: 0.5rem;   /* Logical property */
}

/* Icons */
.icon-arrow {
  transform: scaleX(var(--direction-factor, 1));
}

html[dir="rtl"] .icon-arrow {
  transform: scaleX(-1);
}
```

---

# SEO Specifications

## Meta Tags

```html
<title>المختبر | Al Mokhtabar — معامل تحليل طبي معتمدة في المملكة العربية السعودية</title>
<meta name="description" content="المختبر — خدمة تحليل طبي متميزة. أكثر من 500 فحص مخبري، نتائج خلال ساعات، 45 فرع في المملكة. احجز فحصك الآن." />
<meta name="keywords" content="تحليل طبي, مختبر, فحوصات مخبرية, صورة دم, تحليل بول, Saudi Arabia lab" />

<!-- Open Graph -->
<meta property="og:title" content="المختبر — Al Mokhtabar Laboratory" />
<meta property="og:description" content="Your trusted laboratory partner in Saudi Arabia" />
<meta property="og:image" content="/og-image.jpg" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="ar_SA" />
<meta property="og:locale:alternate" content="en_US" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
```

## Structured Data (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "المختبر — Al Mokhtabar",
  "description": "Medical laboratory services in Saudi Arabia",
  "url": "https://almokhtabar.com",
  "telephone": "+966501234567",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "SA"
  },
  "medicalSpecialty": "Clinical Laboratory",
  "availableService": [
    {
      "@type": "MedicalTest",
      "name": "Complete Blood Count"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "2340"
  }
}
```

---

# Accessibility Checklist

- [ ] All images have descriptive alt text
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible (3px brand-500 ring)
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] All form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Skip navigation link is present
- [ ] Page has proper heading hierarchy (h1 → h2 → h3)
- [ ] ARIA landmarks are used (nav, main, footer)
- [ ] Reduced motion is respected (prefers-reduced-motion)
- [ ] Touch targets are minimum 44x44px
- [ ] Language attribute is set (ar or en)
- [ ] Page title is descriptive and unique
- [ ] Links have descriptive text (not "click here")
- [ ] Tables have proper headers and captions
- [ ] Dynamic content updates are announced (aria-live)
- [ ] Modal focus is trapped when open
- [ ] Escape key closes all overlays
- [ ] No content flashes more than 3 times per second

---

*Design Specification — Al Mokhtabar Homepage v1.0*
*Target: Lighthouse 100 | WCAG AA | Awwwards Quality*
