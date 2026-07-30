import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// TOOLTIP
// ============================================================
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

function Tooltip({ content, children, side = 'top', delay = 300, className, disabled }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const positionRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const show = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  React.useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-surface-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-surface-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-surface-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-surface-900 border-y-transparent border-l-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open && (
        <div
          ref={positionRef}
          role="tooltip"
          className={cn(
            'absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-surface-900 rounded-lg shadow-lg',
            'animate-in fade-in-0 zoom-in-95',
            sideClasses[side],
            className
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses[side]
            )}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// POPOVER
// ============================================================
interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  width?: 'auto' | 'trigger' | number;
  className?: string;
}

function Popover({ trigger, children, side = 'bottom', align = 'center', width = 'auto', className }: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const alignClasses = {
    start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
    center: side === 'top' || side === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
    end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 bg-white rounded-xl shadow-xl border border-surface-100 p-4',
            'animate-in fade-in-0 zoom-in-95',
            sideClasses[side],
            alignClasses[align],
            className
          )}
          style={{ width: typeof width === 'number' ? width : width === 'trigger' ? '100%' : undefined }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ACCORDION
// ============================================================
interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface AccordionContextType {
  value: string[];
  onToggle: (item: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
}

function Accordion({ children, type = 'single', value, defaultValue = [], onValueChange, className }: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleToggle = (item: string) => {
    let newValue: string[];
    if (type === 'single') {
      newValue = currentValue.includes(item) ? [] : [item];
    } else {
      newValue = currentValue.includes(item)
        ? currentValue.filter((v) => v !== item)
        : [...currentValue, item];
    }
    if (!isControlled) setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <AccordionContext.Provider value={{ value: currentValue, onToggle: handleToggle, type }}>
      <div className={cn('divide-y divide-surface-100 rounded-2xl border border-surface-100 bg-white', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ value, children, disabled }: AccordionItemProps) {
  const ctx = React.useContext(AccordionContext)!;
  const isOpen = ctx.value.includes(value);

  return (
    <div className={cn('first:rounded-t-2xl last:rounded-b-2xl', disabled && 'opacity-50 pointer-events-none')}>
      <AccordionContext.Provider value={{ ...ctx, value: isOpen ? [value] : [] }}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              'data-open': isOpen,
              'data-value': value,
            });
          }
          return child;
        })}
      </AccordionContext.Provider>
    </div>
  );
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

function AccordionTrigger({ children, className, icon, ...props }: AccordionTriggerProps) {
  const ctx = React.useContext(AccordionContext)!;
  const open = (props as any)['data-open'];
  const value = (props as any)['data-value'];

  return (
    <button
      type="button"
      onClick={() => ctx.onToggle(value)}
      className={cn(
        'flex w-full items-center justify-between px-5 py-4 text-right font-medium text-surface-900 transition-colors',
        'hover:bg-surface-50',
        'rounded-t-2xl',
        className
      )}
      {...props}
    >
      <span className="flex-1">{children}</span>
      {icon || (
        <svg
          className={cn('h-4 w-4 text-surface-400 transition-transform duration-200', open && 'rotate-180')}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function AccordionContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const open = (undefined as any); // determined by parent

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300',
        open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        'px-5 pb-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export { Tooltip, Popover, Accordion, AccordionItem, AccordionTrigger, AccordionContent };
