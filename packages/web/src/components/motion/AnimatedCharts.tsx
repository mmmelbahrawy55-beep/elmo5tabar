'use client';

import { useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/animations/useScrollReveal';
import { cn } from '@/lib/utils';

interface AnimatedChartProps {
  type: 'line' | 'bar' | 'area' | 'pie' | 'radar';
  data: Array<Record<string, any>>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  animated?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const CHART_COLORS = ['#0077B6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-white/90 backdrop-blur-lg border border-surface-100 rounded-xl px-3 py-2 shadow-lg"
    >
      <p className="text-xs text-surface-500 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </motion.div>
  );
}

export function AnimatedChart({
  type,
  data,
  xKey,
  yKey,
  color = '#0077B6',
  height = 300,
  animated = true,
  showGrid = true,
  showTooltip = true,
  className,
}: AnimatedChartProps) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

  const renderChart = () => {
    const commonProps = {
      data: isVisible ? data : [],
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />}
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: 'white' }}
              strokeDasharray={animated ? undefined : undefined}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />}
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Bar
              dataKey={yKey}
              fill={color}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={color} opacity={isVisible ? 1 : 0} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />}
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <defs>
              <linearGradient id={`areaGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#areaGrad-${color.replace('#', '')})`}
            />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar
              name={yKey}
              dataKey={yKey}
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
          </RadarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={ref} className={cn('w-full', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ResponsiveContainer width="100%" height={height}>
                {renderChart() as any}
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================================
// SPECIFIC CHART COMPONENTS
// ============================================================

interface ResultsTrendChartProps {
  data: Array<{ date: string; value: number }>;
  className?: string;
}

export function ResultsTrendChart({ data, className }: ResultsTrendChartProps) {
  return (
    <div className={cn('rounded-2xl bg-white p-6 border border-surface-100 shadow-sm', className)}>
      <h3 className="text-base font-semibold text-surface-900 mb-4">اتجاه نتائج التحاليل</h3>
      <AnimatedChart
        type="area"
        data={data}
        xKey="date"
        yKey="value"
        color="#0077B6"
        height={280}
        showGrid={false}
      />
    </div>
  );
}

interface AppointmentStatsChartProps {
  data: Array<{ month: string; count: number }>;
  className?: string;
}

export function AppointmentStatsChart({ data, className }: AppointmentStatsChartProps) {
  return (
    <div className={cn('rounded-2xl bg-white p-6 border border-surface-100 shadow-sm', className)}>
      <h3 className="text-base font-semibold text-surface-900 mb-4">إحصائيات المواعيد</h3>
      <AnimatedChart
        type="bar"
        data={data}
        xKey="month"
        yKey="count"
        color="#10B981"
        height={280}
      />
    </div>
  );
}

interface RevenueChartProps {
  data: Array<{ period: string; revenue: number; cost: number }>;
  className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  return (
    <div className={cn('rounded-2xl bg-white p-6 border border-surface-100 shadow-sm', className)}>
      <h3 className="text-base font-semibold text-surface-900 mb-4">تحليل الإيرادات</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" fill="#0077B6" radius={[4, 4, 0, 0]} maxBarSize={30} name="الإيرادات" />
          <Bar dataKey="cost" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} name="التكاليف" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
