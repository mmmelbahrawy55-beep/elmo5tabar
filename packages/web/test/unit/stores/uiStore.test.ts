import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore, useNotificationStore, useCartStore } from '@/stores/index';

beforeEach(() => {
  useUIStore.setState({ sidebarOpen: true, theme: 'light', locale: 'ar' });
  useNotificationStore.setState({ count: 0 });
  useCartStore.setState({ items: [] });
});

describe('uiStore', () => {
  it('starts with default UI state', () => {
    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.theme).toBe('light');
    expect(state.locale).toBe('ar');
  });

  it('toggleSidebar flips sidebar state', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('setTheme updates theme', () => {
    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');

    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('setLocale updates locale', () => {
    useUIStore.getState().setLocale('en');
    expect(useUIStore.getState().locale).toBe('en');
  });

  it('persists locale across changes', () => {
    useUIStore.getState().setLocale('en');
    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().locale).toBe('en');
    expect(useUIStore.getState().theme).toBe('dark');
  });
});

describe('notificationStore', () => {
  it('starts with zero count', () => {
    expect(useNotificationStore.getState().count).toBe(0);
  });

  it('setCount updates count', () => {
    useNotificationStore.getState().setCount(5);
    expect(useNotificationStore.getState().count).toBe(5);
  });

  it('decrement reduces count', () => {
    useNotificationStore.getState().setCount(3);
    useNotificationStore.getState().decrement();
    expect(useNotificationStore.getState().count).toBe(2);
  });

  it('decrement does not go below 0', () => {
    useNotificationStore.getState().decrement();
    expect(useNotificationStore.getState().count).toBe(0);
  });
});

describe('cartStore', () => {
  const testItem = {
    testId: 'test-001',
    nameAr: 'تحليل شامل',
    nameEn: 'Comprehensive',
    price: 250,
    code: 'CBC',
  };

  it('starts with empty cart', () => {
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('addItem adds to cart', () => {
    useCartStore.getState().addItem(testItem);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].testId).toBe('test-001');
  });

  it('addItem does not duplicate items', () => {
    useCartStore.getState().addItem(testItem);
    useCartStore.getState().addItem(testItem);
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('removeItem removes from cart', () => {
    useCartStore.getState().addItem(testItem);
    useCartStore.getState().removeItem('test-001');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('clearCart empties cart', () => {
    useCartStore.getState().addItem(testItem);
    useCartStore.getState().addItem({ ...testItem, testId: 'test-002' });
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('getTotal calculates sum of all items', () => {
    useCartStore.getState().addItem(testItem);
    useCartStore.getState().addItem({ ...testItem, testId: 'test-002', price: 150 });
    const total = useCartStore.getState().getTotal();
    expect(total).toBe(400);
  });

  it('getTotal returns 0 for empty cart', () => {
    expect(useCartStore.getState().getTotal()).toBe(0);
  });
});
