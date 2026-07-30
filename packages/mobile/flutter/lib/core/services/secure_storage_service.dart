import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageServiceProvider = Provider<SecureStorageService>(
  (ref) => SecureStorageService(),
);

class SecureStorageService {
  final FlutterSecureStorage _storage;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _biometricUsernameKey = 'biometric_username';
  static const _biometricPasswordKey = 'biometric_password';
  static const _biometricEnabledKey = 'biometric_enabled';
  static const _userDataKey = 'user_data';

  SecureStorageService()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
        );

  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _accessTokenKey, value: token);
  }

  Future<String?> getAccessToken() async {
    return _storage.read(key: _accessTokenKey);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return _storage.read(key: _refreshTokenKey);
  }

  Future<void> saveUserData(String userData) async {
    await _storage.write(key: _userDataKey, value: userData);
  }

  Future<String?> getUserData() async {
    return _storage.read(key: _userDataKey);
  }

  Future<void> saveBiometricCredentials({
    required String username,
    required String password,
  }) async {
    await _storage.write(key: _biometricUsernameKey, value: username);
    await _storage.write(key: _biometricPasswordKey, value: password);
  }

  Future<({String? username, String? password})?> getBiometricCredentials() async {
    final username = await _storage.read(key: _biometricUsernameKey);
    final password = await _storage.read(key: _biometricPasswordKey);
    if (username == null || password == null) return null;
    return (username: username, password: password);
  }

  Future<void> deleteBiometricCredentials() async {
    await _storage.delete(key: _biometricUsernameKey);
    await _storage.delete(key: _biometricPasswordKey);
  }

  Future<void> setBiometricEnabled(bool enabled) async {
    await _storage.write(
      key: _biometricEnabledKey,
      value: enabled.toString(),
    );
  }

  Future<bool> isBiometricEnabled() async {
    final value = await _storage.read(key: _biometricEnabledKey);
    return value == 'true';
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
