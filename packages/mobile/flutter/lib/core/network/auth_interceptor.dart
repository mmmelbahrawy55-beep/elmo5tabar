import 'package:dio/dio.dart';
import '../services/secure_storage_service.dart';

class AuthInterceptor extends Interceptor {
  final SecureStorageService _secureStorage;
  final Dio _dio;

  bool _isRefreshing = false;
  final _pendingRequests = <({RequestOptions options, ErrorInterceptorHandler handler})>[];

  AuthInterceptor(this._secureStorage, this._dio);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    options.headers['Accept'] = 'application/json';
    options.headers['Content-Type'] = 'application/json';
    options.headers['Accept-Language'] = 'ar';
    handler.next(options);
  }

  @override
  void onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      if (!_isRefreshing) {
        _isRefreshing = true;
        try {
          final refreshed = await _refreshToken();
          if (refreshed) {
            _isRefreshing = false;
            _retryPendingRequests();
            final retryResponse = await _retry(err.requestOptions);
            handler.resolve(retryResponse);
            return;
          }
        } catch (e) {
          _isRefreshing = false;
          _pendingRequests.clear();
        }
      } else {
        _pendingRequests.add((options: err.requestOptions, handler: handler));
        return;
      }
    }
    handler.next(err);
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _secureStorage.getRefreshToken();
      if (refreshToken == null) return false;
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      if (response.statusCode == 200) {
        final token = response.data['accessToken'] as String;
        final newRefresh = response.data['refreshToken'] as String;
        await _secureStorage.saveAccessToken(token);
        await _secureStorage.saveRefreshToken(newRefresh);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  void _retryPendingRequests() {
    final pending = List<({RequestOptions options, ErrorInterceptorHandler handler})>.from(_pendingRequests);
    _pendingRequests.clear();
    for (final request in pending) {
      _retry(request.options).then(
        (response) => request.handler.resolve(response),
        onError: (error) => request.handler.reject(error as DioException),
      );
    }
  }

  Future<Response> _retry(RequestOptions requestOptions) async {
    final token = await _secureStorage.getAccessToken();
    final options = Options(
      method: requestOptions.method,
      headers: {
        ...requestOptions.headers,
        'Authorization': 'Bearer $token',
      },
    );
    return _dio.request(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }
}
