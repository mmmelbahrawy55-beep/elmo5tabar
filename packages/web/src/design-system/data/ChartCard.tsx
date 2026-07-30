import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/design-system/layout/Card';

// ============================================================
// CHART CARD (wraps any chart with consistent header)
// ============================================================
interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

function ChartCard({ title, description, action, children, className, loading }: ChartCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// BAR CHART (CSS-only, no library dependency)
// ============================================================
interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue?: number;
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
  horizontal?: boolean;
  className?: string;
}

function BarChart({ data, maxValue, height = 200, showLabels = true, showValues = true, horizontal, className }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  if (horizontal) {
    return (
      <div className={cn('space-y-3', className)}>
        {data.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              {showLabels && <span className="text-xs text-surface-600">{item.label}</span>}
              {showValues && <span className="text-xs font-semibold text-surface-900">{item.value.toLocaleString('ar-SA')}</span>}
            </div>
            <div className="h-2.5 w-full rounded-full bg-surface-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700 ease-out', item.color || 'bg-brand-500')}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center flex-1 gap-1">
            {showValues && (
              <span className="text-[10px] font-semibold text-surface-700">{item.value.toLocaleString('ar-SA')}</span>
            )}
            <div
              className={cn(
                'w-full rounded-t-lg transition-all duration-500 ease-out min-h-[2px]',
                item.color || 'bg-brand-500'
              )}
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      {showLabels && (
        <div className="flex gap-2 mt-2">
          {data.map((item, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[10px] text-surface-500 truncate block">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// DONUT CHART (CSS-only)
// ============================================================
interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

function DonutChart({ data, size = 160, thickness = 24, centerLabel, centerValue, className }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  const segments = data.map((item) => {
    const percent = item.value / total;
    const offset = circumference - accumulated * circumference;
    const dashArray = `${percent * circumference} ${circumference}`;
    accumulated += percent;
    return { ...item, percent, offset, dashArray };
  });

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.offset}
            className="transition-all duration-700 ease-out"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerValue !== undefined && (
          <span className="text-xl font-bold text-surface-900">{centerValue}</span>
        )}
        {centerLabel && (
          <span className="text-[10px] text-surface-500 mt-0.5">{centerLabel}</span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DONUT LEGEND
// ============================================================
function DonutLegend({ data, className }: { data: Array<{ label: string; value: number; color: string }>; className?: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className={cn('space-y-2', className)}>
      {data.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-surface-600">{item.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-surface-900">{item.value.toLocaleString('ar-SA')}</span>
            <span className="text-[10px] text-surface-400">
              ({Math.round((item.value / total) * 100)}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SPARKLINE (mini chart)
// ============================================================
function Sparkline({ data, color = '#0077B6', height = 32, width = 80, className }: { data: number[]; color?: string; height?: number; width?: number; className?: string }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className={cn('shrink-0', className)}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// METRIC ROW (used in dashboards)
// ============================================================
function MetricRow({ label, value, change, sparkData, className }: { label: string; value: string | number; change?: number; sparkData?: number[]; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between py-3', className)}>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-500">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-lg font-bold text-surface-900">{typeof value === 'number' ? value.toLocaleString('ar-SA') : value}</span>
          {change !== undefined && (
            <span className={cn('text-xs font-semibold', change >= 0 ? 'text-success-600' : 'text-danger-600')}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </span>
          )}
        </div>
      </div>
      {sparkData && (
        <Sparkline
          data={sparkData}
          color={change !== undefined && change < 0 ? '#EF4444' : '#10B981'}
        />
      )}
    </div>
  );
}

// ============================================================
// EMPTY CHART STATE
// ============================================================
function EmptyChart({ message = 'لا توجد بيانات', className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <svg className="h-10 w-10 text-surface-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="12" width="4" height="9" rx="1" />
        <rect x="10" y="8" width="4" height="13" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
      </svg>
      <p className="text-sm text-surface-500">{message}</p>
    </div>
  );
}

export {
  ChartCard, BarChart, DonutChart, DonutLegend, Sparkline, MetricRow, EmptyChart,
};
