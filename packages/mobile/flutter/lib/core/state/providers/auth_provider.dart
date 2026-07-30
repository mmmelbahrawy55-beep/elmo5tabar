import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:convert';
import '../../models/user.dart';
import '../../network/api_client.dart';
import '../../network/api_endpoints.dart';
import '../../services/secure_storage_service.dart';
import '../../services/biometric_service.dart';

enum AuthStatus { initial, authenticated, unauthenticated, loading }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;
  final bool isBiometricAvailable;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.error,
    this.isBiometricAvailable = false,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
    bool? isBiometricAvailable,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
      isBiometricAvailable: isBiometricAvailable ?? this.isBiometricAvailable,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;
  final SecureStorageService _secureStorage;
  final BiometricService _biometricService;

  AuthNotifier(this._apiClient, this._secureStorage, this._biometricService)
      : super(const AuthState());

  Future<void> init() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final token = await _secureStorage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        final response = await _apiClient.get(ApiEndpoints.profile);
        final user = User.fromJson(response.data['data'] as Map<String, dynamic>);
        final biometricAvailable = await _biometricService.canAuthenticate();
        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
          isBiometricAvailable: biometricAvailable,
        );
      } else {
        final biometricAvailable = await _biometricService.canAuthenticate();
        state = AuthState(
          status: AuthStatus.unauthenticated,
          isBiometricAvailable: biometricAvailable,
        );
      }
    } catch (e) {
      await _secureStorage.clearTokens();
      final biometricAvailable = await _biometricService.canAuthenticate();
      state = AuthState(
        status: AuthStatus.unauthenticated,
        isBiometricAvailable: biometricAvailable,
      );
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      final response = await _apiClient.post(
        ApiEndpoints.login,
        data: {
          'email': email,
          'password': password,
        },
      );
      final data = response.data['data'] as Map<String, dynamic>;
      final token = data['accessToken'] as String;
      final refreshToken = data['refreshToken'] as String;
      await _secureStorage.saveAccessToken(token);
      await _secureStorage.saveRefreshToken(refreshToken);
      final user = User.fromJson(data['user'] as Map<String, dynamic>);
      state = AuthState(
        status: AuthStatus.authenticated,
        user: user,
        isBiometricAvailable: state.isBiometricAvailable,
      );
    } catch (e) {
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: 'auth.invalid_credentials',
        isBiometricAvailable: state.isBiometricAvailable,
      );
    }
  }

  Future<void> register({
    required String nameAr,
    required String nameEn,
    required String email,
    required String phone,
    required String password,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      final response = await _apiClient.post(
        ApiEndpoints.register,
        data: {
          'name_ar': nameAr,
          'name_en': nameEn,
          'email': email,
          'phone': phone,
          'password': password,
        },
      );
      final data = response.data['data'] as Map<String, dynamic>;
      final token = data['accessToken'] as String;
      final refreshToken = data['refreshToken'] as String;
      await _secureStorage.saveAccessToken(token);
      await _secureStorage.saveRefreshToken(refreshToken);
      final user = User.fromJson(data['user'] as Map<String, dynamic>);
      state = AuthState(
        status: AuthStatus.authenticated,
        user: user,
        isBiometricAvailable: state.isBiometricAvailable,
      );
    } catch (e) {
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: 'auth.register_failed',
        isBiometricAvailable: state.isBiometricAvailable,
      );
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(ApiEndpoints.logout);
    } catch (e) {}
    await _secureStorage.clearTokens();
    state = AuthState(
      status: AuthStatus.unauthenticated,
      isBiometricAvailable: state.isBiometricAvailable,
    );
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.put(
        ApiEndpoints.updateProfile,
        data: data,
      );
      final user = User.fromJson(response.data['data'] as Map<String, dynamic>);
      state = state.copyWith(user: user);
    } catch (e) {
      state = state.copyWith(error: 'common.something_wrong');
    }
  }

  Future<String?> biometricLogin() async {
    final credentials = await _biometricService.getCredentials();
    if (credentials == null) return 'biometric_not_setup';
    final authenticated = await _biometricService.authenticate(
      reason: 'auth.use_biometric',
    );
    if (!authenticated) return 'biometric_failed';
    await login(
      email: credentials.username,
      password: credentials.password,
    );
    return null;
  }

  Future<bool> enableBiometric({
    required String email,
    required String password,
  }) async {
    return _biometricService.saveCredentials(
      username: email,
      password: password,
    );
  }

  Future<void> disableBiometric() async {
    await _biometricService.deleteCredentials();
  }

  Future<void> forgotPassword(String email) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      await _apiClient.post(ApiEndpoints.forgotPassword, data: {'email': email});
      state = state.copyWith(status: AuthStatus.unauthenticated);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: 'common.something_wrong',
      );
    }
  }

  Future<void> resetPassword({
    required String email,
    required String otp,
    required String password,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      await _apiClient.post(ApiEndpoints.resetPassword, data: {
        'email': email,
        'otp': otp,
        'password': password,
      });
      state = state.copyWith(status: AuthStatus.unauthenticated);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: 'common.something_wrong',
      );
    }
  }
}

final authProvider =
    StateNotifierProvider.autoDispose<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final secureStorage = ref.watch(secureStorageServiceProvider);
  final biometricService = ref.watch(biometricServiceProvider);
  return AuthNotifier(apiClient, secureStorage, biometricService);
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});
