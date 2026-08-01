import {
  LayoutDashboard, BarChart3, DollarSign, Calendar, Users, UserCog, Stethoscope,
  ClipboardList, Building2, TestTube2, Package, FileText, FileCheck, Archive,
  Calculator, Wallet, Shield, Megaphone, Search, Globe, Image,
  BookOpen, Tag, Percent, Bell, Mail, MessageSquare, Phone, Key, Lock,
  ScrollText, Activity, Wifi, Server, ShieldCheck, Settings, Brain,
  UserPlus, Building, UserCheck, BadgeCheck,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
  roles?: string[];
}

export const adminNavSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'الرئيسية',
    items: [
      { label: 'لوحة التحكم التنفيذية', href: '/admin', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'التحليلات', href: '/admin/analytics', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'تحليل الإيرادات', href: '/admin/revenue', icon: DollarSign, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    title: 'العمليات',
    items: [
      { label: 'المواعيد', href: '/admin/appointments', icon: Calendar, roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'] },
      { label: 'المرضى', href: '/admin/patients', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'الأطباء', href: '/admin/doctors', icon: Stethoscope, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'طاقم العمل', href: '/admin/staff', icon: UserCog, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'الاستقبال', href: '/admin/reception', icon: UserPlus, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'الفروع', href: '/admin/branches', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'الأقسام', href: '/admin/departments', icon: ClipboardList, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    title: 'المختبر',
    items: [
      { label: 'التحاليل', href: '/admin/tests', icon: TestTube2, roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] },
      { label: 'الحزم', href: '/admin/packages', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'النتائج', href: '/admin/results', icon: FileCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] },
      { label: 'التقارير', href: '/admin/reports', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'المخزون', href: '/admin/inventory', icon: Archive, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    title: 'المالية',
    items: [
      { label: 'المحاسبة', href: '/admin/accounting', icon: Calculator, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'الرواتب', href: '/admin/payroll', icon: Wallet, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'التأمين', href: '/admin/insurance', icon: Shield, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    title: 'الشراكات والتسويق',
    items: [
      { label: 'الشركاء', href: '/admin/partners', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'التسويق', href: '/admin/marketing', icon: Megaphone, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'تحسين محركات البحث', href: '/admin/seo', icon: Search, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'إدارة المحتوى', href: '/admin/cms', icon: Globe, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'مكتبة الوسائط', href: '/admin/media', icon: Image, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'المدونة', href: '/admin/blog', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'العروض', href: '/admin/offers', icon: Tag, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'الكوبونات', href: '/admin/coupons', icon: Percent, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    title: 'الاتصالات',
    items: [
      { label: 'الإشعارات', href: '/admin/notifications', icon: Bell, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'البريد الإلكتروني', href: '/admin/emails', icon: Mail, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'الرسائل النصية', href: '/admin/sms', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'واتساب', href: '/admin/whatsapp', icon: Phone, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    title: 'النظام',
    items: [
      { label: 'الأدوار', href: '/admin/roles', icon: Key, roles: ['SUPER_ADMIN'] },
      { label: 'الصلاحيات', href: '/admin/permissions', icon: Lock, roles: ['SUPER_ADMIN'] },
      { label: 'سجلات التدقيق', href: '/admin/audit', icon: ScrollText, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'سجل النشاط', href: '/admin/activity', icon: Activity, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'مراقبة API', href: '/admin/api-monitor', icon: Wifi, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'مراقبة الخادم', href: '/admin/server', icon: Server, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'مركز الأمان', href: '/admin/security', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'الإعدادات', href: '/admin/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    title: 'الذكاء الاصطناعي',
    items: [
      { label: 'لوحة AI', href: '/admin/ai', icon: Brain, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
];
