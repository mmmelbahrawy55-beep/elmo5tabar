"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getBranchBySlug,
  calculateDistance,
  ALL_BRANCHES,
} from "@/data/branches";
import {
  useBranchFavoritesStore,
  useLocationStore,
} from "@/stores/branches";
import {
  MapPin,
  Navigation,
  Phone,
  Mail,
  Clock,
  Star,
  Users,
  Car,
  Accessibility,
  Wifi,
  Share2,
  Heart,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  Shield,
  Camera,
  Globe,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Building2,
  Zap,
  ExternalLink,
  Image,
  X,
  ChevronRight,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "مفتوح", color: "text-emerald-700", bg: "bg-emerald-100" },
  closed: { label: "مغلق", color: "text-red-700", bg: "bg-red-100" },
  "coming-soon": { label: "قريباً", color: "text-amber-700", bg: "bg-amber-100" },
};

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  main: { label: "الفرع الرئيسي", color: "text-indigo-700", bg: "bg-indigo-100" },
  branch: { label: "فرع", color: "text-sky-700", bg: "bg-sky-100" },
  specialty: { label: "فرع متخصص", color: "text-violet-700", bg: "bg-violet-100" },
  express: { label: "Express", color: "text-orange-700", bg: "bg-orange-100" },
};

const daysAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function BranchDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const branch = getBranchBySlug(slug);

  const { favorites, toggleFavorite } = useBranchFavoritesStore();
  const { latitude, longitude, permissionState } = useLocationStore();

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [servicesOpen, setServicesOpen] = useState(true);
  const [testsOpen, setTestsOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const isFavorited = branch ? favorites.includes(branch.id) : false;
  const today = new Date().getDay();

  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (branch && permissionState === "granted" && latitude && longitude) {
      const d = calculateDistance(latitude, longitude, branch.coordinates.lat, branch.coordinates.lng);
      setDistance(d);
    }
  }, [branch, latitude, longitude, permissionState]);

  if (!branch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 p-12 bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md mx-4"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-arabic">
            الفرع غير موجود
          </h1>
          <p className="text-slate-500 font-arabic">
            عذراً، لم نتمكن من العثور على الفرع المطلوب
          </p>
          <Link
            href="/ar/branches"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold font-arabic hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للفروع
          </Link>
        </motion.div>
      </div>
    );
  }

  const currentIndex = ALL_BRANCHES.findIndex((b) => b.id === branch.id);
  const prevBranch = currentIndex > 0 ? ALL_BRANCHES[currentIndex - 1] : ALL_BRANCHES[ALL_BRANCHES.length - 1];
  const nextBranch =
    currentIndex < ALL_BRANCHES.length - 1
      ? ALL_BRANCHES[currentIndex + 1]
      : ALL_BRANCHES[0];

  const st = statusConfig[branch.status] || statusConfig.active;
  const ty = typeConfig[branch.type] || typeConfig.branch;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: branch.nameAr,
        text: `فرع ${branch.nameAr} - المختبر`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${branch.coordinates.lat},${branch.coordinates.lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-20">
      {/* Hero Section */}
      <motion.section {...fadeInUp} className="relative w-full overflow-hidden">
        <div className="relative h-[420px] sm:h-[480px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: branch.coverImage
                ? `url(${branch.coverImage})`
                : undefined,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 to-transparent" />

          <div className="relative h-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-white/60 text-sm font-arabic mb-6">
              <Link href="/ar" className="hover:text-white transition-colors">
                الرئيسية
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link
                href="/ar/branches"
                className="hover:text-white transition-colors"
              >
                الفروع
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/90">{branch.nameAr}</span>
            </nav>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-arabic ${ty.bg} ${ty.color}`}
              >
                {ty.label}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-arabic flex items-center gap-1 ${st.bg} ${st.color}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    branch.status === "active"
                      ? "bg-emerald-500"
                      : branch.status === "closed"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                />
                {st.label}
              </span>
              {branch.is24Hours && (
                <span className="px-3 py-1 rounded-full text-xs font-bold font-arabic bg-sky-100 text-sky-700">
                  ساعات 24
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-arabic leading-tight mb-1">
              {branch.nameAr}
            </h1>
            <p className="text-lg text-white/70 font-arabic mb-3">
              {branch.nameEn}
            </p>

            {/* Address */}
            <div className="flex items-center gap-2 text-white/80 font-arabic text-sm mb-4">
              <MapPin className="w-4 h-4 text-indigo-300 shrink-0" />
              <span>{branch.addressAr}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= Math.round(branch.rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-white/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/70 text-sm font-arabic">
                {branch.rating.toFixed(1)} ({branch.reviewCount} تقييم)
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/ar/branches/${slug}/book`}
                className="inline-flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-arabic transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                <Calendar className="w-4 h-4" />
                احجز موعد
              </Link>
              <a
                href={`tel:${branch.phone}`}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold font-arabic transition-all backdrop-blur-sm border border-white/10"
              >
                <Phone className="w-4 h-4" />
                اتصل
              </a>
              {branch.whatsapp && (
                <a
                  href={`https://wa.me/${branch.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl font-bold font-arabic transition-all backdrop-blur-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  وساب
                </a>
              )}
              <button
                onClick={() => toggleFavorite(branch.id)}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-all backdrop-blur-sm border border-white/10"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFavorited ? "fill-red-400 text-red-400" : ""
                  }`}
                />
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-all backdrop-blur-sm border border-white/10"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleNavigate}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-all backdrop-blur-sm border border-white/10"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12 mt-10">
        {/* Quick Info Bar */}
        <motion.section {...fadeInUp}>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Hours pill */}
            <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-200/80">
              <div
                className={`w-2 h-2 rounded-full ${
                  branch.status === "active"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-red-400"
                }`}
              />
              <div className="text-right">
                <p className="text-xs text-slate-500 font-arabic">
                  {branch.status === "active" ? "مفتوح الآن" : "مغلق"}
                </p>
                <p className="text-sm font-bold text-slate-800 font-arabic">
                  {branch.status === "active"
                    ? `يغلق الساعة ${branch.openingHours?.[0]?.close || "11:00 م"}`
                    : `يفتح الساعة ${branch.openingHours?.[0]?.open || "08:00 ص"}`}
                </p>
              </div>
              <Clock className="w-4 h-4 text-slate-400 mr-1" />
            </div>

            {/* Queue pill */}
            {branch.queueStatus && (
              <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                <div
                  className={`w-2 h-2 rounded-full ${
                    branch.queueStatus.waiting <= 5
                      ? "bg-emerald-500"
                      : branch.queueStatus.waiting <= 15
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                />
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-arabic">
                    حالة الطابور
                  </p>
                  <p className="text-sm font-bold text-slate-800 font-arabic">
                    {branch.queueStatus.waiting} انتظار •{" "}
                    {branch.queueStatus.averageWait}
                  </p>
                </div>
                <Users className="w-4 h-4 text-slate-400 mr-1" />
              </div>
            )}

            {/* Capacity pill */}
            {branch.capacity && (
              <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                <div className="text-right min-w-[120px]">
                  <p className="text-xs text-slate-500 font-arabic">السعة</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          branch.capacity.percentage > 80
                            ? "bg-red-500"
                            : branch.capacity.percentage > 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${branch.capacity.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-800 font-arabic">
                      {branch.capacity.percentage}%
                    </span>
                  </div>
                </div>
                <Zap className="w-4 h-4 text-slate-400 mr-1" />
              </div>
            )}

            {/* Distance pill */}
            {distance !== null && (
              <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-arabic">المسافة</p>
                  <p className="text-sm font-bold text-slate-800 font-arabic">
                    {distance < 1
                      ? `${Math.round(distance * 1000)} م`
                      : `${distance.toFixed(1)} كم`}
                  </p>
                </div>
                <Navigation className="w-4 h-4 text-slate-400 mr-1" />
              </div>
            )}
          </div>
        </motion.section>

        {/* Opening Hours */}
        <motion.section {...fadeInUp}>
          <h2 className="text-xl font-black text-slate-900 font-arabic mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            ساعات العمل
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            {daysAr.map((day, idx) => {
              const schedule = branch.openingHours?.[idx];
              const isToday = idx === today;
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between px-5 py-3.5 ${
                    isToday
                      ? "bg-indigo-50 border-r-4 border-indigo-600"
                      : "border-b border-slate-100 last:border-b-0"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isToday && (
                      <span className="text-[10px] font-bold font-arabic bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        اليوم
                      </span>
                    )}
                    <span
                      className={`font-arabic font-bold ${
                        isToday ? "text-indigo-700" : "text-slate-700"
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                  <span
                    className={`font-arabic text-sm ${
                      !schedule || schedule.isClosed
                        ? "text-red-500 font-bold"
                        : isToday
                        ? "text-indigo-700 font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    {!schedule || schedule.isClosed
                      ? "مغلق"
                      : `${schedule.open} - ${schedule.close}`}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Available Services */}
        <motion.section {...fadeInUp}>
          <button
            onClick={() => setServicesOpen(!servicesOpen)}
            className="flex items-center justify-between w-full mb-6"
          >
            <h2 className="text-xl font-black text-slate-900 font-arabic flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              الخدمات المتاحة
              {branch.services && (
                <span className="text-sm font-normal text-slate-400 font-arabic">
                  ({branch.services.filter((s) => s.available).length}/
                  {branch.services.length})
                </span>
              )}
            </h2>
            {servicesOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          <AnimatePresence>
            {servicesOpen && branch.services && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {branch.services.map((service, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                        service.available
                          ? "bg-white border-slate-200/80 shadow-sm hover:shadow-md"
                          : "bg-slate-50 border-slate-100 opacity-60"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          service.available
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {service.icon || <Zap className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold font-arabic text-slate-800 text-sm">
                          {service.nameAr}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {service.available ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-arabic">
                              <CheckCircle2 className="w-3 h-3" />
                              متاح
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-500 font-arabic">
                              <AlertCircle className="w-3 h-3" />
                              غير متاح
                            </span>
                          )}
                          {service.estimatedTime && (
                            <span className="text-xs text-slate-400 font-arabic">
                              • {service.estimatedTime} دقيقة
                            </span>
                          )}
                        </div>
                        {service.requiresBooking && (
                          <span className="inline-block mt-1 text-[10px] font-bold font-arabic bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            يتطلب حجز
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Available Tests */}
        {branch.availableTests && branch.availableTests.length > 0 && (
          <motion.section {...fadeInUp}>
            <button
              onClick={() => setTestsOpen(!testsOpen)}
              className="flex items-center justify-between w-full mb-6"
            >
              <h2 className="text-xl font-black text-slate-900 font-arabic flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                الفحوصات المتاحة
                <span className="text-sm font-normal text-slate-400 font-arabic">
                  ({branch.availableTests.length} فحص)
                </span>
              </h2>
              {testsOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            <AnimatePresence>
              {testsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {branch.availableTests.slice(0, 12).map((test, i) => (
                      <div
                        key={i}
                        className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm"
                      >
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs font-arabic bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                            {test}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* Branch Images Gallery */}
        {branch.images && branch.images.length > 0 && (
          <motion.section {...fadeInUp}>
            <h2 className="text-xl font-black text-slate-900 font-arabic mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-500" />
              صور الفرع
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {branch.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedImage(i);
                    setGalleryOpen(true);
                  }}
                  className="shrink-0 relative group"
                >
                  <div className="w-48 h-32 rounded-xl overflow-hidden border border-slate-200/80 shadow-sm group-hover:shadow-md transition-shadow">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url(${img.url})` }}
                    />
                  </div>
                  <span className="absolute bottom-2 right-2 text-[10px] font-bold font-arabic bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {img.type === "exterior"
                      ? "خارجي"
                      : img.type === "interior"
                      ? "داخلي"
                      : img.type === "equipment"
                      ? "أجهزة"
                      : img.type === "waiting"
                      ? "انتظار"
                      : img.type}
                  </span>
                </button>
              ))}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
              {galleryOpen && selectedImage !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                  onClick={() => setGalleryOpen(false)}
                >
                  <button
                    onClick={() => setGalleryOpen(false)}
                    className="absolute top-6 left-6 text-white/80 hover:text-white z-10"
                  >
                    <X className="w-8 h-8" />
                  </button>
                  <motion.img
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    src={branch.images[selectedImage].url}
                    alt={branch.images[selectedImage].type}
                    className="max-w-full max-h-[85vh] rounded-xl object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {branch.images.length > 1 && (
                    <div className="absolute bottom-6 flex gap-2">
                      {branch.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(i);
                          }}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === selectedImage ? "bg-white" : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* 360 Virtual Tour */}
        {branch.virtualTourUrl && (
          <motion.section {...fadeInUp}>
            <h2 className="text-xl font-black text-slate-900 font-arabic mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              جولة افتراضية 360°
            </h2>
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <Globe className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-slate-600 font-arabic mb-4">
                تصفّح الفرع بشكل افتراضي ثلاثي الأبعاد
              </p>
              <a
                href={branch.virtualTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-arabic transition-all shadow-lg shadow-indigo-500/25"
              >
                <ExternalLink className="w-4 h-4" />
                جولة افتراضية 360°
              </a>
            </div>
          </motion.section>
        )}

        {/* Facilities */}
        <motion.section {...fadeInUp}>
          <h2 className="text-xl font-black text-slate-900 font-arabic mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            المرافق والتسهيلات
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Parking */}
            {branch.parking && branch.parking.available && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                  <Car className="w-5 h-5" />
                </div>
                <h3 className="font-bold font-arabic text-slate-800 mb-2">
                  مواقف السيارات
                </h3>
                <ul className="space-y-1 text-sm text-slate-600 font-arabic">
                  <li>
                    • {branch.parking.spots} موقف متاح
                  </li>
                  {branch.parking.type && (
                    <li>• {branch.parking.type === 'free' ? 'مجاني' : branch.parking.type === 'paid' ? 'مدفوع' : 'مجاني ومدفوع'}</li>
                  )}
                  {branch.parking.valet && (
                    <li className="text-emerald-600 font-bold">
                      ✓ خدمة صفّارة السيارة
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Accessibility */}
            {branch.accessibility && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                  <Accessibility className="w-5 h-5" />
                </div>
                <h3 className="font-bold font-arabic text-slate-800 mb-2">
                  سهولة الوصول
                </h3>
                <ul className="space-y-1 text-sm text-slate-600 font-arabic">
                  {branch.accessibility.wheelchair && (
                    <li className="text-emerald-600">✓ كرسي متحرك</li>
                  )}
                  {branch.accessibility.ramp && (
                    <li className="text-emerald-600">✓ منحدر وصول</li>
                  )}
                  {branch.accessibility.elevator && (
                    <li className="text-emerald-600">✓ مصعد</li>
                  )}
                  {branch.accessibility.handicappedParking && (
                    <li className="text-emerald-600">✓ موقف ذوي الاحتياجات</li>
                  )}
                </ul>
              </div>
            )}

            {/* Amenities */}
            {branch.amenities && branch.amenities.length > 0 && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Wifi className="w-5 h-5" />
                </div>
                <h3 className="font-bold font-arabic text-slate-800 mb-2">
                  المرافق
                </h3>
                <ul className="space-y-1 text-sm text-slate-600 font-arabic">
                  {branch.amenities.map((item, i) => (
                    <li key={i} className="text-emerald-600">✓ {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.section>

        {/* Manager */}
        {branch.manager && (
          <motion.section {...fadeInUp}>
            <h2 className="text-xl font-black text-slate-900 font-arabic mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              مدير الفرع
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-black font-arabic shrink-0">
                {branch.manager.nameAr
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold font-arabic text-slate-900 text-lg">
                  {branch.manager.nameAr}
                </h3>
                <p className="text-sm text-slate-500 font-arabic">
                  {branch.manager.title}
                </p>
                {branch.manager.since && (
                  <p className="text-xs text-slate-400 font-arabic mt-1">
                    منذ {branch.manager.since}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {branch.manager.phone && (
                  <a
                    href={`tel:${branch.manager.phone}`}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {branch.manager.email && (
                  <a
                    href={`mailto:${branch.manager.email}`}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* Emergency Contact */}
        {branch.emergencyContact?.phone && (
          <motion.section {...fadeInUp}>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold font-arabic text-red-800 text-lg mb-1">
                    طوارئ 24 ساعة
                  </h3>
                  <p className="text-sm text-red-600/80 font-arabic mb-3">
                    للحالات الطارئة على مدار الساعة
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`tel:${branch.emergencyContact.phone}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold font-arabic transition-colors shadow-lg shadow-red-500/25"
                    >
                      <Phone className="w-4 h-4" />
                      {branch.emergencyContact.phone}
                    </a>
                    {branch.whatsapp && (
                      <a
                        href={`https://wa.me/${branch.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold font-arabic transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        وساب طوارئ
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Certifications */}
        {branch.certifications && branch.certifications.length > 0 && (
          <motion.section {...fadeInUp}>
            <h2 className="text-xl font-black text-slate-900 font-arabic mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              الشهادات والاعتمادات
            </h2>
            <div className="flex flex-wrap gap-3">
              {branch.certifications.map((cert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-slate-200/80 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-bold font-arabic text-slate-700 text-sm">
                    {cert}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Map & Navigation */}
        <motion.section {...fadeInUp}>
          <h2 className="text-xl font-black text-slate-900 font-arabic mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            الموقع والتنقل
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Map placeholder */}
            <div className="relative h-56 sm:h-72 bg-gradient-to-br from-slate-100 to-slate-200">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <MapPin className="w-12 h-12 mb-3 text-indigo-300" />
                <p className="font-arabic text-sm text-slate-500">
                  خريطة الموقع
                </p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${branch.coordinates.lat},${branch.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 left-3 inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-xl text-sm font-bold font-arabic text-slate-700 shadow-sm backdrop-blur-sm transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                فتح في خرائط جوجل
              </a>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-2 text-slate-600 font-arabic text-sm">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{branch.addressAr}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleNavigate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-arabic transition-colors shadow-lg shadow-indigo-500/25"
                >
                  <Navigation className="w-4 h-4" />
                  التنقل إلى الفرع
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold font-arabic transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  مشاركة الموقع
                </button>
              </div>
              {copiedShare && (
                <p className="text-xs text-emerald-600 font-arabic animate-pulse">
                  ✓ تم نسخ الرابط
                </p>
              )}
            </div>
          </div>
        </motion.section>

        {/* Branch Network Navigation */}
        <motion.section {...fadeInUp}>
          <h2 className="text-xl font-black text-slate-900 font-arabic mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            شبكة الفروع
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Previous */}
            <Link
              href={`/ar/branches/${prevBranch.slug}`}
              className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center transition-colors shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs text-slate-400 font-arabic mb-0.5">
                  الفرع السابق
                </p>
                <p className="font-bold font-arabic text-slate-800 truncate">
                  {prevBranch.nameAr}
                </p>
              </div>
            </Link>

            {/* Next */}
            <Link
              href={`/ar/branches/${nextBranch.slug}`}
              className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-arabic mb-0.5">
                  الفرع التالي
                </p>
                <p className="font-bold font-arabic text-slate-800 truncate">
                  {nextBranch.nameAr}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center transition-colors shrink-0 rotate-180">
                <ArrowLeft className="w-5 h-5" />
              </div>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
