import 'package:flutter/material.dart';

class AppSpacing {
  AppSpacing._();

  static const double xxs = 2;
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
  static const double xxxl = 64;

  static const double screenHorizontal = md;
  static const double screenVertical = md;
  static const double cardPadding = md;
  static const double listSpacing = sm;
  static const double sectionSpacing = lg;
  static const double contentSpacing = md;

  static const double iconSmall = 16;
  static const double iconMedium = 24;
  static const double iconLarge = 32;
  static const double iconXLarge = 48;

  static const double avatarSmall = 32;
  static const double avatarMedium = 48;
  static const double avatarLarge = 64;
  static const double avatarXLarge = 96;

  static const double radiusXs = 4;
  static const double radiusSm = 8;
  static const double radiusMd = 12;
  static const double radiusLg = 16;
  static const double radiusXl = 24;
  static const double radiusFull = 999;

  static const double elevationNone = 0;
  static const double elevationXs = 1;
  static const double elevationSm = 2;
  static const double elevationMd = 4;
  static const double elevationLg = 8;
  static const double elevationXl = 16;

  static const double borderThin = 0.5;
  static const double borderNormal = 1;
  static const double borderThick = 2;

  static const double buttonHeightSmall = 36;
  static const double buttonHeightMedium = 44;
  static const double buttonHeightLarge = 52;

  static const double inputHeight = 48;
  static const double minTouchTarget = 44;

  static const double bottomNavHeight = 64;
  static const double appBarHeight = 56;
  static const double appBarHeightExpanded = 200;
}

extension SpacingExtension on num {
  double get w => toDouble();
  double get h => toDouble();
}

extension EdgeInsetsExtension on EdgeInsets {
  static EdgeInsets screenHorizontal() =>
      EdgeInsets.symmetric(horizontal: AppSpacing.screenHorizontal);
  static EdgeInsets screenVertical() =>
      EdgeInsets.symmetric(vertical: AppSpacing.screenVertical);
  static EdgeInsets screenAll() => EdgeInsets.all(AppSpacing.md);
  static EdgeInsets cardPadding() => EdgeInsets.all(AppSpacing.cardPadding);
  static EdgeInsets contentPadding() =>
      EdgeInsets.all(AppSpacing.contentSpacing);

  static EdgeInsets onlyL({
    double left = AppSpacing.md,
  }) =>
      EdgeInsets.only(left: left);
  static EdgeInsets onlyR({
    double right = AppSpacing.md,
  }) =>
      EdgeInsets.only(right: right);
  static EdgeInsets onlyT({
    double top = AppSpacing.md,
  }) =>
      EdgeInsets.only(top: top);
  static EdgeInsets onlyB({
    double bottom = AppSpacing.md,
  }) =>
      EdgeInsets.only(bottom: bottom);
  static EdgeInsets symmetricH({
    double horizontal = AppSpacing.md,
  }) =>
      EdgeInsets.symmetric(horizontal: horizontal);
  static EdgeInsets symmetricV({
    double vertical = AppSpacing.md,
  }) =>
      EdgeInsets.symmetric(vertical: vertical);
}

extension SizedBoxExtension on SizedBox {
  static SizedBox h4() => const SizedBox(height: AppSpacing.xs);
  static SizedBox h8() => const SizedBox(height: AppSpacing.sm);
  static SizedBox h16() => const SizedBox(height: AppSpacing.md);
  static SizedBox h24() => const SizedBox(height: AppSpacing.lg);
  static SizedBox h32() => const SizedBox(height: AppSpacing.xl);
  static SizedBox h48() => const SizedBox(height: AppSpacing.xxl);
  static SizedBox h64() => const SizedBox(height: AppSpacing.xxxl);
  static SizedBox w4() => const SizedBox(width: AppSpacing.xs);
  static SizedBox w8() => const SizedBox(width: AppSpacing.sm);
  static SizedBox w16() => const SizedBox(width: AppSpacing.md);
  static SizedBox w24() => const SizedBox(width: AppSpacing.lg);
  static SizedBox w32() => const SizedBox(width: AppSpacing.xl);
}
