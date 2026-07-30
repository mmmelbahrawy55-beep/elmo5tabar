import 'package:dio/dio.dart';
import 'package:hive/hive.dart';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';

class OfflineInterceptor extends Interceptor {
  final Box _queueBox;
  final Connectivity _connectivity;

  OfflineInterceptor(this._queueBox, this._connectivity);

  @override
  void onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final connectivityResult = await _connectivity.checkConnectivity();
    if (connectivityResult.contains(ConnectivityResult.none)) {
      if (_isQueuable(err.requestOptions)) {
        await _queueRequest(err.requestOptions);
        handler.resolve(
          Response(
            requestOptions: err.requestOptions,
            data: {'queued': true, 'message': 'Request queued for offline processing'},
            statusCode: 202,
          ),
        );
        return;
      }
    }
    handler.next(err);
  }

  bool _isQueuable(RequestOptions options) {
    const queuableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    return queuableMethods.contains(options.method.toUpperCase());
  }

  Future<void> _queueRequest(RequestOptions options) async {
    final queueItem = {
      'method': options.method,
      'path': options.path,
      'data': options.data,
      'queryParameters': options.queryParameters,
      'headers': options.headers,
      'timestamp': DateTime.now().toIso8601String(),
    };
    final queue = _getQueue();
    queue.add(jsonEncode(queueItem));
    await _queueBox.put('offline_queue', queue);
  }

  List<String> _getQueue() {
    final stored = _queueBox.get('offline_queue');
    if (stored is List) {
      return stored.cast<String>();
    }
    return [];
  }

  Future<void> processQueue(Dio dio) async {
    final queue = _getQueue();
    if (queue.isEmpty) return;
    final processed = <String>[];
    for (final itemJson in queue) {
      try {
        final item = jsonDecode(itemJson) as Map<String, dynamic>;
        await dio.request(
          item['path'] as String,
          data: item['data'],
          queryParameters: item['queryParameters'] as Map<String, dynamic>?,
          options: Options(
            method: item['method'] as String,
            headers: item['headers'] as Map<String, dynamic>?,
          ),
        );
        processed.add(itemJson);
      } catch (e) {
        break;
      }
    }
    final remaining = queue.where((q) => !processed.contains(q)).toList();
    await _queueBox.put('offline_queue', remaining);
  }

  int get pendingCount => _getQueue().length;
}
