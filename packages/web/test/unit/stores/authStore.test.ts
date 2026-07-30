import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/index';

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  });
});

describe('authStore', () => {
  it('starts with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setAuth sets user and tokens', () => {
    const testUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'patient',
      profile: {
        firstNameAr: 'محمد',
        lastNameAr: 'العلي',
      },
    };

    useAuthStore.getState().setAuth(testUser, 'access-token-123', 'refresh-token-456');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(testUser);
    expect(state.accessToken).toBe('access-token-123');
    expect(state.refreshToken).toBe('refresh-token-456');
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout clears all auth state', () => {
    useAuthStore.getState().setAuth(
      { id: 'user-1', email: 'test@example.com', role: 'patient' },
      'token',
      'refresh'
    );

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updateUser updates user fields partially', () => {
    const initialUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'patient',
      profile: {
        firstNameAr: 'محمد',
        lastNameAr: 'العلي',
      },
    };

    useAuthStore.getState().setAuth(initialUser, 'token', 'refresh');
    useAuthStore.getState().updateUser({ email: 'new@example.com' });

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('new@example.com');
    expect(state.user?.id).toBe('user-1');
  });

  it('updateUser does nothing when user is null', () => {
    useAuthStore.getState().updateUser({ email: 'new@example.com' });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('handles user with full profile', () => {
    const fullUser = {
      id: 'user-2',
      email: 'doctor@example.com',
      role: 'doctor',
      profile: {
        firstNameAr: 'أحمد',
        lastNameAr: 'الزهراني',
        firstNameEn: 'Ahmed',
        lastNameEn: 'Al-Zahrani',
        avatar: '/avatars/doctor.jpg',
      },
    };

    useAuthStore.getState().setAuth(fullUser, 'tok', 'ref');
    expect(useAuthStore.getState().user?.profile?.firstNameEn).toBe('Ahmed');
    expect(useAuthStore.getState().user?.profile?.avatar).toBe('/avatars/doctor.jpg');
  });

  it('persists after multiple updates', () => {
    const user = { id: 'u1', email: 'a@b.com', role: 'patient' };
    useAuthStore.getState().setAuth(user, 't1', 'r1');
    useAuthStore.getState().updateUser({ email: 'c@d.com' });
    useAuthStore.getState().updateUser({ role: 'admin' });

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('c@d.com');
    expect(state.user?.role).toBe('admin');
    expect(state.accessToken).toBe('t1');
  });
});
