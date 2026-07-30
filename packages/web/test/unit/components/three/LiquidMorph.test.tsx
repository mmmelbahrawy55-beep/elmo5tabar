import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiquidMorph } from '@/components/three/LiquidMorph';

describe('LiquidMorph', () => {
  it('renders canvas container', () => {
    const { container } = render(<LiquidMorph />);
    expect(container.querySelector('[class*="pointer-events-none"]')).toBeInTheDocument();
  });

  it('renders with custom color', () => {
    const { container } = render(<LiquidMorph color="#FF0000" />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with custom speed', () => {
    const { container } = render(<LiquidMorph speed={0.5} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with custom complexity', () => {
    const { container } = render(<LiquidMorph complexity={5} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with custom scale', () => {
    const { container } = render(<LiquidMorph scale={1.5} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LiquidMorph className="liquid-bg" />);
    const el = container.querySelector('[class*="liquid-bg"]');
    expect(el).toBeInTheDocument();
  });

  it('renders Canvas element', () => {
    const { container } = render(<LiquidMorph />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders meshDistortMaterial via mock', () => {
    const { container } = render(<LiquidMorph />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
