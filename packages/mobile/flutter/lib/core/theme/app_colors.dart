import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const MaterialColor primary = MaterialColor(0xFF0066A1, {
    50: Color(0xFFE1F0F8),
    100: Color(0xFFB3D9EE),
    200: Color(0xFF80BFE3),
    300: Color(0xFF4DA5D8),
    400: Color(0xFF2691CF),
    500: Color(0xFF0066A1),
    600: Color(0xFF005E93),
    700: Color(0xFF005383),
    800: Color(0xFF004973),
    900: Color(0xFF003758),
  });

  static const Color primaryLight = Color(0xFF4DA5D8);
  static const Color primaryDark = Color(0xFF003758);

  static const Color secondary = Color(0xFF00BFA5);
  static const Color secondaryLight = Color(0xFF5DF2D6);
  static const Color secondaryDark = Color(0xFF008E76);

  static const Color success = Color(0xFF2E7D32);
  static const Color successLight = Color(0xFF81C784);
  static const Color successDark = Color(0xFF1B5E20);

  static const Color warning = Color(0xFFED6C02);
  static const Color warningLight = Color(0xFFFFB74D);
  static const Color warningDark = Color(0xFFE65100);

  static const Color error = Color(0xFFD32F2F);
  static const Color errorLight = Color(0xFFE57373);
  static const Color errorDark = Color(0xFFC62828);

  static const Color info = Color(0xFF0288D1);
  static const Color infoLight = Color(0xFF4FC3F7);
  static const Color infoDark = Color(0xFF01579B);

  static const Color surface = Color(0xFFF5F7FA);
  static const Color surfaceDark = Color(0xFF121212);
  static const Color surfaceContainer = Color(0xFFFFFFFF);
  static const Color surfaceContainerDark = Color(0xFF1E1E1E);

  static const Color background = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(0xFF0D0D0D);

  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color onSuccess = Color(0xFFFFFFFF);
  static const Color onWarning = Color(0xFFFFFFFF);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color onInfo = Color(0xFFFFFFFF);
  static const Color onSurface = Color(0xFF1C1B1F);
  static const Color onSurfaceDark = Color(0xFFE6E1E5);
  static const Color onBackground = Color(0xFF1C1B1F);
  static const Color onBackgroundDark = Color(0xFFE6E1E5);

  static const Color textPrimary = Color(0xFF1C1B1F);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textDisabled = Color(0xFF9CA3AF);
  static const Color textHint = Color(0xFFB0BEC5);
  static const Color textDarkPrimary = Color(0xFFE6E1E5);
  static const Color textDarkSecondary = Color(0xFFB0BEC5);

  static const Color divider = Color(0xFFE5E7EB);
  static const Color dividerDark = Color(0xFF374151);

  static const Color abnormalResult = Color(0xFFD32F2F);
  static const Color abnormalResultLight = Color(0xFFFFCDD2);
  static const Color criticalResult = Color(0xFF9C27B0);
  static const Color criticalResultLight = Color(0xFFE1BEE7);
  static const Color normalResult = Color(0xFF2E7D32);
  static const Color normalResultLight = Color(0xFFC8E6C9);

  static const Color openStatus = Color(0xFF2E7D32);
  static const Color closedStatus = Color(0xFFD32F2F);
  static const Color pendingStatus = Color(0xFFED6C02);
  static const Color cancelledStatus = Color(0xFF9CA3AF);

  static const Color queueActive = Color(0xFF0066A1);
  static const Color queueWaiting = Color(0xFFED6C02);
  static const Color queueCalled = Color(0xFF2E7D32);

  static const Color cardShadow = Color(0x1A000000);
  static const Color overlay = Color(0x80000000);

  static const Color shimmerBase = Color(0xFFE0E0E0);
  static const Color shimmerHighlight = Color(0xFFF5F5F5);
  static const Color shimmerDarkBase = Color(0xFF2C2C2C);
  static const Color shimmerDarkHighlight = Color(0xFF3A3A3A);

  static Color adaptiveColor(Color light, Color dark, Brightness brightness) {
    return brightness == Brightness.dark ? dark : light;
  }
}
