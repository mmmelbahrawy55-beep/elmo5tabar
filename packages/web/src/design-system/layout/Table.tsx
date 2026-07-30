import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// TABLE
// ============================================================
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  compact?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

function Table({ className, compact, striped, hoverable, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-surface-100">
      <table
        className={cn(
          'w-full text-sm',
          compact && '[&_td]:py-2 [&_th]:py-2',
          !compact && '[&_td]:py-3.5 [&_th]:py-3.5',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead className={cn('bg-surface-50 border-b border-surface-100', className)} {...props} />
  );
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  striped?: boolean;
}

function TableBody({ className, striped, ...props }: TableBodyProps) {
  return <tbody className={cn(striped && '[&>tr:nth-child(even)]:bg-surface-50/50', className)} {...props} />;
}

function TableRow({ className, hoverable, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { hoverable?: boolean }) {
  return (
    <tr
      className={cn(
        'border-b border-surface-50 last:border-0',
        hoverable && 'hover:bg-surface-50/50 transition-colors',
        className
      )}
      {...props}
    />
  );
}

interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc';
  onSort?: () => void;
  align?: 'left' | 'center' | 'right';
}

function Th({ className, sortable, sorted, onSort, align = 'left', children, ...props }: ThProps) {
  return (
    <th
      className={cn(
        'px-4 text-xs font-semibold uppercase tracking-wider text-surface-500',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        sortable && 'cursor-pointer select-none hover:text-surface-700',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {sortable && (
          <span className="flex flex-col -space-y-1">
            <svg
              className={cn('h-2.5 w-2.5', sorted === 'asc' ? 'text-brand-600' : 'text-surface-300')}
              viewBox="0 0 10 6"
              fill="currentColor"
            >
              <path d="M5 0l5 6H0z" />
            </svg>
            <svg
              className={cn('h-2.5 w-2.5', sorted === 'desc' ? 'text-brand-600' : 'text-surface-300')}
              viewBox="0 0 10 6"
              fill="currentColor"
            >
              <path d="M5 6L0 0h10z" />
            </svg>
          </span>
        )}
      </span>
    </th>
  );
}

interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

function Td({ className, align = 'left', ...props }: TdProps) {
  return (
    <td
      className={cn(
        'px-4 text-surface-700',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    />
  );
}

// ============================================================
// DATA TABLE (with built-in sorting, pagination, empty state)
// ============================================================
interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onRowClick?: (item: T) => void;
}

function DataTable<T>({
  columns,
  data,
  keyExtractor,
  pagination = true,
  pageSize = 10,
  emptyTitle = 'لا توجد بيانات',
  emptyDescription,
  emptyIcon,
  loading,
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(0);
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const cmp = aVal < bVal ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = pagination ? Math.ceil(sortedData.length / pageSize) : 1;
  const paginatedData = pagination ? sortedData.slice(page * pageSize, (page + 1) * pageSize) : sortedData;

  React.useEffect(() => { setPage(0); }, [data]);

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-surface-100 overflow-hidden', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-surface-50 last:border-0">
            {columns.map((col) => (
              <div key={col.key} className="flex-1 h-4 animate-pulse rounded bg-surface-100" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('rounded-xl border border-surface-100', className)}>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          {emptyIcon && (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-100 text-surface-400 mb-3">
              {emptyIcon}
            </div>
          )}
          <p className="text-sm font-semibold text-surface-900">{emptyTitle}</p>
          {emptyDescription && <p className="mt-1 text-xs text-surface-500">{emptyDescription}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Table hoverable>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <Th
                key={col.key}
                align={col.align}
                sortable={col.sortable}
                sorted={sortKey === col.key ? sortDir : undefined}
                onSort={() => handleSort(col.key)}
                className={col.className}
              >
                {col.header}
              </Th>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item, index) => (
            <TableRow
              key={keyExtractor(item)}
              hoverable
              className={onRowClick ? 'cursor-pointer' : ''}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <Td key={col.key} align={col.align} className={col.className}>
                  {col.render ? col.render(item, index) : (item as any)[col.key]}
                </Td>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
          <p className="text-xs text-surface-500">
            عرض {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sortedData.length)} من{' '}
            {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="px-2.5 py-1.5 text-xs font-medium text-surface-600 rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'h-7 w-7 text-xs font-medium rounded-lg transition-colors',
                  i === page ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-100'
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1.5 text-xs font-medium text-surface-600 rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { Table, TableHeader, TableBody, TableRow, Th, Td, DataTable, type Column };
