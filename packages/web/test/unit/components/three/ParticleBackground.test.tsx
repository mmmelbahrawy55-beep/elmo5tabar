import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ParticleBackground } from '@/components/three/ParticleBackground';

describe('ParticleBackground', () => {
  it('renders canvas container', () => {
    const { container } = render(<ParticleBackground />);
    expect(container.querySelector('[class*="pointer-events-none"]')).toBeInTheDocument();
  });

  it('renders with custom particle count', () => {
    const { container } = render(<ParticleBackground count={1000} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with custom color', () => {
    const { container } = render(<ParticleBackground color="#FF0000" />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    const { container } = render(<ParticleBackground size={3} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with custom speed', () => {
    const { container } = render(<ParticleBackground speed={1} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with interactive mode enabled', () => {
    const { container } = render(<ParticleBackground interactive={true} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ParticleBackground className="particle-bg" />);
    const el = container.querySelector('[class*="particle-bg"]');
    expect(el).toBeInTheDocument();
  });

  it('renders canvas element via Canvas mock', () => {
    const { container } = render(<ParticleBackground />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
