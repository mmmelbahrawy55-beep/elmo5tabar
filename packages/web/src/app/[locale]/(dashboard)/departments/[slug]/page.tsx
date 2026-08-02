'use client'

import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { getDepartmentBySlug, ALL_DEPARTMENTS } from '@/data/departments'
import {
  DepartmentHero,
  DepartmentOverview,
  DepartmentTests,
  DepartmentTeam,
  DepartmentEquipment,
  DepartmentTechnology,
  DepartmentPreparation,
  DepartmentExpectedTime,
  DepartmentInsurance,
  DepartmentFAQ,
  DepartmentArticles,
  DepartmentCTA,
  DepartmentTestimonials,
  DepartmentRelated,
  DepartmentStats,
} from '@/components/departments/DepartmentSections'
import { ArrowLeft } from 'lucide-react'

const Separator = () => <div className="border-t border-surface-100" />

export default function DepartmentDetailPage() {
  const params = useParams()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'ar'
  const slug = params.slug as string
  const dept = getDepartmentBySlug(slug)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug])

  if (!dept) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <h1 className="text-2xl font-bold text-surface-800">القسم غير موجود</h1>
        <Link
          href={`/${locale}/departments`}
          className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة إلى الأقسام
        </Link>
      </div>
    )
  }

  const currentIndex = ALL_DEPARTMENTS.findIndex((d) => d.id === slug)
  const prevDept = currentIndex > 0 ? ALL_DEPARTMENTS[currentIndex - 1] : null
  const nextDept =
    currentIndex < ALL_DEPARTMENTS.length - 1 ? ALL_DEPARTMENTS[currentIndex + 1] : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-0"
    >
      {/* Breadcrumb */}
      <nav className="text-xs text-surface-400 mb-6">
        <Link href={`/${locale}`} className="hover:text-brand-500 transition-colors">
          الرئيسية
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/${locale}/departments`} className="hover:text-brand-500 transition-colors">
          الأقسام
        </Link>
        <span className="mx-2">/</span>
        <span className="text-surface-700">{dept.nameAr}</span>
      </nav>

      <div className="scroll-mt-20">
        <DepartmentHero department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentStats department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentOverview department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentTests department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentTeam department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentEquipment department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentTechnology department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentPreparation department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentExpectedTime department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentInsurance department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentFAQ department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentArticles department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentTestimonials department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentCTA department={dept} />
      </div>

      <Separator />

      <div className="scroll-mt-20">
        <DepartmentRelated department={dept} currentSlug={slug} />
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-surface-100 pt-8 mt-12 flex justify-between items-center">
        {prevDept ? (
          <Link
            href={`/departments/${prevDept.id}`}
            className="inline-flex items-center gap-2 text-sm text-surface-600 hover:text-brand-500 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span>{prevDept.nameAr}</span>
          </Link>
        ) : (
          <div />
        )}
        {nextDept ? (
          <Link
            href={`/departments/${nextDept.id}`}
            className="inline-flex items-center gap-2 text-sm text-surface-600 hover:text-brand-500 transition-colors group"
          >
            <span>{nextDept.nameAr}</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </motion.div>
  )
}
