import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, useState } from 'vitest';
import {
  MicroButton,
  MicroToggle,
  MicroHeart,
  MicroStar,
  MicroCheckbox,
  MicroProgress,
  MicroBadge,
  MicroChip,
} from '@/components/motion/MicroInteractions';

describe('MicroButton', () => {
  it('renders children', () => {
    render(<MicroButton>Click</MicroButton>);
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('fires onClick handler', () => {
    const handleClick = vi.fn();
    render(<MicroButton onClick={handleClick}>Click</MicroButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('MicroToggle', () => {
  it('renders with correct aria-checked state', () => {
    render(<MicroToggle checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when clicked', () => {
    const handleChange = vi.fn();
    render(<MicroToggle checked={false} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('renders as checked', () => {
    render(<MicroToggle checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});

describe('MicroHeart', () => {
  it('renders liked state', () => {
    render(<MicroHeart liked={true} onClick={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
  });

  it('renders unliked state', () => {
    render(<MicroHeart liked={false} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('fires onClick', () => {
    const handleClick = vi.fn();
    render(<MicroHeart liked={false} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('MicroStar', () => {
  it('renders rated state', () => {
    render(<MicroStar rated={true} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders unrated state', () => {
    render(<MicroStar rated={false} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('fires onClick', () => {
    const handleClick = vi.fn();
    render(<MicroStar rated={false} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('MicroCheckbox', () => {
  it('renders unchecked state', () => {
    render(<MicroCheckbox checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders checked state', () => {
    render(<MicroCheckbox checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onChange with inverted value', () => {
    const handleChange = vi.fn();
    render(<MicroCheckbox checked={false} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });
});

describe('MicroProgress', () => {
  it('renders with label and percentage', () => {
    render(<MicroProgress value={75} label="Loading" />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('clamps value to 0 minimum', () => {
    render(<MicroProgress value={-10} label="Test" />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('clamps value to 100 maximum', () => {
    render(<MicroProgress value={150} label="Test" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders without label', () => {
    const { container } = render(<MicroProgress value={50} />);
    expect(container.querySelector('.h-2')).toBeInTheDocument();
  });
});

describe('MicroBadge', () => {
  it('renders count', () => {
    render(<MicroBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders 99+ for large counts', () => {
    render(<MicroBadge count={100} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('renders all variants', () => {
    const { rerender } = render(<MicroBadge count={1} variant="info" />);
    expect(screen.getByText('1')).toBeInTheDocument();

    rerender(<MicroBadge count={2} variant="warning" />);
    expect(screen.getByText('2')).toBeInTheDocument();

    rerender(<MicroBadge count={3} variant="danger" />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('MicroChip', () => {
  it('renders label', () => {
    render(<MicroChip label="Test" active={false} onClick={vi.fn()} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders active state', () => {
    render(<MicroChip label="Active" active={true} onClick={vi.fn()} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('fires onClick', () => {
    const handleClick = vi.fn();
    render(<MicroChip label="Click" active={false} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
