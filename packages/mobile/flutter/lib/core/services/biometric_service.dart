import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import 'secure_storage_service.dart';

final biometricServiceProvider = Provider<BiometricService>(
  (ref) => BiometricService(ref.watch(secureStorageServiceProvider)),
);

class BiometricService {
  final LocalAuthentication _localAuth;
  final SecureStorageService _secureStorage;

  BiometricService(this._secureStorage)
      : _localAuth = LocalAuthentication();

  Future<bool> canAuthenticate() async {
    try {
      final available = await _localAuth.canCheckBiometrics;
      if (!available) return false;
      final enrolled = await _localAuth.isDeviceSupported();
      return enrolled;
    } catch (e) {
      return false;
    }
  }

  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _localAuth.getAvailableBiometrics();
    } catch (e) {
      return [];
    }
  }

  Future<bool> authenticate({
    required String reason,
    bool stickyAuth = true,
  }) async {
    try {
      return await _localAuth.authenticate(
        localizedReason: reason,
        options: AuthenticationOptions(
          stickyAuth: stickyAuth,
          biometricOnly: true,
        ),
      );
    } catch (e) {
      return false;
    }
  }

  Future<bool> saveCredentials({
    required String username,
    required String password,
  }) async {
    try {
      await _secureStorage.saveBiometricCredentials(
        username: username,
        password: password,
      );
      await _secureStorage.setBiometricEnabled(true);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<({String? username, String? password})?> getCredentials() async {
    return _secureStorage.getBiometricCredentials();
  }

  Future<void> deleteCredentials() async {
    await _secureStorage.deleteBiometricCredentials();
    await _secureStorage.setBiometricEnabled(false);
  }

  Future<bool> isBiometricEnabled() async {
    return _secureStorage.isBiometricEnabled();
  }
}
