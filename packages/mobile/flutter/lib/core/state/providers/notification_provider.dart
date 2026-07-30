import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/notification_item.dart';
import '../../network/api_client.dart';
import '../../network/api_endpoints.dart';

final notificationListProvider =
    FutureProvider.autoDispose<List<NotificationItem>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.notifications);
  final list = (response.data['data'] as List<dynamic>)
      .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
      .toList();
  return list;
});

final unreadCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.notifications, queryParameters: {
    'unread_only': true,
    'per_page': 1,
  });
  return response.data['meta']['total'] as int? ?? 0;
});

final markReadProvider =
    FutureProvider.autoDispose.family<void, String>((ref, id) async {
  final api = ref.watch(apiClientProvider);
  await api.post(ApiEndpoints.markNotificationRead.replaceAll('{id}', id));
  ref.invalidate(notificationListProvider);
  ref.invalidate(unreadCountProvider);
});

final markAllReadProvider = FutureProvider.autoDispose<void>((ref) async {
  final api = ref.watch(apiClientProvider);
  await api.post(ApiEndpoints.markAllNotificationsRead);
  ref.invalidate(notificationListProvider);
  ref.invalidate(unreadCountProvider);
});
