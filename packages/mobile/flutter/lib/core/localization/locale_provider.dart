import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app_localizations.dart';

class LocaleNotifier extends StateNotifier<String> {
  LocaleNotifier() : super('ar');

  Future<void> loadLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final locale = prefs.getString('locale') ?? 'ar';
    state = locale;
    AppLocalizations.setLocale(locale);
  }

  Future<void> setLocale(String locale) async {
    state = locale;
    AppLocalizations.setLocale(locale);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('locale', locale);
  }

  Future<void> toggleLocale() async {
    final newLocale = state == 'ar' ? 'en' : 'ar';
    await setLocale(newLocale);
  }
}

final localeProvider = StateNotifierProvider<LocaleNotifier, String>(
  (ref) => LocaleNotifier(),
);

final isRtlProvider = Provider<bool>((ref) {
  final locale = ref.watch(localeProvider);
  return locale == 'ar';
});

final textDirectionProvider = Provider<TextDirection>((ref) {
  final isRtl = ref.watch(isRtlProvider);
  return isRtl ? TextDirection.rtl : TextDirection.ltr;
});
