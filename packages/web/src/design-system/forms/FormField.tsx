import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// FORM FIELD WRAPPER
// ============================================================
interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

function FormField({ label, description, error, required, children, className, htmlFor }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-surface-700">
          {label}
          {required && <span className="mr-1 text-danger-500">*</span>}
        </label>
      )}
      {children}
      {description && !error && (
        <p className="text-xs text-surface-400">{description}</p>
      )}
      {error && (
        <p className="flex items-center gap-1 text-xs text-danger-600">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// FORM GROUP (horizontal layout)
// ============================================================
interface FormGroupProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}

function FormGroup({ children, columns = 1, gap = 4, className }: FormGroupProps) {
  return (
    <div
      className={cn(
        'grid',
        {
          'grid-cols-1': columns === 1,
          'grid-cols-1 sm:grid-cols-2': columns === 2,
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': columns === 3,
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': columns === 4,
        },
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================
// FORM SECTION
// ============================================================
function FormSection({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-surface-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-surface-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// FORM ACTIONS
// ============================================================
function FormActions({ children, className, align = 'end' }: { children: React.ReactNode; className?: string; align?: 'start' | 'center' | 'end' | 'between' }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 pt-4 border-t border-surface-100',
        {
          'justify-start': align === 'start',
          'justify-center': align === 'center',
          'justify-end': align === 'end',
          'justify-between': align === 'between',
        },
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================
// SEARCH INPUT (with debounce)
// ============================================================
interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onSearch: (value: string) => void;
  debounceMs?: number;
}

function SearchInput({ onSearch, debounceMs = 300, className, ...props }: SearchInputProps) {
  const [value, setValue] = React.useState(props.defaultValue as string || '');
  const timerRef = React.useRef<NodeJS.Timeout>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(val), debounceMs);
  };

  return (
    <div className={cn('relative', className)}>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className={cn(
          'w-full rounded-xl border border-surface-200 bg-white py-2.5 pr-10 pl-4 text-sm text-surface-900',
          'placeholder:text-surface-400',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none',
          'transition-all',
          className
        )}
        {...props}
      />
    </div>
  );
}

// ============================================================
// FILE UPLOAD
// ============================================================
interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onFiles: (files: File[]) => void;
  className?: string;
  label?: string;
  description?: string;
}

function FileUpload({ accept, multiple, maxSize = 10 * 1024 * 1024, onFiles, className, label, description }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => !maxSize || f.size <= maxSize);
    if (files.length > 0) onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all',
        isDragOver
          ? 'border-brand-400 bg-brand-50'
          : 'border-surface-200 bg-surface-50 hover:border-brand-300 hover:bg-brand-50/50',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 text-surface-400 mb-3">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-surface-700">
        {label || 'اسحب الملفات هنا أو انقر للتحميل'}
      </p>
      {description && <p className="mt-1 text-xs text-surface-400">{description}</p>}
    </div>
  );
}

// ============================================================
// DATE DISPLAY
// ============================================================
function DateDisplay({ date, format = 'medium', className }: { date: Date | string; format?: 'short' | 'medium' | 'long' | 'full'; className?: string }) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    short: { day: 'numeric', month: 'short' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  }[format]!;

  return (
    <time dateTime={d.toISOString()} className={cn('text-sm text-surface-600', className)}>
      {d.toLocaleDateString('ar-SA', options)}
    </time>
  );
}

// ============================================================
// COUNTER / QUANTITY INPUT
// ============================================================
function QuantityInput({ value, onChange, min = 0, max = 999, step = 1, className }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; className?: string }) {
  return (
    <div className={cn('inline-flex items-center rounded-xl border border-surface-200 bg-white', className)}>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="h-9 w-9 flex items-center justify-center text-surface-500 hover:bg-surface-50 disabled:opacity-30 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.5 8a.5.5 0 01.5-.5h8a.5.5 0 010 1H4a.5.5 0 01-.5-.5z" />
        </svg>
      </button>
      <span className="w-10 text-center text-sm font-medium text-surface-900">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        className="h-9 w-9 flex items-center justify-center text-surface-500 hover:bg-surface-50 disabled:opacity-30 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3.5a.5.5 0 01.5.5v3.5H11a.5.5 0 010 1H8.5V12a.5.5 0 01-1 0V8.5H4a.5.5 0 010-1h3.5V4a.5.5 0 01.5-.5z" />
        </svg>
      </button>
    </div>
  );
}

export {
  FormField, FormGroup, FormSection, FormActions,
  SearchInput, FileUpload, DateDisplay, QuantityInput,
};
