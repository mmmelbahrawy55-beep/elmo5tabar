import 'package:flutter/material.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_colors.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double? elevation;
  final Color? color;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  final Widget? header;
  final Widget? footer;
  final bool hasBorder;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.elevation,
    this.color,
    this.borderRadius,
    this.onTap,
    this.header,
    this.footer,
    this.hasBorder = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final card = Card(
      elevation: elevation ?? AppSpacing.elevationSm,
      color: color ?? theme.cardTheme.color,
      shape: RoundedRectangleBorder(
        borderRadius: borderRadius ?? BorderRadius.circular(AppSpacing.radiusMd),
        side: hasBorder
            ? BorderSide(color: theme.dividerColor, width: AppSpacing.borderThin)
            : BorderSide.none,
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        borderRadius: borderRadius ?? BorderRadius.circular(AppSpacing.radiusMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (header != null) header!,
            Padding(
              padding: padding ?? const EdgeInsets.all(AppSpacing.cardPadding),
              child: child,
            ),
            if (footer != null) footer!,
          ],
        ),
      ),
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: borderRadius ?? BorderRadius.circular(AppSpacing.radiusMd),
        child: card,
      );
    }
    return card;
  }
}
