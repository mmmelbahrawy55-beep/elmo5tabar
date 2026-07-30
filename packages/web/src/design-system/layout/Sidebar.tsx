import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/design-system/primitives/Badge';
import { Badge } from '@/design-system/primitives/Badge';

// ============================================================
// SIDEBAR
// ============================================================
interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
  onToggle?: () => void;
}

function Sidebar({ collapsed, onToggle, children, className, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 right-0 z-30 flex flex-col border-l border-surface-100 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

function SidebarLogo({ src, alt, collapsed, className }: { src?: string; alt?: string; collapsed?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-surface-100', className)}>
      {src && (
        <img src={src} alt={alt || 'Logo'} className={cn('h-8 object-contain transition-all', collapsed && 'h-7')} />
      )}
      {!collapsed && (
        <span className="text-lg font-bold text-surface-900 tracking-tight">المختبر</span>
      )}
    </div>
  );
}

interface SidebarNavProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
}

function SidebarNav({ children, className, label }: SidebarNavProps) {
  return (
    <nav className={cn('flex-1 overflow-y-auto px-3 py-4', className)}>
      {label && (
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-surface-400">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">{children}</ul>
    </nav>
  );
}

interface SidebarNavItemProps extends React.HTMLAttributes<HTMLLIElement> {
  href?: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string | number;
  collapsed?: boolean;
}

function SidebarNavItem({ href, icon, active, badge, collapsed, children, className, ...props }: SidebarNavItemProps) {
  const content = (
    <li {...props}>
      <a
        href={href}
        className={cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
          active
            ? 'bg-brand-50 text-brand-700'
            : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900',
          collapsed && 'justify-center px-2',
          className
        )}
      >
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center',
            active ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-600'
          )}
        >
          {icon}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{children}</span>
            {badge !== undefined && (
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                  active ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500'
                )}
              >
                {badge}
              </span>
            )}
          </>
        )}
      </a>
    </li>
  );
  return content;
}

function SidebarFooter({ children, className, collapsed }: { children: React.ReactNode; className?: string; collapsed?: boolean }) {
  return (
    <div className={cn('border-t border-surface-100 p-3', className)}>
      {children}
    </div>
  );
}

// ============================================================
// HEADER
// ============================================================
interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

function Header({ onMenuClick, showMenuButton, children, className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-surface-100 bg-white/80 backdrop-blur-xl px-4 lg:px-6',
        className
      )}
      {...props}
    >
      {showMenuButton && (
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 lg:hidden"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      {children}
    </header>
  );
}

function HeaderTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={cn('text-lg font-semibold text-surface-900', className)}>{children}</h1>;
}

function HeaderSearch({ placeholder, value, onChange, className }: { placeholder?: string; value?: string; onChange?: (v: string) => void; className?: string }) {
  return (
    <div className={cn('relative flex-1 max-w-md', className)}>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
      </svg>
      <input
        type="text"
        placeholder={placeholder || 'بحث...'}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2 pr-10 pl-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
      />
    </div>
  );
}

function HeaderActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-2 mr-auto', className)}>{children}</div>;
}

function HeaderIconButton({ children, className, badge, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { badge?: number }) {
  return (
    <button
      className={cn(
        'relative rounded-xl p-2.5 text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors',
        className
      )}
      {...props}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

// ============================================================
// FOOTER
// ============================================================
interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'minimal' | 'landing';
}

function Footer({ variant = 'default', children, className, ...props }: FooterProps) {
  if (variant === 'minimal') {
    return (
      <footer className={cn('border-t border-surface-100 bg-white py-4 px-6', className)} {...props}>
        <div className="flex items-center justify-between">
          {children}
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn('border-t border-surface-100 bg-surface-50', className)} {...props}>
      {children}
    </footer>
  );
}

function FooterContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto max-w-7xl px-6 py-12', className)}>{children}</div>;
}

function FooterBottom({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('border-t border-surface-200 px-6 py-6', className)}>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// MOBILE BOTTOM NAV
// ============================================================
interface MobileNavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface MobileNavProps {
  items: MobileNavItem[];
  activeHref?: string;
  className?: string;
}

function MobileNav({ items, activeHref, className }: MobileNavProps) {
  return (
    <nav className={cn('fixed bottom-0 inset-x-0 z-40 bg-white border-t border-surface-100 safe-area-bottom lg:hidden', className)}>
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = activeHref === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-brand-600' : 'text-surface-400'
              )}
            >
              <span className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger-500 px-0.5 text-[7px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// PROFILE DROPDOWN
// ============================================================
interface ProfileDropdownProps {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  children: React.ReactNode;
  className?: string;
}

function ProfileDropdown({ name, email, avatar, role, children, className }: ProfileDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-xl p-1.5 pr-3 hover:bg-surface-50 transition-colors"
      >
        <Avatar src={avatar} alt={name} size="sm" fallback={name?.charAt(0)} />
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-surface-900 leading-tight">{name}</p>
          {role && <p className="text-[10px] text-surface-500">{role}</p>}
        </div>
        <svg
          className={cn('h-4 w-4 text-surface-400 transition-transform', open && 'rotate-180')}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-surface-100 py-2 z-50 animate-in fade-in-0 zoom-in-95">
          <div className="px-4 py-2 border-b border-surface-100">
            <p className="text-sm font-semibold text-surface-900">{name}</p>
            <p className="text-xs text-surface-500">{email}</p>
          </div>
          <div className="py-1.5">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  onClick: () => {
                    (child as any).props?.onClick?.();
                    setOpen(false);
                  },
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenuItem({ children, className, danger, icon, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2.5 px-4 py-2 text-sm text-right transition-colors',
        danger ? 'text-danger-600 hover:bg-danger-50' : 'text-surface-700 hover:bg-surface-50',
        className
      )}
      {...props}
    >
      {icon && <span className={cn('shrink-0', danger ? 'text-danger-400' : 'text-surface-400')}>{icon}</span>}
      {children}
    </button>
  );
}

export {
  Sidebar, SidebarLogo, SidebarNav, SidebarNavItem, SidebarFooter,
  Header, HeaderTitle, HeaderSearch, HeaderActions, HeaderIconButton,
  Footer, FooterContent, FooterBottom,
  MobileNav,
  ProfileDropdown, ProfileMenuItem,
};
