export const formatCurrency = (
  amount: number,
  currency: string = 'SAR',
): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (
  date: string | Date,
  locale: 'ar' | 'en' = 'ar',
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (
  date: string | Date,
  locale: 'ar' | 'en' = 'ar',
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (
  date: string | Date,
  locale: 'ar' | 'en' = 'ar',
): string => {
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`;
};

export const formatRelativeTime = (
  date: string | Date,
  locale: 'ar' | 'en' = 'ar',
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const isPast = diffMs < 0;
  const abs = Math.abs;

  if (locale === 'ar') {
    if (abs(diffMin) < 1) return 'الآن';
    if (abs(diffMin) < 60) return `${abs(diffMin)} دقيقة ${isPast ? 'مضت' : 'متبقية'}`;
    if (abs(diffHour) < 24) return `${abs(diffHour)} ساعة ${isPast ? 'مضت' : 'متبقية'}`;
    if (abs(diffDay) < 7) return `${abs(diffDay)} يوم ${isPast ? 'مضت' : 'متبقية'}`;
    return formatDate(d, 'ar');
  }

  if (abs(diffMin) < 1) return 'now';
  if (abs(diffMin) < 60) return `${abs(diffMin)} min ${isPast ? 'ago' : 'left'}`;
  if (abs(diffHour) < 24) return `${abs(diffHour)}h ${isPast ? 'ago' : 'left'}`;
  if (abs(diffDay) < 7) return `${abs(diffDay)}d ${isPast ? 'ago' : 'left'}`;
  return formatDate(d, 'en');
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('966')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  if (cleaned.length === 9) {
    return `+966 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
