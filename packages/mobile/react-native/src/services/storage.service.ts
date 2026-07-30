import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'al-mokhtabar-storage',
});

export class StorageService {
  private store: MMKV;

  constructor(store: MMKV) {
    this.store = store;
  }

  getString(key: string): string | undefined {
    return this.store.getString(key);
  }

  setString(key: string, value: string): void {
    this.store.set(key, value);
  }

  getObject<T = unknown>(key: string): T | undefined {
    const json = this.store.getString(key);
    if (!json) return undefined;
    try {
      return JSON.parse(json) as T;
    } catch {
      return undefined;
    }
  }

  setObject(key: string, value: unknown): void {
    this.store.set(key, JSON.stringify(value));
  }

  getBoolean(key: string): boolean | undefined {
    return this.store.getBoolean(key);
  }

  setBoolean(key: string, value: boolean): void {
    this.store.set(key, value);
  }

  getNumber(key: string): number | undefined {
    return this.store.getNumber(key);
  }

  setNumber(key: string, value: number): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clearAll(): void {
    this.store.clearAll();
  }

  contains(key: string): boolean {
    return this.store.contains(key);
  }

  getAllKeys(): string[] {
    return this.store.getAllKeys();
  }
}

export const storageService = new StorageService(storage);

export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
  THEME_DARK: 'theme_dark',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  BIOMETRIC_USERNAME: 'biometric_username',
  LAST_SYNC: 'last_sync',
  OFFLINE_QUEUE: 'offline_queue',
  PENDING_ACTIONS: 'pending_actions',
  NOTIFICATION_TOKEN: 'notification_token',
  SELECTED_BRANCH: 'selected_branch',
  CART_ITEMS: 'cart_items',
  DRAFT_APPOINTMENT: 'draft_appointment',
  RECENT_SEARCHES: 'recent_searches',
  AI_CONVERSATIONS: 'ai_conversations',
  MEDICINE_REMINDERS: 'medicine_reminders',
  CACHED_RESULTS: 'cached_results',
  CACHED_BRANCHES: 'cached_branches',
} as const;
