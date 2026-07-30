import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedChart, ResultsTrendChart, AppointmentStatsChart, RevenueChart } from '@/components/motion/AnimatedCharts';

const sampleData = [
  { month: 'Jan', value: 100 },
  { month: 'Feb', value: 200 },
  { month: 'Mar', value: 150 },
];

const sampleRevenueData = [
  { period: 'Q1', revenue: 5000, cost: 3000 },
  { period: 'Q2', revenue: 7000, cost: 4000 },
];

describe('AnimatedChart', () => {
  it('renders line chart', () => {
    const { container } = render(
      <AnimatedChart type="line" data={sampleData} xKey="month" yKey="value" />
    );
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
    expect(container.querySelector('.recharts-line')).toBeInTheDocument();
  });

  it('renders bar chart', () => {
    const { container } = render(
      <AnimatedChart type="bar" data={sampleData} xKey="month" yKey="value" />
    );
    expect(container.querySelector('.recharts-bar')).toBeInTheDocument();
  });

  it('renders area chart', () => {
    const { container } = render(
      <AnimatedChart type="area" data={sampleData} xKey="month" yKey="value" />
    );
    expect(container.querySelector('.recharts-area')).toBeInTheDocument();
  });

  it('renders pie chart', () => {
    const { container } = render(
      <AnimatedChart type="pie" data={sampleData} xKey="month" yKey="value" />
    );
    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });

  it('renders radar chart', () => {
    const { container } = render(
      <AnimatedChart type="radar" data={sampleData} xKey="month" yKey="value" />
    );
    expect(container.querySelector('.recharts-radar')).toBeInTheDocument();
  });

  it('hides grid when showGrid=false', () => {
    const { container } = render(
      <AnimatedChart type="line" data={sampleData} xKey="month" yKey="value" showGrid={false} />
    );
    expect(container.querySelector('.recharts-cartesian-grid')).toBeInTheDocument();
  });

  it('applies custom height', () => {
    const { container } = render(
      <AnimatedChart type="line" data={sampleData} xKey="month" yKey="value" height={400} />
    );
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('accepts custom color', () => {
    const { container } = render(
      <AnimatedChart type="line" data={sampleData} xKey="month" yKey="value" color="#FF0000" />
    );
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    const { container } = render(
      <AnimatedChart type="line" data={[]} xKey="month" yKey="value" />
    );
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});

describe('ResultsTrendChart', () => {
  it('renders title and chart', () => {
    render(<ResultsTrendChart data={sampleData} />);
    expect(screen.getByText('اتجاه نتائج التحاليل')).toBeInTheDocument();
  });
});

describe('AppointmentStatsChart', () => {
  it('renders title and chart', () => {
    render(<AppointmentStatsChart data={sampleData} />);
    expect(screen.getByText('إحصائيات المواعيد')).toBeInTheDocument();
  });
});

describe('RevenueChart', () => {
  it('renders title and chart', () => {
    render(<RevenueChart data={sampleRevenueData} />);
    expect(screen.getByText('تحليل الإيرادات')).toBeInTheDocument();
  });
});
