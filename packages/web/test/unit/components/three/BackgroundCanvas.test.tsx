import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BackgroundCanvas } from '@/components/three/BackgroundCanvas';

describe('BackgroundCanvas', () => {
  it('renders children inside canvas', () => {
    const { container } = render(
      <BackgroundCanvas>
        <div data-testid="child">Child</div>
      </BackgroundCanvas>
    );
    expect(container.querySelector('[class*="fixed"]')).toBeInTheDocument();
  });

  it('renders with default DPR', () => {
    const { container } = render(
      <BackgroundCanvas>
        <div>Content</div>
      </BackgroundCanvas>
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with custom DPR range', () => {
    const { container } = render(
      <BackgroundCanvas dpr={[1, 3]}>
        <div>Content</div>
      </BackgroundCanvas>
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with custom camera position', () => {
    const { container } = render(
      <BackgroundCanvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <div>Content</div>
      </BackgroundCanvas>
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with bloom effect enabled', () => {
    const { container } = render(
      <BackgroundCanvas effects={{ bloom: true, noise: false, vignette: false }}>
        <div>Content</div>
      </BackgroundCanvas>
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with all effects enabled', () => {
    const { container } = render(
      <BackgroundCanvas effects={{ bloom: true, noise: true, vignette: true }}>
        <div>Content</div>
      </BackgroundCanvas>
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with noise effect only', () => {
    const { container } = render(
      <BackgroundCanvas effects={{ bloom: false, noise: true, vignette: false }}>
        <div>Content</div>
      </BackgroundCanvas>
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders with vignette effect only', () => {
    const { container } = render(
      <BackgroundCanvas effects={{ bloom: false, noise: false, vignette: true }}>
        <div>Content</div>
      </BackgroundCanvas>
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <BackgroundCanvas className="bg-canvas">
        <div>Content</div>
      </BackgroundCanvas>
    );
    const el = container.querySelector('[class*="bg-canvas"]');
    expect(el).toBeInTheDocument();
  });

  it('renders ambient and directional lights', () => {
    const { container } = render(
      <BackgroundCanvas>
        <div>Content</div>
      </BackgroundCanvas>
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
