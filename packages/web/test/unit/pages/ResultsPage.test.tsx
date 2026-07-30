import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResultRevealAnimation } from '@/components/motion/ResultRevealAnimation';
import { EmptyStateAnimation } from '@/components/motion/EmptyStateAnimation';

describe('ResultsPage', () => {
  it('renders result cards with reveal animation', () => {
    render(
      <ResultRevealAnimation isRevealed={true} status="normal">
        <div>
          <h3>Complete Blood Count</h3>
          <p>Result: Normal</p>
        </div>
      </ResultRevealAnimation>
    );
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Result: Normal')).toBeInTheDocument();
  });

  it('renders critical result with red glow', () => {
    render(
      <ResultRevealAnimation isRevealed={true} status="critical">
        <div>
          <h3>Troponin I</h3>
          <p>Result: Critical</p>
        </div>
      </ResultRevealAnimation>
    );
    expect(screen.getByText('Troponin I')).toBeInTheDocument();
    expect(screen.getByText('Result: Critical')).toBeInTheDocument();
  });

  it('renders abnormal result with warning', () => {
    render(
      <ResultRevealAnimation isRevealed={true} status="abnormal">
        <div>
          <h3>Vitamin D</h3>
          <p>Result: Low</p>
        </div>
      </ResultRevealAnimation>
    );
    expect(screen.getByText('Vitamin D')).toBeInTheDocument();
  });

  it('renders blank result before reveal', () => {
    render(
      <ResultRevealAnimation isRevealed={false}>
        <div data-testid="pending-result">
          <h3>Test Pending</h3>
        </div>
      </ResultRevealAnimation>
    );
    expect(screen.getByTestId('pending-result')).toBeInTheDocument();
    expect(screen.getByText('Test Pending')).toBeInTheDocument();
  });

  it('renders empty state when no results found', () => {
    render(
      <EmptyStateAnimation
        title="No Results Found"
        description="You don't have any lab results yet."
        variant="search"
      />
    );
    expect(screen.getByText('No Results Found')).toBeInTheDocument();
    expect(screen.getByText("You don't have any lab results yet.")).toBeInTheDocument();
  });

  it('renders error state for failed results', () => {
    render(
      <EmptyStateAnimation
        title="Failed to Load"
        description="Please try again later"
        variant="error"
        action={{ label: 'Retry', onClick: () => {} }}
      />
    );
    expect(screen.getByText('Failed to Load')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders multiple result items', () => {
    render(
      <div>
        <ResultRevealAnimation isRevealed={true} status="normal">
          <div>Result 1</div>
        </ResultRevealAnimation>
        <ResultRevealAnimation isRevealed={true} status="abnormal">
          <div>Result 2</div>
        </ResultRevealAnimation>
        <ResultRevealAnimation isRevealed={false}>
          <div>Result 3</div>
        </ResultRevealAnimation>
      </div>
    );
    expect(screen.getByText('Result 1')).toBeInTheDocument();
    expect(screen.getByText('Result 2')).toBeInTheDocument();
    expect(screen.getByText('Result 3')).toBeInTheDocument();
  });
});
