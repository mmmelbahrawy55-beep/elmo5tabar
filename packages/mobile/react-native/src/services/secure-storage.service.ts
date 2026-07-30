import { useKeychain } from '../utils/keychain';
import { Platform } from 'react-native';

const SERVICE_NAME = 'AlMokhtabar';
const AUTH_CREDENTIALS = 'auth_credentials';
const BIOMETRIC_CREDENTIALS = 'biometric_credentials';

class SecureStorageService {
  private keychain = useKeychain();

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.keychain.set(
      AUTH_CREDENTIALS,
      JSON.stringify({ accessToken, refreshToken }),
      {
        service: SERVICE_NAME,
        accessControl: Platform.OS === 'ios' ? 'kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly' : undefined,
        accessible: Platform.OS === 'android' ? 'AccessibleWhenUnlockedThisDeviceOnly' : undefined,
      },
    );
  }

  async getTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const credentials = await this.keychain.get(AUTH_CREDENTIALS, { service: SERVICE_NAME });
      if (credentials) {
        return JSON.parse(credentials.password);
      }
      return null;
    } catch {
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    await this.keychain.remove(AUTH_CREDENTIALS, { service: SERVICE_NAME });
  }

  async setBiometricCredentials(username: string, password: string): Promise<void> {
    await this.keychain.set(
      BIOMETRIC_CREDENTIALS,
      JSON.stringify({ username, password }),
      {
        service: SERVICE_NAME,
        accessControl: Platform.OS === 'ios' ? 'kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly' : undefined,
        accessible: Platform.OS === 'android' ? 'AccessibleWhenUnlockedThisDeviceOnly' : undefined,
        authenticationType: 'biometryAny',
      },
    );
  }

  async getBiometricCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const credentials = await this.keychain.get(BIOMETRIC_CREDENTIALS, { service: SERVICE_NAME });
      if (credentials) {
        return JSON.parse(credentials.password);
      }
      return null;
    } catch {
      return null;
    }
  }

  async hasTokens(): Promise<boolean> {
    const tokens = await this.getTokens();
    return tokens !== null && !!tokens.accessToken;
  }
}

export const secureStorageService = new SecureStorageService();
