import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// TABS
// ============================================================
interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | null>(null);

interface TabsProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

function Tabs({ children, value, defaultValue = '', onValueChange, className }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (v: string) => {
    if (!isControlled) setInternalValue(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn('', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'underline' | 'pills' | 'enclosed';
}

function TabsList({ className, variant = 'underline', children, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex',
        variant === 'underline' && 'gap-0 border-b border-surface-200',
        variant === 'pills' && 'gap-1 bg-surface-100 p-1 rounded-xl',
        variant === 'enclosed' && 'gap-0 bg-surface-50 p-1 rounded-xl border border-surface-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
  count?: number;
}

function TabsTrigger({ value, icon, count, className, children, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext)!;
  const isActive = ctx.value === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        isActive
          ? 'text-brand-600'
          : 'text-surface-500 hover:text-surface-700',
        // underline variant
        'border-b-2 -mb-px',
        isActive ? 'border-brand-600' : 'border-transparent',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
            isActive ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext)!;
  if (ctx.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================
// BREADCRUMB
// ============================================================
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

function Breadcrumb({ items, separator, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('', className)}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="text-surface-300">
                {separator || (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" />
                  </svg>
                )}
              </span>
            )}
            {item.href && index < items.length - 1 ? (
              <a
                href={item.href}
                className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-brand-600 transition-colors"
              >
                {item.icon}
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-sm',
                  index === items.length - 1 ? 'font-medium text-surface-900' : 'text-surface-500'
                )}
              >
                {item.icon}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ============================================================
// PAGINATION
// ============================================================
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  className?: string;
}

function Pagination({ page, totalPages, onPageChange, siblingCount = 1, showFirstLast = true, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const range = React.useMemo(() => {
    const totalNumbers = siblingCount * 2 + 3;
    if (totalPages <= totalNumbers) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const left = Math.max(page - siblingCount, 1);
    const right = Math.min(page + siblingCount, totalPages);
    const showLeft = left > 2;
    const showRight = right < totalPages - 1;

    const items: (number | string)[] = [1];
    if (showLeft) items.push('...');
    for (let i = left; i <= right; i++) items.push(i);
    if (showRight) items.push('...');
    items.push(totalPages);
    return items;
  }, [page, totalPages, siblingCount]);

  return (
    <nav className={cn('flex items-center gap-1', className)} aria-label="Pagination">
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.5 4.5h3v7h-3v-7zM7 4.5l3.5 3.5L7 11.5v-7z" />
          </svg>
        </button>
      )}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-8 w-8 flex items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10.354 3.646a.5.5 0 010 .708L7.707 8l2.647 2.646a.5.5 0 01-.708.708l-3-3a.5.5 0 010-.708l3-3a.5.5 0 01.708 0z" />
        </svg>
      </button>
      {range.map((item, index) => (
        typeof item === 'number' ? (
          <button
            key={index}
            onClick={() => onPageChange(item)}
            className={cn(
              'h-8 w-8 text-sm font-medium rounded-lg transition-colors',
              item === page
                ? 'bg-brand-600 text-white'
                : 'text-surface-600 hover:bg-surface-100'
            )}
          >
            {item}
          </button>
        ) : (
          <span key={index} className="h-8 w-8 flex items-center justify-center text-surface-400">
            ...
          </span>
        )
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="h-8 w-8 flex items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5.646 3.646a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-3 3a.5.5 0 01-.708-.708L8.293 8 5.646 5.354a.5.5 0 010-.708z" />
        </svg>
      </button>
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10.5 4.5v7h3v-7h-3zM6 4.5l3.5 3.5L6 11.5v-7z" />
          </svg>
        </button>
      )}
    </nav>
  );
}

// ============================================================
// DROPDOWN MENU
// ============================================================
interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  width?: number;
  className?: string;
}

function Dropdown({ trigger, children, align = 'end', width = 200, className }: DropdownProps) {
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
    <div ref={ref} className="relative inline-flex">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 bg-white rounded-xl shadow-xl border border-surface-100 py-1.5',
            'animate-in fade-in-0 zoom-in-95',
            align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2',
            className
          )}
          style={{ width }}
        >
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
      )}
    </div>
  );
}

function DropdownItem({ children, className, danger, icon, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-sm text-right transition-colors',
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

function DropdownSeparator() {
  return <div className="my-1.5 h-px bg-surface-100" />;
}

// ============================================================
// SWITCH / TOGGLE GROUP
// ============================================================
interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function ToggleGroup({ value, onValueChange, children, className }: ToggleGroupProps) {
  return (
    <div
      className={cn('inline-flex bg-surface-100 p-1 rounded-xl', className)}
      role="radiogroup"
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            active: (child as any).props.value === value,
            onClick: () => onValueChange((child as any).props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

function ToggleGroupItem({ value, active, children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; active?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
        active ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export {
  Tabs, TabsList, TabsTrigger, TabsContent,
  Breadcrumb,
  Pagination,
  Dropdown, DropdownItem, DropdownSeparator,
  ToggleGroup, ToggleGroupItem,
};
