'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AuthProvider } from '@/lib/contexts/auth-context';
import {
  FlaskConical,
  LayoutDashboard,
  TestTube2,
  FileText,
  Calendar,
  CreditCard,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  Building2,
  BarChart3,
  Stethoscope,
  Activity,
  Moon,
  Sun,
  Globe,
  UserPlus,
  Shield,
  ArrowRightLeft,
  Home,
  Monitor,
  AlertTriangle,
  DollarSign,
  Wallet,
  Calculator,
  Archive,
  FileCheck,
  Package,
  Megaphone,
  Brain,
  Key,
  Lock,
  ScrollText,
  Wifi,
  Server,
  ShieldCheck,
  Bell as BellIcon,
  Mail,
  MessageSquare,
  Phone,
  Tag,
  Percent,
  BookOpen,
  Image,
  ClipboardList,
  UserCog,
  Search as SearchIcon,
  PieChart,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn?: string;
  lastNameEn?: string;
  avatar?: string;
}

const patientNavItems = (locale: string) => [
  { href: `/${locale}/patient`, label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: `/${locale}/patient/tests`, label: 'التحاليل', icon: TestTube2 },
  { href: `/${locale}/patient/orders`, label: 'طلباتي', icon: FileText },
  { href: `/${locale}/patient/reports`, label: 'التقارير', icon: Activity },
  { href: `/${locale}/patient/appointments`, label: 'المواعيد', icon: Calendar },
  { href: `/${locale}/patient/appointments/book`, label: 'حجز موعد', icon: Calendar },
  { href: `/${locale}/patient/billing`, label: 'الفواتير', icon: CreditCard },
];

