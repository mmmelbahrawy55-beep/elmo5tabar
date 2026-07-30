import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';

final localStorageServiceProvider = Provider<LocalStorageService>(
  (ref) => LocalStorageService(),
);

class LocalStorageService {
  static const String userProfileBox = 'user_profile';
  static const String themeBox = 'theme';
  static const String localeBox = 'locale';
  static const String offlineQueueBox = 'offline_queue';
  static const String notificationsCacheBox = 'notifications_cache';

  Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(userProfileBox);
    await Hive.openBox(themeBox);
    await Hive.openBox(localeBox);
    await Hive.openBox(offlineQueueBox);
    await Hive.openBox(notificationsCacheBox);
  }

  Box _box(String boxName) => Hive.box(boxName);

  Future<void> put(String boxName, String key, dynamic value) async {
    await _box(boxName).put(key, value);
  }

  dynamic get(String boxName, String key) {
    return _box(boxName).get(key);
  }

  Future<void> delete(String boxName, String key) async {
    await _box(boxName).delete(key);
  }

  Future<void> clearBox(String boxName) async {
    await _box(boxName).clear();
  }

  Future<void> clearAll() async {
    await clearBox(userProfileBox);
    await clearBox(themeBox);
    await clearBox(localeBox);
    await clearBox(offlineQueueBox);
    await clearBox(notificationsCacheBox);
  }

  Future<void> cacheUserProfile(Map<String, dynamic> profile) async {
    await put(userProfileBox, 'profile', profile);
  }

  Map<String, dynamic>? getCachedUserProfile() {
    return get(userProfileBox, 'profile') as Map<String, dynamic>?;
  }

  Future<void> cacheNotifications(List<Map<String, dynamic>> notifications) async {
    await put(notificationsCacheBox, 'notifications', notifications);
  }

  List<Map<String, dynamic>>? getCachedNotifications() {
    final data = get(notificationsCacheBox, 'notifications');
    if (data is List) {
      return data.cast<Map<String, dynamic>>();
    }
    return null;
  }
}
