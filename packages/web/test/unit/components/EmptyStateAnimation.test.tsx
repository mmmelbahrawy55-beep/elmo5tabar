import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyStateAnimation } from '@/components/motion/EmptyStateAnimation';

describe('EmptyStateAnimation', () => {
  it('renders title', () => {
    render(<EmptyStateAnimation title="No Results" description="No results found" />);
    expect(screen.getByText('No Results')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EmptyStateAnimation title="No Results" description="No results found" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders with default variant icon', () => {
    const { container } = render(<EmptyStateAnimation title="Empty" description="Nothing here" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with search variant icon', () => {
    const { container } = render(
      <EmptyStateAnimation title="Search" description="No results" variant="search" />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with error variant icon', () => {
    render(
      <EmptyStateAnimation title="Error" description="Something went wrong" variant="error" />
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders with success variant icon', () => {
    render(
      <EmptyStateAnimation title="Success" description="All good" variant="success" />
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(
      <EmptyStateAnimation
        title="Custom"
        description="With icon"
        icon={<span data-testid="custom-icon">🔬</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders CTA button and fires onClick', () => {
    const handleClick = vi.fn();
    render(
      <EmptyStateAnimation
        title="Empty"
        description="Click to add"
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );
    const btn = screen.getByText('Add Item');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render CTA button when no action provided', () => {
    render(<EmptyStateAnimation title="Empty" description="Nothing" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('animates icon with floating effect', () => {
    const { container } = render(<EmptyStateAnimation title="Test" description="Desc" />);
    const iconWrapper = container.querySelector('[class*="flex"]');
    expect(iconWrapper).toBeInTheDocument();
  });
});
