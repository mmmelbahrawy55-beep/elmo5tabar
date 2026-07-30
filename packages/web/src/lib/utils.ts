import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================
// UTILITY: cn (class name merge)
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// FORMAT: Date
// ============================================================
export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' | 'full' = 'medium', locale = 'ar-SA'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    short: { day: 'numeric', month: 'short' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  }[format]!;
  return d.toLocaleDateString(locale, options);
}

export function formatDateTime(date: Date | string, locale = 'ar-SA'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string, locale = 'ar-SA'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diffDay > 0) return rtf.format(-diffDay, 'day');
  if (diffHr > 0) return rtf.format(-diffHr, 'hour');
  if (diffMin > 0) return rtf.format(-diffMin, 'minute');
  return 'الآن';
}

// ============================================================
// FORMAT: Currency & Numbers
// ============================================================
export function formatCurrency(amount: number, currency = 'SAR', locale = 'ar-SA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number, locale = 'ar-SA'): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatCompactNumber(num: number, locale = 'ar-SA'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

// ============================================================
// FORMAT: Phone & ID
// ============================================================
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatNationalId(id: string): string {
  const cleaned = id.replace(/\D/g, '');
  return cleaned.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

// ============================================================
// HELPERS
// ============================================================
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timer: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function generateQrUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============================================================
// FORMAT: Time
// ============================================================
export function formatTime(time: string, locale: 'ar' | 'en' = 'ar'): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = locale === 'ar' ? (h >= 12 ? 'م' : 'ص') : (h >= 12 ? 'PM' : 'AM');
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// ============================================================
// COLOR HELPERS
// ============================================================
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-warning-100 text-warning-700',
    confirmed: 'bg-info-100 text-info-700',
    'in-progress': 'bg-brand-100 text-brand-700',
    completed: 'bg-success-100 text-success-700',
    cancelled: 'bg-danger-100 text-danger-700',
    draft: 'bg-surface-100 text-surface-600',
    paid: 'bg-success-100 text-success-700',
    unpaid: 'bg-danger-100 text-danger-700',
    'partial-payment': 'bg-warning-100 text-warning-700',
    normal: 'bg-success-100 text-success-700',
    critical: 'bg-danger-100 text-danger-700',
    high: 'bg-warning-100 text-warning-700',
  };
  return map[status] || 'bg-surface-100 text-surface-600';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    'in-progress': 'قيد التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    draft: 'مسودة',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    'partial-payment': 'دفع جزئي',
    normal: 'طبيعي',
    critical: 'حرج',
    high: 'مرتفع',
  };
  return map[status] || status;
}
