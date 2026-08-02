'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-brand-600 transition-colors mb-8">
            <svg className="h-4 w-4 rotate-180" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            العودة للرئيسية
          </Link>

          <h1 className="text-3xl font-bold text-surface-900 mb-2">الشروط والأحكام</h1>
          <p className="text-sm text-surface-500 mb-8">آخر تحديث: أغسطس 2026</p>

          <div className="prose prose-surface max-w-none space-y-6 text-surface-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">١. قبول الشروط</h2>
              <p>باستخدامك لموقع المختبر وخدماته، فإنك توافق على هذه الشروط والأحكام. إذا لم توافق على أي من هذه الشروط، يرجى عدم استخدام الموقع.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">٢. استخدام الخدمات</h2>
              <p>تُقدم خدمات المختبر لغرض المعلومات الطبية فقط. لا يُغني استشارتنا الطبية عن استشارة الطبيب المختص.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">٣. الحجوزات والدفع</h2>
              <p>جميع الحجوزات تخضع لتوفرية المواعيد. يحق للمختبر تعديل أو إلغاء الحجز في حالة الظروف الطارئة. الأسعار المعروضة قابلة للتغيير دون إشعار مسبق.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">٤. النتائج الطبية</h2>
              <p>النتائج المقدمة عبر المنصة معلوماتية فقط ولا تُشكل تشخيصاً طبياً نهائياً. يُنصح دائماً بمراجعة الطبيب المعالج لفهم النتائج بشكل كامل.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">٥. إخلاء المسؤولية</h2>
              <p>يحتفظ المختبر بحق تعديل هذه الشروط في أي وقت. استمرارك في استخدام الموقع بعد أي تعديل يُعتبر قبولاً للشروط المعدّلة.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
