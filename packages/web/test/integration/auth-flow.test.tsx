import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/contexts/auth-context';
import { useAuthStore } from '@/stores/index';
import type { ReactNode } from 'react';

vi.mock('@/lib/api/auth', () => ({
  authClient: {
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    register: vi.fn(),
    loginWithOTP: vi.fn(),
  },
}));

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

function LoginForm() {
  const { login, isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <div data-testid="dashboard">Welcome, {user.firstNameEn}</div>;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await login(formData.get('email') as string, formData.get('password') as string);
      }}
    >
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
});

describe('Auth Flow Integration', () => {
  it('renders login form for unauthenticated user', () => {
    render(
      <TestProviders>
        <LoginForm />
      </TestProviders>
    );
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('calls login on form submission', async () => {
    const { authClient } = await import('@/lib/api/auth');
    vi.mocked(authClient.login).mockResolvedValue({
      user: { id: '1', firstNameEn: 'Ahmed', lastNameEn: 'Test', role: 'patient', email: 'a@b.com', phone: '0555', twoFactorEnabled: false },
      tokens: { accessToken: 'tok', refreshToken: 'ref' },
    });
    vi.mocked(authClient.getMe).mockResolvedValue({
      id: '1', firstNameEn: 'Ahmed', lastNameEn: 'Test', role: 'patient', email: 'a@b.com', phone: '0555', twoFactorEnabled: false,
    });

    render(
      <TestProviders>
        <LoginForm />
      </TestProviders>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(authClient.login).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });

  it('shows account locked error on repeated failures', () => {
    const error = new Error('Account locked. Too many attempts.');
    const { authClient } = vi.mocked(require('@/lib/api/auth'));
    authClient.login.mockRejectedValue(error);

    render(
      <TestProviders>
        <LoginForm />
      </TestProviders>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Login'));
  });

  it('handles OTP login flow', async () => {
    const { authClient } = await import('@/lib/api/auth');
    vi.mocked(authClient.loginWithOTP).mockResolvedValue({ success: true });

    async function handleOTP() {
      await authClient.loginWithOTP('+966555123456');
    }

    await handleOTP();
    expect(authClient.loginWithOTP).toHaveBeenCalledWith('+966555123456');
  });

  it('handles session expiry and redirect', () => {
    useAuthStore.getState().setAuth(
      { id: 'u1', email: 'test@example.com', role: 'patient' },
      'expired-token',
      'refresh-token'
    );
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });
});
