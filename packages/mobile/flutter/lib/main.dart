import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'core/localization/app_localizations.dart';
import 'core/localization/locale_provider.dart';
import 'core/services/local_storage_service.dart';
import 'routes/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  final storage = LocalStorageService();
  await storage.init();
  runApp(
    ProviderScope(
      overrides: [
        localStorageServiceProvider.overrideWithValue(storage),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends ConsumerStatefulWidget {
  const MyApp({super.key});

  @override
  ConsumerState<MyApp> createState() => _MyAppState();
}

class _MyAppState extends ConsumerState<MyApp> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(themeModeProvider.notifier).loadPreference();
      ref.read(localeProvider.notifier).loadLocale();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(themeDataProvider);
    final locale = ref.watch(localeProvider);
    final router = ref.watch(routerProvider);

    AppLocalizations.setLocale(locale);

    return MaterialApp.router(
      title: AppLocalizations.t('common.app_name'),
      theme: theme,
      locale: Locale(locale),
      supportedLocales: const [
        Locale('ar'),
        Locale('en'),
      ],
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
