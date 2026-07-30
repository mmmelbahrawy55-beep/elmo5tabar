import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LottieLoadingScreen } from '@/components/perf/LottieLoadingScreen';

vi.mock('lottie-react', () => ({
  default: ({ path }: { path: string }) => <div data-testid="mock-lottie" data-path={path} />,
}));

describe('LottieLoadingScreen', () => {
  it('renders with default message', () => {
    render(<LottieLoadingScreen isLoading={true} />);
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
  });

  it('renders submessage', () => {
    render(<LottieLoadingScreen isLoading={true} />);
    expect(screen.getByText('Al Mokhtabar Laboratory')).toBeInTheDocument();
  });

  it('renders Lottie animation by default', () => {
    render(<LottieLoadingScreen isLoading={true} />);
    expect(screen.getByTestId('mock-lottie')).toBeInTheDocument();
  });

  it('passes custom src path to Lottie', () => {
    render(<LottieLoadingScreen isLoading={true} src="/custom/animation.json" />);
    const lottie = screen.getByTestId('mock-lottie');
    expect(lottie).toHaveAttribute('data-path', '/custom/animation.json');
  });

  it('renders fallback spinner when hasError is triggered', () => {
    render(<LottieLoadingScreen isLoading={true} src="/invalid/path.json" />);
    expect(screen.getByTestId('mock-lottie')).toBeInTheDocument();
  });

  it('renders progress bar with percentage', () => {
    render(<LottieLoadingScreen isLoading={true} progress={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('returns null when isLoading is false', () => {
    const { container } = render(<LottieLoadingScreen isLoading={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders custom message', () => {
    render(<LottieLoadingScreen isLoading={true} message="Custom Message" />);
    expect(screen.getByText('Custom Message')).toBeInTheDocument();
  });

  it('renders custom submessage', () => {
    render(<LottieLoadingScreen isLoading={true} submessage="Custom Sub" />);
    expect(screen.getByText('Custom Sub')).toBeInTheDocument();
  });
});
