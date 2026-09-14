import 'package:flutter/material.dart';

/// Placeholder theme — replace with the shared design system theme once it's
/// provided. Keep this file as the single place screens pull colors/text
/// styles from, so swapping the theme later doesn't require touching every
/// screen.
class AppTheme {
  AppTheme._();

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.teal,
        brightness: Brightness.light,
      );
}
