import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlassLoadingScreen } from '@/components/motion/GlassLoadingScreen';

describe('GlassLoadingScreen', () => {
  it('renders with default message', () => {
    render(<GlassLoadingScreen isLoading={true} />);
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
  });

  it('renders submessage', () => {
    render(<GlassLoadingScreen isLoading={true} />);
    expect(screen.getByText('Al Mokhtabar Laboratory')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<GlassLoadingScreen isLoading={true} message="Processing..." />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('renders custom submessage', () => {
    render(<GlassLoadingScreen isLoading={true} submessage="Loading data" />);
    expect(screen.getByText('Loading data')).toBeInTheDocument();
  });

  it('renders determinate variant with progress', () => {
    render(<GlassLoadingScreen isLoading={true} variant="determinate" progress={65} />);
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('renders indeterminate variant with animated dots', () => {
    render(<GlassLoadingScreen isLoading={true} variant="indeterminate" />);
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
  });

  it('returns null when isLoading is false', () => {
    const { container } = render(<GlassLoadingScreen isLoading={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders circular progress in determinate mode', () => {
    const { container } = render(
      <GlassLoadingScreen isLoading={true} variant="determinate" progress={50} />
    );
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
  });

  it('renders animated ring in indeterminate mode', () => {
    const { container } = render(
      <GlassLoadingScreen isLoading={true} variant="indeterminate" />
    );
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });
});
