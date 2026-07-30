import 'package:flutter/material.dart';

class AppTypography {
  AppTypography._();

  static const String arabicDisplay = 'NotoNaskhArabic';
  static const String arabicBody = 'Tajawal';
  static const String englishDisplay = 'Inter';

  static double _fontSize(double size) => size;

  static FontWeight _weight(int w) => FontWeight.values.firstWhere(
        (f) => f.index == w.clamp(0, 8),
        orElse: () => FontWeight.w400,
      );

  static TextStyle _base({
    required double size,
    FontWeight weight = FontWeight.w400,
    double height = 1.2,
    double letterSpacing = 0,
    Color? color,
    String? fontFamily,
    TextDecoration? decoration,
    FontStyle? fontStyle,
  }) {
    return TextStyle(
      fontSize: _fontSize(size),
      fontWeight: weight,
      height: height,
      letterSpacing: letterSpacing,
      color: color,
      fontFamily: fontFamily,
      decoration: decoration,
      fontStyle: fontStyle,
    );
  }

  static TextStyle displayXL({Color? color, String? fontFamily}) => _base(
        size: 57,
        weight: FontWeight.w700,
        height: 1.12,
        letterSpacing: -0.25,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle displayL({Color? color, String? fontFamily}) => _base(
        size: 45,
        weight: FontWeight.w700,
        height: 1.16,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle displayM({Color? color, String? fontFamily}) => _base(
        size: 36,
        weight: FontWeight.w600,
        height: 1.2,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle headline1({Color? color, String? fontFamily}) => _base(
        size: 32,
        weight: FontWeight.w700,
        height: 1.25,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle headline2({Color? color, String? fontFamily}) => _base(
        size: 28,
        weight: FontWeight.w600,
        height: 1.28,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle headline3({Color? color, String? fontFamily}) => _base(
        size: 24,
        weight: FontWeight.w600,
        height: 1.33,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle headline4({Color? color, String? fontFamily}) => _base(
        size: 20,
        weight: FontWeight.w600,
        height: 1.4,
        letterSpacing: 0.25,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle headline5({Color? color, String? fontFamily}) => _base(
        size: 18,
        weight: FontWeight.w600,
        height: 1.44,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle headline6({Color? color, String? fontFamily}) => _base(
        size: 16,
        weight: FontWeight.w600,
        height: 1.5,
        letterSpacing: 0.15,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle titleL({Color? color, String? fontFamily}) => _base(
        size: 22,
        weight: FontWeight.w500,
        height: 1.27,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle titleM({Color? color, String? fontFamily}) => _base(
        size: 16,
        weight: FontWeight.w500,
        height: 1.5,
        letterSpacing: 0.15,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle titleS({Color? color, String? fontFamily}) => _base(
        size: 14,
        weight: FontWeight.w500,
        height: 1.43,
        letterSpacing: 0.1,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle bodyL({Color? color, String? fontFamily}) => _base(
        size: 16,
        weight: FontWeight.w400,
        height: 1.5,
        letterSpacing: 0.5,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle bodyM({Color? color, String? fontFamily}) => _base(
        size: 14,
        weight: FontWeight.w400,
        height: 1.43,
        letterSpacing: 0.25,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle bodyS({Color? color, String? fontFamily}) => _base(
        size: 12,
        weight: FontWeight.w400,
        height: 1.33,
        letterSpacing: 0.4,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle label({Color? color, String? fontFamily}) => _base(
        size: 11,
        weight: FontWeight.w500,
        height: 1.45,
        letterSpacing: 0.5,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle caption({Color? color, String? fontFamily}) => _base(
        size: 12,
        weight: FontWeight.w400,
        height: 1.33,
        letterSpacing: 0.4,
        color: color,
        fontFamily: fontFamily,
      );

  static TextStyle button({Color? color, String? fontFamily}) => _base(
        size: 14,
        weight: FontWeight.w600,
        height: 1.43,
        letterSpacing: 0.75,
        color: color,
        fontFamily: fontFamily,
      );
}
