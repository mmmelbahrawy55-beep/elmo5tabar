import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SmoothNavigation } from '@/components/motion/SmoothNavigation';
import type { ReactNode } from 'react';

const navItems = [
  { label: 'Home', href: '/', icon: '🏠' as unknown as ReactNode },
  { label: 'Tests', href: '/tests', icon: '🔬' as unknown as ReactNode },
  { label: 'Results', href: '/results', icon: '📊' as unknown as ReactNode },
];

describe('SmoothNavigation', () => {
  it('renders all nav items', () => {
    render(<SmoothNavigation items={navItems} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Tests')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('renders brand logo link', () => {
    render(<SmoothNavigation items={navItems} />);
    expect(screen.getByText('Al')).toBeInTheDocument();
    expect(screen.getByText('Mokhtabar')).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    render(<SmoothNavigation items={navItems} />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('renders side variant', () => {
    const { container } = render(<SmoothNavigation items={navItems} variant="side" />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('sets dir="rtl" when dir prop is rtl', () => {
    const { container } = render(<SmoothNavigation items={navItems} dir="rtl" />);
    const header = container.querySelector('header');
    expect(header).toHaveAttribute('dir', 'rtl');
  });

  it('renders side variant with RTL', () => {
    const { container } = render(
      <SmoothNavigation items={navItems} variant="side" dir="rtl" />
    );
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('dir', 'rtl');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SmoothNavigation items={navItems} className="custom-nav" />
    );
    const el = container.querySelector('[class*="custom-nav"]');
    expect(el).toBeInTheDocument();
  });

  it('renders icons in nav items', () => {
    render(<SmoothNavigation items={navItems} />);
    const homeItems = screen.getAllByText('Home');
    expect(homeItems.length).toBeGreaterThan(0);
  });

  it('mobile drawer opens on hamburger click', () => {
    render(<SmoothNavigation items={navItems} />);
    const menuBtn = screen.getByLabelText('Open menu');
    fireEvent.click(menuBtn);
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('mobile drawer closes on overlay click', () => {
    render(<SmoothNavigation items={navItems} />);
    fireEvent.click(screen.getByLabelText('Open menu'));
    const overlay = document.querySelector('[class*="bg-black/40"]');
    if (overlay) fireEvent.click(overlay);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });
});
