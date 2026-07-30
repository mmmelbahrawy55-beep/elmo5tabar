import 'package:flutter/material.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

class AppButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool fullWidth;
  final ButtonVariant variant;
  final ButtonSize size;
  final IconData? icon;
  final Color? color;
  final double? width;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.fullWidth = true,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.medium,
    this.icon,
    this.color,
    this.width,
  });

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final height = widget.size == ButtonSize.small
        ? AppSpacing.buttonHeightSmall
        : widget.size == ButtonSize.large
            ? AppSpacing.buttonHeightLarge
            : AppSpacing.buttonHeightMedium;

    final textStyle = widget.size == ButtonSize.small
        ? AppTypography.bodyS
        : widget.size == ButtonSize.large
            ? AppTypography.titleS
            : AppTypography.button;

    Widget button = AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) => Transform.scale(
        scale: _scaleAnimation.value,
        child: child,
      ),
      child: _buildButton(height, textStyle),
    );

    if (widget.fullWidth) {
      button = SizedBox(
        width: widget.width ?? double.infinity,
        child: button,
      );
    }

    return button;
  }

  Widget _buildButton(double height, TextStyle textStyle) {
    final isDisabled = widget.onPressed == null || widget.isLoading;
    final effectiveOnPressed = widget.isLoading
        ? null
        : () {
            _controller.forward().then((_) => _controller.reverse());
            widget.onPressed?.call();
          };

    switch (widget.variant) {
      case ButtonVariant.primary:
        return ElevatedButton(
          onPressed: effectiveOnPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: widget.color,
            minimumSize: Size.fromHeight(height),
          ),
          child: _buttonContent(textStyle),
        );
      case ButtonVariant.secondary:
        return OutlinedButton(
          onPressed: effectiveOnPressed,
          style: OutlinedButton.styleFrom(
            minimumSize: Size.fromHeight(height),
            side: BorderSide(color: widget.color ?? Theme.of(context).primaryColor),
          ),
          child: _buttonContent(textStyle),
        );
      case ButtonVariant.text:
        return TextButton(
          onPressed: effectiveOnPressed,
          style: TextButton.styleFrom(
            minimumSize: Size.fromHeight(height),
          ),
          child: _buttonContent(textStyle),
        );
    }
  }

  Widget _buttonContent(TextStyle textStyle) {
    if (widget.isLoading) {
      return const SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: Colors.white,
        ),
      );
    }
    if (widget.icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(widget.icon, size: 18),
          const SizedBox(width: AppSpacing.sm),
          Text(widget.label, style: textStyle),
        ],
      );
    }
    return Text(widget.label, style: textStyle);
  }
}

enum ButtonVariant { primary, secondary, text }
enum ButtonSize { small, medium, large }
