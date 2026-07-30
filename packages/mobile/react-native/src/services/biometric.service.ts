import ReactNativeBiometrics from 'react-native-biometrics';
import { secureStorageService } from './secure-storage.service';
import { storage, StorageKeys } from './storage.service';

export type BiometryType = 'FaceID' | 'TouchID' | 'Fingerprint' | 'Biometrics' | null;

class BiometricService {
  private rnBiometrics: ReactNativeBiometrics;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      deviceAlias: 'AlMokhtabar',
    });
  }

  async isAvailable(): Promise<{ available: boolean; biometryType: BiometryType }> {
    try {
      const result = await this.rnBiometrics.isSensorAvailable();
      return {
        available: result.available,
        biometryType: result.biometryType as BiometryType,
      };
    } catch {
      return { available: false, biometryType: null };
    }
  }

  async authenticate(reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.rnBiometrics.simplePrompt({
        promptMessage: reason || 'Authenticate to continue',
        cancelButtonText: 'Cancel',
      });
      return { success: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Biometric authentication failed',
      };
    }
  }

  async createKeys(): Promise<{ publicKey: string } | null> {
    try {
      const result = await this.rnBiometrics.createKeys();
      if (result.publicKey) {
        return { publicKey: result.publicKey };
      }
      return null;
    } catch {
      return null;
    }
  }

  async generateSignature(payload: string): Promise<{ signature: string } | null> {
    try {
      const result = await this.rnBiometrics.createSignature({
        promptMessage: 'Sign in to your account',
        payload,
      });
      if (result.signature) {
        return { signature: result.signature };
      }
      return null;
    } catch {
      return null;
    }
  }

  async saveCredentials(username: string, password: string): Promise<void> {
    await secureStorageService.setBiometricCredentials(username, password);
    storage.setBoolean(StorageKeys.BIOMETRIC_ENABLED, true);
    storage.setString(StorageKeys.BIOMETRIC_USERNAME, username);
  }

  async getCredentials(): Promise<{ username: string; password: string } | null> {
    const biometricEnabled = storage.getBoolean(StorageKeys.BIOMETRIC_ENABLED);
    if (!biometricEnabled) return null;

    const auth = await this.authenticate('Login with biometrics');
    if (!auth.success) return null;

    return secureStorageService.getBiometricCredentials();
  }

  async deleteCredentials(): Promise<void> {
    await secureStorageService.clearTokens();
    storage.delete(StorageKeys.BIOMETRIC_ENABLED);
    storage.delete(StorageKeys.BIOMETRIC_USERNAME);
  }

  hasStoredCredentials(): boolean {
    return storage.getBoolean(StorageKeys.BIOMETRIC_ENABLED) === true;
  }
}

export const biometricService = new BiometricService();
