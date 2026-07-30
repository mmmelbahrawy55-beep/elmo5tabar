'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput } from '@/design-system/forms/FormField';
import { ExportButton } from './ExportButton';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: { value: string; label: string; count?: number }[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  exportData?: Record<string, unknown>[];
  exportFilename?: string;
}

export function AdminPageHeader({
  title, description, icon, actions, tabs, activeTab, onTabChange,
  searchPlaceholder, onSearch, exportData, exportFilename,
}: AdminPageHeaderProps) {
  const [search, setSearch] = React.useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-surface-500">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {exportData && exportFilename && (
            <ExportButton data={exportData} filename={exportFilename} title={title} />
          )}
          {actions}
        </div>
      </div>
      {(tabs || searchPlaceholder) && (
        <div className="flex items-center justify-between gap-4">
          {tabs && (
            <Tabs value={activeTab} onValueChange={onTabChange}>
              <TabsList>
                {tabs.map(t => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                    {t.count !== undefined && (
                      <Badge variant="secondary" className="ms-2 text-xs">{t.count}</Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          {searchPlaceholder && (
            <div className="w-72">
              <SearchInput
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  onSearch?.(e.target.value);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AdminStatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

export function AdminStatCard({ title, value, change, icon, color = 'brand', subtitle }: AdminStatCardProps) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    info: 'bg-info-50 text-info-600',
    saffron: 'bg-saffron-50 text-saffron-600',
  };
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-surface-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-surface-400">{subtitle}</p>}
            {change !== undefined && (
              <div className={cn('mt-1 flex items-center gap-1 text-xs font-medium', change >= 0 ? 'text-success-600' : 'text-danger-600')}>
                <span>{change >= 0 ? '↑' : '↓'}</span>
                <span>{Math.abs(change)}%</span>
                <span className="text-surface-400">من الشهر السابق</span>
              </div>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', colorMap[color] || colorMap.brand)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: { key: string; label: string; render?: (item: T) => React.ReactNode; className?: string }[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function AdminDataTable<T extends Record<string, unknown>>({ data, columns, onRowClick, emptyMessage = 'لا توجد بيانات' }: AdminDataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-surface-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200 dark:border-surface-700">
            {columns.map(col => (
              <th key={col.key} className={cn('px-4 py-3 text-start text-xs font-medium text-surface-500 uppercase tracking-wider', col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
          {data.map((item, i) => (
            <tr
              key={i}
              className={cn('hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors', onRowClick && 'cursor-pointer')}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map(col => (
                <td key={col.key} className={cn('px-4 py-3 text-surface-700 dark:text-surface-300', col.className)}>
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
