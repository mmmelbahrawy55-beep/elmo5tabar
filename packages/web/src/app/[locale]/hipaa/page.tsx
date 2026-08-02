'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HipaaPage() {
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

          <h1 className="text-3xl font-bold text-surface-900 mb-2">سياسة حماية البيانات الصحية (HIPAA)</h1>
          <p className="text-sm text-surface-500 mb-8">آخر تحديث: أغسطس 2026</p>

          <div className="prose prose-surface max-w-none space-y-6 text-surface-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">التزامنا بحماية بياناتك الصحية</h2>
              <p>يلتزم المختبر بأعلى معايير حماية المعلومات الصحية الشخصية وفقاً لمعايير HIPAA الدولية ونظام حماية البيانات الشخصية السعودي.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">المعلومات الصحية المحمية</h2>
              <p>تشمل البيانات المحمية جميع المعلومات المتعلقة بتحاليلك المخبرية ونتائجها وتشخيصاتك الطبية وتاريخك الصحي.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">التدابير الأمنية</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>تشفير البيانات أثناء النقل والتخزين</li>
                <li>التحكم الصارم في الوصول إلى البيانات الصحية</li>
                <li>المراقبة المستمرة للأنظمة الأمنية</li>
                <li>تدريب الموظفين على حماية البيانات الصحية</li>
                <li>المراجعة الدورية للإجراءات الأمنية</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">حقوقك</h2>
              <p>يحق لك الوصول إلى سجلاتك الصحية الإلكترونية وطلب تصحيح أي معلومات غير دقيقة. كما يمكنك طلب نسخة من جميع بياناتك الصحية المحفوظة لدينا.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">الإبلاغ عن المخالفات</h2>
              <p>في حالة اكتشاف أي خرق محتمل لخصوصيتك الصحية، سنقوم بإبلاغك فوراً واتخاذ جميع الإجراءات التصحيحية اللازمة.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
