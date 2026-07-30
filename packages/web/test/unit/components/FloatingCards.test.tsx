import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FloatingCards } from '@/components/motion/FloatingCards';
import type { ReactNode } from 'react';

const mockCards = [
  { id: '1', content: 'Card 1' as ReactNode, icon: <span data-testid="icon-1">🔬</span> },
  { id: '2', content: 'Card 2' as ReactNode },
  { id: '3', content: 'Card 3' as ReactNode, color: '#FF0000' },
];

describe('FloatingCards', () => {
  it('renders all cards', () => {
    render(<FloatingCards cards={mockCards} />);
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    expect(screen.getByText('Card 3')).toBeInTheDocument();
  });

  it('renders grid layout by default', () => {
    const { container } = render(<FloatingCards cards={mockCards} />);
    const grid = container.querySelector('[class*="grid"]');
    expect(grid).toBeInTheDocument();
  });

  it('renders stack layout', () => {
    const { container } = render(<FloatingCards cards={mockCards} layout="stack" />);
    const stack = container.querySelector('[class*="flex-col"]');
    expect(stack).toBeInTheDocument();
  });

  it('renders carousel layout', () => {
    const { container } = render(<FloatingCards cards={mockCards} layout="carousel" />);
    const carousel = container.querySelector('[class*="overflow-x-auto"]');
    expect(carousel).toBeInTheDocument();
  });

  it('renders with subtle intensity', () => {
    render(<FloatingCards cards={mockCards} floatingIntensity="subtle" />);
    expect(screen.getByText('Card 1')).toBeInTheDocument();
  });

  it('renders with strong intensity', () => {
    render(<FloatingCards cards={mockCards} floatingIntensity="strong" />);
    expect(screen.getByText('Card 1')).toBeInTheDocument();
  });

  it('renders icons when provided', () => {
    render(<FloatingCards cards={mockCards} />);
    expect(screen.getByTestId('icon-1')).toBeInTheDocument();
  });

  it('handles empty cards array', () => {
    const { container } = render(<FloatingCards cards={[]} />);
    expect(container.querySelector('[class*="grid"]')).toBeInTheDocument();
  });

  it('handles single card', () => {
    render(<FloatingCards cards={[{ id: '1', content: 'Solo' }]} />);
    expect(screen.getByText('Solo')).toBeInTheDocument();
  });
});
