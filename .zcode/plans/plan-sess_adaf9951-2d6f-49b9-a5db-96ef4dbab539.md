# تنفيذ كل النواقص باحترافية — بدون أخطاء

سأعمل كل النواقص على 4 مراحل، وأتأكد بعد كل ملف إن الـ typecheck والـ build ينجحوا.

## المرحلة 1 — الأساسيات الحيوية
1. **React Query Provider**: `src/components/providers/QueryProvider.tsx` + تغليفه في `app/layout.tsx`
2. **Route Guard (حماية الطرق)**: `src/components/auth/AuthGuard.tsx` — يمنع غير المسجلين من دخول الـ dashboard ويعمل redirect لـ login
3. **Dynamic locale**: إصلاح `/ar/` hardcoded في `dashboard/layout.tsx` لـ `/${locale}/` باستخدام `useParams()`
4. **إصلاح bug في Analytics**: السطر `startsWith('G-')` مقلوب وبيمنع تشغيل GA

## المرحلة 2 — Loading/Error/NotFound
5. **loading.tsx** للـ dashboard والـ auth (باستخدام Skeleton الموجود)
6. **error.tsx** للـ dashboard + **global-error.tsx** (error boundaries مع retry button)
7. **not-found.tsx** — صفحة 404 احترافية بالعربي

## المرحلة 3 — تحسينات احترافافية
8. **تحسين Dark Mode**: حفظ الحالة في localStorage (الحالي بيرجع كل reload)
9. **generateMetadata** لصفحات login/register (dashboard صفحات تكون noindex)
10. **Accessibility**: skip-to-content + aria-labels

## المرحلة 4 — Performance
11. **Lazy loading** لـ three.js components بـ `next/dynamic`
12. فحص نهائي شامل: typecheck + build

## الضمانات
- بعد كل ملف: `tsc --noEmit`
- بعد كل مرحلة: `npm run build`
- مش هغير أي logic في الصفحات (فضل hardcoded data حسب اختيارك)
- لو احتجت package (زي `next-themes`) هثبته