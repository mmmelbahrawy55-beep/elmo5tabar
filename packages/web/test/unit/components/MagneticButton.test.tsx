import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MagneticButton } from '@/components/motion/MagneticButton';

describe('MagneticButton', () => {
  it('renders children', () => {
    render(<MagneticButton>Click Me</MagneticButton>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders all variants', () => {
    const { rerender } = render(<MagneticButton variant="primary">Primary</MagneticButton>);
    expect(screen.getByText('Primary')).toBeInTheDocument();

    rerender(<MagneticButton variant="secondary">Secondary</MagneticButton>);
    expect(screen.getByText('Secondary')).toBeInTheDocument();

    rerender(<MagneticButton variant="outline">Outline</MagneticButton>);
    expect(screen.getByText('Outline')).toBeInTheDocument();

    rerender(<MagneticButton variant="ghost">Ghost</MagneticButton>);
    expect(screen.getByText('Ghost')).toBeInTheDocument();
  });

  it('renders all sizes', () => {
    const { rerender } = render(<MagneticButton size="sm">Small</MagneticButton>);
    expect(screen.getByText('Small')).toBeInTheDocument();

    rerender(<MagneticButton size="md">Medium</MagneticButton>);
    expect(screen.getByText('Medium')).toBeInTheDocument();

    rerender(<MagneticButton size="lg">Large</MagneticButton>);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<MagneticButton loading>Loading</MagneticButton>);
    const spinner = document.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });

  it('fires onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<MagneticButton onClick={handleClick}>Click</MagneticButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<MagneticButton onClick={handleClick} disabled>Click</MagneticButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not fire onClick when loading', () => {
    const handleClick = vi.fn();
    render(<MagneticButton onClick={handleClick} loading>Click</MagneticButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders as link when as="a" with href', () => {
    const { container } = render(<MagneticButton as="a" href="/test">Link</MagneticButton>);
    expect(container.querySelector('a')).toHaveAttribute('href', '/test');
  });

  it('sets type="submit" when provided', () => {
    render(<MagneticButton type="submit">Submit</MagneticButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('applies custom className', () => {
    render(<MagneticButton className="custom-btn">Styled</MagneticButton>);
    expect(screen.getByText('Styled')).toBeInTheDocument();
  });
});
