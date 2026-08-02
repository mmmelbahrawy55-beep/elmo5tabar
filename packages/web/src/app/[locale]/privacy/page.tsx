'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PrivacyPage() {
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

          <h1 className="text-3xl font-bold text-surface-900 mb-2">سياسة الخصوصية</h1>
          <p className="text-sm text-surface-500 mb-8">آخر تحديث: أغسطس 2026</p>

          <div className="prose prose-surface max-w-none space-y-6 text-surface-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">١. جمع المعلومات</h2>
              <p>نقوم بجمع المعلومات الشخصية مثل الاسم والبريد الإلكتروني ورقم الهاتف عند التسجيل. كما نجمع معلومات طبية تتعلق بالتحاليل المخبرية لتقديم الخدمات بشكل أفضل.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">٢. استخدام المعلومات</h2>
              <p>نستخدم المعلومات المجمّعة لتقديم خدمات التحاليل المخبرية، إرسال النتائج، التواصل معك بخصوص مواعيدك، وتحسين تجربتك على المنصة.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">٣. حماية البيانات</h2>
              <p>نستخدم تشفير SSL من الدرجة العسكرية لحماية بياناتك. جميع المعلومات الطبية تخضع لأنظمة حماية البيانات الشخصية ونظام حماية البيانات الصحية في المملكة العربية السعودية.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">٤. مشاركة المعلومات</h2>
              <p>لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا بموافقةك الصريحة أو عند الضرورة القانونية. قد نشارك معلوماتك مع شركاء الرعاية الصحية المعتمدين لتقديم الخدمات.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-surface-800 mb-3">٥. حقوقك</h2>
              <p>لك الحق في الوصول إلى بياناتك وتعديلها أو حذفها في أي وقت. يمكنك التواصل معنا عبر البريد الإلكتروني أو التطبيق لممارسة هذه الحقوق.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
