import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_typography.dart';
import 'app_spacing.dart';

class AppTheme {
  AppTheme._();

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primarySwatch: AppColors.primary,
    primaryColor: AppColors.primary,
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: const ColorScheme.light(
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      surface: AppColors.surface,
      error: AppColors.error,
      onPrimary: AppColors.onPrimary,
      onSecondary: AppColors.onSecondary,
      onSurface: AppColors.onSurface,
      onError: AppColors.onError,
    ),
    cardTheme: CardTheme(
      elevation: AppSpacing.elevationSm,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      clipBehavior: Clip.antiAlias,
      color: AppColors.surfaceContainer,
      surfaceTintColor: Colors.transparent,
    ),
    appBarTheme: AppBarTheme(
      elevation: AppSpacing.elevationNone,
      centerTitle: true,
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.onBackground,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: AppTypography.titleM(
        color: AppColors.onBackground,
        fontFamily: AppTypography.arabicBody,
      ),
      iconTheme: const IconThemeData(color: AppColors.textPrimary),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      elevation: AppSpacing.elevationLg,
      type: BottomNavigationBarType.fixed,
      backgroundColor: AppColors.surfaceContainer,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.textSecondary,
      selectedLabelStyle: AppTypography.label(
        fontFamily: AppTypography.arabicBody,
      ),
      unselectedLabelStyle: AppTypography.label(
        fontFamily: AppTypography.arabicBody,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        elevation: AppSpacing.elevationNone,
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.onPrimary,
        disabledBackgroundColor: AppColors.textDisabled,
        disabledForegroundColor: AppColors.onPrimary,
        textStyle: AppTypography.button(
          fontFamily: AppTypography.arabicBody,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        minimumSize: const Size(double.infinity, AppSpacing.buttonHeightMedium),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        textStyle: AppTypography.button(
          fontFamily: AppTypography.arabicBody,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        side: const BorderSide(color: AppColors.primary),
        textStyle: AppTypography.button(
          fontFamily: AppTypography.arabicBody,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        minimumSize: const Size(double.infinity, AppSpacing.buttonHeightMedium),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surface,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.md,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        borderSide: const BorderSide(color: AppColors.divider),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        borderSide: const BorderSide(color: AppColors.divider),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        borderSide: const BorderSide(color: AppColors.error, width: 2),
      ),
      labelStyle: AppTypography.bodyM(
        color: AppColors.textSecondary,
        fontFamily: AppTypography.arabicBody,
      ),
      hintStyle: AppTypography.bodyM(
        color: AppColors.textHint,
        fontFamily: AppTypography.arabicBody,
      ),
      errorStyle: AppTypography.bodyS(
        color: AppColors.error,
        fontFamily: AppTypography.arabicBody,
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.surface,
      selectedColor: AppColors.primary.withOpacity(0.15),
      labelStyle: AppTypography.bodyS(
        fontFamily: AppTypography.arabicBody,
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        side: const BorderSide(color: AppColors.divider),
      ),
    ),
    dialogTheme: DialogTheme(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      ),
      elevation: AppSpacing.elevationLg,
      backgroundColor: AppColors.surfaceContainer,
      titleTextStyle: AppTypography.headline6(
        fontFamily: AppTypography.arabicBody,
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      ),
      contentTextStyle: AppTypography.bodyM(
        color: AppColors.onSurface,
        fontFamily: AppTypography.arabicBody,
      ),
    ),
    dividerTheme: DividerThemeData(
      color: AppColors.divider,
      thickness: AppSpacing.borderNormal,
      space: AppSpacing.md,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      backgroundColor: AppColors.surfaceContainer,
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.onPrimary,
      elevation: AppSpacing.elevationMd,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
    ),
    tabBarTheme: TabBarTheme(
      labelColor: AppColors.primary,
      unselectedLabelColor: AppColors.textSecondary,
      labelStyle: AppTypography.button(
        fontFamily: AppTypography.arabicBody,
      ),
      unselectedLabelStyle: AppTypography.button(
        fontFamily: AppTypography.arabicBody,
      ),
      indicatorColor: AppColors.primary,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return AppColors.primary;
        return AppColors.textDisabled;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return AppColors.primary.withOpacity(0.5);
        }
        return AppColors.divider;
      }),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return AppColors.primary;
        return Colors.transparent;
      }),
      checkColor: WidgetStateProperty.all(AppColors.onPrimary),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusXs),
      ),
    ),
    radioTheme: RadioThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return AppColors.primary;
        return AppColors.textSecondary;
      }),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: AppColors.primary,
      linearTrackColor: AppColors.divider,
    ),
    dividerColor: AppColors.divider,
    shadowColor: AppColors.cardShadow,
    highlightColor: Colors.transparent,
    splashFactory: InkRipple.splashFactory,
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primarySwatch: AppColors.primary,
    primaryColor: AppColors.primary,
    scaffoldBackgroundColor: AppColors.backgroundDark,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primaryLight,
      secondary: AppColors.secondaryLight,
      surface: AppColors.surfaceDark,
      error: AppColors.errorLight,
      onPrimary: AppColors.onPrimary,
      onSecondary: AppColors.onSecondary,
      onSurface: AppColors.onSurfaceDark,
      onError: AppColors.onError,
    ),
    cardTheme: CardTheme(
      elevation: AppSpacing.elevationSm,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      clipBehavior: Clip.antiAlias,
      color: AppColors.surfaceContainerDark,
      surfaceTintColor: Colors.transparent,
    ),
    appBarTheme: AppBarTheme(
      elevation: AppSpacing.elevationNone,
      centerTitle: true,
      backgroundColor: AppColors.backgroundDark,
      foregroundColor: AppColors.onBackgroundDark,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: AppTypography.titleM(
        color: AppColors.onBackgroundDark,
        fontFamily: AppTypography.arabicBody,
      ),
      iconTheme: const IconThemeData(color: AppColors.textDarkPrimary),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      elevation: AppSpacing.elevationLg,
      type: BottomNavigationBarType.fixed,
      backgroundColor: AppColors.surfaceContainerDark,
      selectedItemColor: AppColors.primaryLight,
      unselectedItemColor: AppColors.textDarkSecondary,
      selectedLabelStyle: AppTypography.label(
        fontFamily: AppTypography.arabicBody,
      ),
      unselectedLabelStyle: AppTypography.label(
        fontFamily: AppTypography.arabicBody,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        elevation: AppSpacing.elevationNone,
        backgroundColor: AppColors.primaryLight,
        foregroundColor: AppColors.onPrimary,
        disabledBackgroundColor: AppColors.textDisabled,
        disabledForegroundColor: AppColors.onPrimary,
        textStyle: AppTypography.button(
          fontFamily: AppTypography.arabicBody,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        minimumSize: const Size(double.infinity, AppSpacing.buttonHeightMedium),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primaryLight,
        textStyle: AppTypography.button(
          fontFamily: AppTypography.arabicBody,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primaryLight,
        side: const BorderSide(color: AppColors.primaryLight),
        textStyle: AppTypography.button(
          fontFamily: AppTypography.arabicBody,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        minimumSize: const Size(double.infinity, AppSpacing.buttonHeightMedium),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surfaceDark,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.md,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        borderSide: const BorderSide(color: AppColors.dividerDark),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        borderSide: const BorderSide(color: AppColors.dividerDark),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        borderSide: BorderSide(color: AppColors.primaryLight, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        borderSide: const BorderSide(color: AppColors.errorLight),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        borderSide: BorderSide(color: AppColors.errorLight, width: 2),
      ),
      labelStyle: AppTypography.bodyM(
        color: AppColors.textDarkSecondary,
        fontFamily: AppTypography.arabicBody,
      ),
      hintStyle: AppTypography.bodyM(
        color: AppColors.textHint,
        fontFamily: AppTypography.arabicBody,
      ),
      errorStyle: AppTypography.bodyS(
        color: AppColors.errorLight,
        fontFamily: AppTypography.arabicBody,
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.surfaceDark,
      selectedColor: AppColors.primaryLight.withOpacity(0.15),
      labelStyle: AppTypography.bodyS(
        fontFamily: AppTypography.arabicBody,
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        side: const BorderSide(color: AppColors.dividerDark),
      ),
    ),
    dialogTheme: DialogTheme(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      ),
      elevation: AppSpacing.elevationLg,
      backgroundColor: AppColors.surfaceContainerDark,
      titleTextStyle: AppTypography.headline6(
        color: AppColors.onSurfaceDark,
        fontFamily: AppTypography.arabicBody,
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      ),
      contentTextStyle: AppTypography.bodyM(
        color: AppColors.onSurfaceDark,
        fontFamily: AppTypography.arabicBody,
      ),
    ),
    dividerTheme: DividerThemeData(
      color: AppColors.dividerDark,
      thickness: AppSpacing.borderNormal,
      space: AppSpacing.md,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      backgroundColor: AppColors.surfaceContainerDark,
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: AppColors.primaryLight,
      foregroundColor: AppColors.onPrimary,
      elevation: AppSpacing.elevationMd,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
    ),
    tabBarTheme: TabBarTheme(
      labelColor: AppColors.primaryLight,
      unselectedLabelColor: AppColors.textDarkSecondary,
      labelStyle: AppTypography.button(
        fontFamily: AppTypography.arabicBody,
      ),
      unselectedLabelStyle: AppTypography.button(
        fontFamily: AppTypography.arabicBody,
      ),
      indicatorColor: AppColors.primaryLight,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return AppColors.primaryLight;
        return AppColors.textDisabled;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return AppColors.primaryLight.withOpacity(0.5);
        }
        return AppColors.dividerDark;
      }),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return AppColors.primaryLight;
        return Colors.transparent;
      }),
      checkColor: WidgetStateProperty.all(AppColors.onPrimary),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusXs),
      ),
    ),
    radioTheme: RadioThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return AppColors.primaryLight;
        return AppColors.textDarkSecondary;
      }),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: AppColors.primaryLight,
      linearTrackColor: AppColors.dividerDark,
    ),
    dividerColor: AppColors.dividerDark,
    shadowColor: Colors.black45,
    highlightColor: Colors.transparent,
    splashFactory: InkRipple.splashFactory,
  );
}
