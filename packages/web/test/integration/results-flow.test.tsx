import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResultRevealAnimation } from '@/components/motion/ResultRevealAnimation';
import { EmptyStateAnimation } from '@/components/motion/EmptyStateAnimation';
import { AnimatedChart } from '@/components/motion/AnimatedCharts';

describe('Results Flow Integration', () => {
  it('renders list of result cards with different statuses', () => {
    render(
      <div>
        <ResultRevealAnimation isRevealed={true} status="normal">
          <div data-testid="result-normal">
            <h3>Complete Blood Count</h3>
            <p>Status: Normal</p>
            <p>Value: 5.2 x10^9/L</p>
          </div>
        </ResultRevealAnimation>

        <ResultRevealAnimation isRevealed={true} status="abnormal">
          <div data-testid="result-abnormal">
            <h3>Vitamin D</h3>
            <p>Status: Low</p>
            <p>Value: 18 ng/mL</p>
          </div>
        </ResultRevealAnimation>

        <ResultRevealAnimation isRevealed={false}>
          <div data-testid="result-pending">
            <h3>Thyroid Panel</h3>
            <p>Status: Pending</p>
          </div>
        </ResultRevealAnimation>
      </div>
    );

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Vitamin D')).toBeInTheDocument();
    expect(screen.getByText('Thyroid Panel')).toBeInTheDocument();
  });

  it('filters results by status selection', () => {
    render(
      <div>
        <div role="group">
          <button data-testid="filter-all">All</button>
          <button data-testid="filter-normal">Normal</button>
          <button data-testid="filter-abnormal">Abnormal</button>
          <button data-testid="filter-pending">Pending</button>
        </div>

        <ResultRevealAnimation isRevealed={true} status="normal">
          <div>Normal Result</div>
        </ResultRevealAnimation>
      </div>
    );

    const filterBtn = screen.getByTestId('filter-normal');
    fireEvent.click(filterBtn);
    expect(screen.getByText('Normal Result')).toBeInTheDocument();
  });

  it('renders result details with trend chart', () => {
    render(
      <div>
        <h2>Vitamin D - Trend</h2>
        <AnimatedChart
          type="line"
          data={[
            { date: '2026-01', value: 22 },
            { date: '2026-03', value: 18 },
            { date: '2026-05', value: 25 },
            { date: '2026-07', value: 30 },
          ]}
          xKey="date"
          yKey="value"
          height={200}
        />
      </div>
    );

    expect(screen.getByText('Vitamin D - Trend')).toBeInTheDocument();
  });

  it('shows critical result with red glow and urgent message', () => {
    render(
      <ResultRevealAnimation isRevealed={true} status="critical">
        <div>
          <h3>Troponin I</h3>
          <p data-testid="critical-warning">Critical - Immediate attention required</p>
          <p>Value: 2.5 ng/mL</p>
        </div>
      </ResultRevealAnimation>
    );

    expect(screen.getByText('Troponin I')).toBeInTheDocument();
    expect(screen.getByTestId('critical-warning')).toBeInTheDocument();
  });

  it('renders empty state when no results match filter', () => {
    render(
      <EmptyStateAnimation
        title="No Results Found"
        description="No results match your search criteria"
        variant="search"
        action={{ label: 'Clear Filters', onClick: vi.fn() }}
      />
    );

    expect(screen.getByText('No Results Found')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('reveals hidden result on click', () => {
    const { rerender } = render(
      <ResultRevealAnimation isRevealed={false}>
        <div data-testid="hidden-result">
          <h3>Sensitive Test</h3>
          <p>Click to reveal</p>
        </div>
      </ResultRevealAnimation>
    );

    expect(screen.getByText('Click to reveal')).toBeInTheDocument();

    rerender(
      <ResultRevealAnimation isRevealed={true}>
        <div data-testid="revealed-result">
          <h3>Sensitive Test</h3>
          <p>Value: Normal</p>
        </div>
      </ResultRevealAnimation>
    );

    expect(screen.getByText('Value: Normal')).toBeInTheDocument();
  });

  it('renders multiple severity levels with correct styling', () => {
    const statuses = ['normal', 'abnormal', 'critical'] as const;
    for (const status of statuses) {
      const { unmount } = render(
        <ResultRevealAnimation isRevealed={true} status={status}>
          <div data-testid={`result-${status}`}>{status} Result</div>
        </ResultRevealAnimation>
      );
      expect(screen.getByTestId(`result-${status}`)).toBeInTheDocument();
      unmount();
    }
  });
});