interface AdminNavSection {
  title: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

const adminNavSections: AdminNavSection[] = [
  {
    title: 'الرئيسية',
    items: [
      { href: '/admin', label: 'لوحة التحكم التنفيذية', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'التحليلات', icon: BarChart3 },
      { href: '/admin/revenue', label: 'تحليل الإيرادات', icon: DollarSign },
    ],
  },
  {
    title: 'العمليات',
    items: [
      { href: '/admin/appointments', label: 'المواعيد', icon: Calendar },
      { href: '/admin/patients', label: 'المرضى', icon: Users },
      { href: '/admin/doctors', label: 'الأطباء', icon: Stethoscope },
      { href: '/admin/staff', label: 'طاقم العمل', icon: UserCog },
      { href: '/admin/reception', label: 'الاستقبال', icon: UserPlus },
      { href: '/admin/branches', label: 'الفروع', icon: Building2 },
      { href: '/admin/departments', label: 'الأقسام', icon: ClipboardList },
    ],
  },
  {
    title: 'المختبر',
    items: [
      { href: '/admin/tests', label: 'التحاليل', icon: TestTube2 },
      { href: '/admin/packages', label: 'الحزم', icon: Package },
      { href: '/admin/results', label: 'النتائج', icon: FileCheck },
      { href: '/admin/reports', label: 'التقارير', icon: FileText },
      { href: '/admin/inventory', label: 'المخزون', icon: Archive },
    ],
  },
  {
    title: 'المالية',
    items: [
      { href: '/admin/accounting', label: 'المحاسبة', icon: Calculator },
      { href: '/admin/payroll', label: 'الرواتب', icon: Wallet },
      { href: '/admin/insurance', label: 'التأمين', icon: Shield },
    ],
  },
  {
    title: 'الشراكات والتسويق',
    items: [
      { href: '/admin/partners', label: 'الشركاء', icon: Users },
      { href: '/admin/marketing', label: 'التسويق', icon: Megaphone },
      { href: '/admin/seo', label: 'تحسين محركات البحث', icon: SearchIcon },
      { href: '/admin/cms', label: 'إدارة المحتوى', icon: Globe },
      { href: '/admin/media', label: 'مكتبة الوسائط', icon: Image },
      { href: '/admin/blog', label: 'المدونة', icon: BookOpen },
      { href: '/admin/offers', label: 'العروض', icon: Tag },
      { href: '/admin/coupons', label: 'الكوبونات', icon: Percent },
    ],
  },
  {
    title: 'الاتصالات',
    items: [
      { href: '/admin/notifications', label: 'الإشعارات', icon: BellIcon },
      { href: '/admin/emails', label: 'البريد الإلكتروني', icon: Mail },
      { href: '/admin/sms', label: 'الرسائل النصية', icon: MessageSquare },
      { href: '/admin/whatsapp', label: 'واتساب', icon: Phone },
    ],
  },
  {
    title: 'النظام',
    items: [
      { href: '/admin/roles', label: 'الأدوار', icon: Key },
      { href: '/admin/permissions', label: 'الصلاحيات', icon: Lock },
      { href: '/admin/audit', label: 'سجلات التدقيق', icon: ScrollText },
      { href: '/admin/activity', label: 'سجل النشاط', icon: Activity },
      { href: '/admin/api-monitor', label: 'مراقبة API', icon: Wifi },
      { href: '/admin/server', label: 'مراقبة الخادم', icon: Server },
      { href: '/admin/security', label: 'مركز الأمان', icon: ShieldCheck },
      { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
    ],
  },
  {
    title: 'الذكاء الاصطناعي',
    items: [
      { href: '/admin/ai', label: 'لوحة AI', icon: Brain },
    ],
  },
];

const receptionNavItems = (locale: string) => [
  { href: `/${locale}/reception`, label: 'لوحة الاستقبال', icon: LayoutDashboard },
  { href: `/${locale}/reception/queue`, label: 'قائمة الانتظار', icon: Users },
  { href: `/${locale}/reception/walk-ins`, label: 'المرضى المترددين', icon: UserPlus },
  { href: `/${locale}/reception/insurance`, label: 'التأمين', icon: Shield },
  { href: `/${locale}/reception/transfers`, label: 'النقل بين الفروع', icon: ArrowRightLeft },
  { href: `/${locale}/reception/home-visits`, label: 'الزيارات المنزلية', icon: Home },
  { href: `/${locale}/reception/emergency`, label: 'الحالات الطارئة', icon: AlertTriangle },
  { href: `/${locale}/reception/display`, label: 'شاشة الانتظار', icon: Monitor },
];

const doctorNavItems = (locale: string) => [
  { href: `/${locale}/doctor`, label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: `/${locale}/doctor/schedule`, label: 'الجدول اليومي', icon: Calendar },
  { href: `/${locale}/doctor/queue`, label: 'قائمة الانتظار', icon: Users },
  { href: `/${locale}/doctor/patients`, label: 'المرضى', icon: Users },
  { href: `/${locale}/doctor/orders`, label: 'الطلبات', icon: FileText },
  { href: `/${locale}/doctor/reports`, label: 'التقارير', icon: Activity },
  { href: `/${locale}/doctor/prescriptions`, label: 'الوصفات', icon: FileText },
  { href: `/${locale}/doctor/settings`, label: 'الإعدادات', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'ar';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      router.push(`/${locale}/login`);
    }
  }, [locale, router]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const adminNavFlat = useMemo(() => {
    const all: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];
    adminNavSections.forEach(s => all.push(...s.items));
    return all;
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery) return adminNavSections;
    const q = searchQuery.toLowerCase();
    return adminNavSections
      .map(s => ({
        ...s,
        items: s.items.filter(i => i.label.includes(q) || i.href.toLowerCase().includes(q)),
      }))
      .filter(s => s.items.length > 0);
  }, [searchQuery]);

  const navItems = user?.role === 'PATIENT'
    ? patientNavItems(locale)
    : user?.role === 'DOCTOR'
    ? doctorNavItems(locale)
    : user?.role === 'RECEPTIONIST'
    ? receptionNavItems(locale)
    : null;

  const isAdmin = !user?.role || (user?.role !== 'PATIENT' && user?.role !== 'DOCTOR' && user?.role !== 'RECEPTIONIST');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push(`/${locale}/login`);
  };

  const getInitials = () => {
    const f = user?.firstNameAr?.[0] || '';
    const l = user?.lastNameAr?.[0] || '';
    if (f || l) return `${f}${l}`;
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'مدير عام',
      ADMIN: 'مدير',
      DOCTOR: 'طبيب',
      NURSE: 'ممرض',
      LAB_TECHNICIAN: 'فني مختبر',
      PHLEBOTOMIST: 'أخصائي أخذ عينات',
      RECEPTIONIST: 'موظف استقبال',
      BILLING_STAFF: 'محاسب',
      PATIENT: 'مريض',
    };
    return map[role] || role;
  };

  const renderAdminSidebar = () => (
    <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin">
      {filteredSections.map((section) => {
        const collapsed = collapsedSections.has(section.title);
        return (
          <div key={section.title} className="mb-2">
            <button
              onClick={() => toggleSection(section.title)}
              className="flex items-center justify-between w-full px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-surface-400 hover:text-surface-600 transition-colors"
            >
              <span>{section.title}</span>
              <ChevronLeft
                className={`h-3 w-3 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
              />
            </button>
            {!collapsed && (
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const fullHref = `/${locale}${item.href}`;
                  const isActive = pathname === fullHref || (item.href !== '/admin' && pathname?.startsWith(fullHref));
                  return (
                    <Link
                      key={item.href}
                      href={fullHref}
                      className={`sidebar-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-2' : ''}`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <item.icon className="icon flex-shrink-0" />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const renderFlatNav = (items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== `/${locale}/patient` && item.href !== `/${locale}/doctor` && item.href !== `/${locale}/reception` && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-2' : ''}`}
            title={!sidebarOpen ? item.label : undefined}
          >
            <item.icon className="icon flex-shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <AuthProvider>
      <AuthGuard locale={locale}>
      <div className="flex min-h-screen">
      <aside
        className={`sidebar transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden lg:flex`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white flex-shrink-0">
              <FlaskConical className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-surface-900 whitespace-nowrap">المختبر</span>
                <span className="text-[10px] text-surface-400 whitespace-nowrap">Al Mokhtabar Laboratory</span>
              </div>
            )}
          </div>

          {isAdmin && sidebarOpen && (
            <div className="px-3 pt-3 pb-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-400" />
                <input
                  type="text"
                  placeholder="بحث في القوائم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 py-1.5 pe-9 ps-3 text-xs text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none"
                />
              </div>
            </div>
          )}

          {isAdmin ? renderAdminSidebar() : navItems && renderFlatNav(navItems)}

          <div className="px-3 py-3 border-t border-surface-100 space-y-1">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`sidebar-item ${!sidebarOpen ? 'justify-center px-2' : ''}`}
            >
              {darkMode ? <Sun className="icon flex-shrink-0" /> : <Moon className="icon flex-shrink-0" />}
              {sidebarOpen && <span>{darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>}
            </button>
            <button
              onClick={handleLogout}
              className={`sidebar-item text-danger-500 hover:text-danger-600 hover:bg-danger-50 w-full ${!sidebarOpen ? 'justify-center px-2' : ''}`}
            >
              <LogOut className="icon flex-shrink-0" />
              {sidebarOpen && <span>تسجيل الخروج</span>}
            </button>
          </div>
        </div>
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-72 bg-white dark:bg-surface-900 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-16 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-surface-900 dark:text-white">المختبر</span>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)}>
                <X className="h-5 w-5 text-surface-400" />
              </button>
            </div>
            {isAdmin ? (
              <nav className="py-3 space-y-3">
                {adminNavSections.map((section) => (
                  <div key={section.title}>
                    <div className="px-5 py-1 text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                      {section.title}
                    </div>
                    {section.items.map((item) => {
                      const fullHref = `/${locale}${item.href}`;
                      const isActive = pathname === fullHref;
                      return (
                        <Link
                          key={item.href}
                          href={fullHref}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`sidebar-item ${isActive ? 'active' : ''}`}
                        >
                          <item.icon className="icon" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            ) : (
              <nav className="px-3 py-4 space-y-1">
                {navItems?.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`sidebar-item ${isActive ? 'active' : ''}`}
                    >
                      <item.icon className="icon" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
            <div className="px-3 py-3 border-t border-surface-100 dark:border-surface-800 space-y-1">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="sidebar-item"
              >
                {darkMode ? <Sun className="icon" /> : <Moon className="icon" />}
                <span>{darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="sidebar-item text-danger-500 hover:text-danger-600 hover:bg-danger-50 w-full"
              >
                <LogOut className="icon" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-surface-100 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 backdrop-blur-lg px-4 lg:px-8">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden text-surface-600 dark:text-surface-400 hover:text-surface-900"
          >
            <Menu className="h-6 w-6" />
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block text-surface-400 hover:text-surface-600"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                type="text"
                placeholder="بحث عن تحاليل، مرضى، طلبات، أطباء..."
                className="input pr-10 py-2 bg-surface-50 dark:bg-surface-800 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-danger-500 text-[10px] font-bold text-white flex items-center justify-center">
                {notifications || 3}
              </span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
              <Globe className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600 text-sm font-bold">
                  {getInitials()}
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-surface-900 dark:text-white">
                      {user?.firstNameAr} {user?.lastNameAr}
                  </div>
                  <div className="text-xs text-surface-500">{roleLabel(user?.role || '')}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-surface-400 hidden md:block" />
              </button>

              {showProfile && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-elevated animate-in z-50">
                  <div className="p-3 border-b border-surface-100 dark:border-surface-800">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {user?.firstNameAr} {user?.lastNameAr}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 text-[10px] font-medium">
                      {roleLabel(user?.role || '')}
                    </span>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link
                      href={`/${locale}/admin/settings`}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                      onClick={() => setShowProfile(false)}
                    >
                      <Settings className="h-4 w-4" />
                      الإعدادات
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger-500 hover:bg-danger-50 w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      </div>
    </AuthGuard>
    </AuthProvider>
  );
}
