import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

ThemeData buildhomesurgeTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  final colorScheme = ColorScheme.fromSeed(
    seedColor: const Color(0xFF22D3EE),
    brightness: Brightness.dark,
  ).copyWith(
    surface: const Color(0xFF12151B),
    primary: const Color(0xFF22D3EE),
    secondary: const Color(0xFFA78BFA),
  );

  return base.copyWith(
    colorScheme: colorScheme,
    scaffoldBackgroundColor: const Color(0xFF0B0D10),
    textTheme: GoogleFonts.dmSansTextTheme(base.textTheme).copyWith(
      displayLarge: GoogleFonts.outfit(textStyle: base.textTheme.displayLarge),
      displayMedium:
          GoogleFonts.outfit(textStyle: base.textTheme.displayMedium),
      displaySmall: GoogleFonts.outfit(textStyle: base.textTheme.displaySmall),
      headlineLarge:
          GoogleFonts.outfit(textStyle: base.textTheme.headlineLarge),
      headlineMedium:
          GoogleFonts.outfit(textStyle: base.textTheme.headlineMedium),
      headlineSmall:
          GoogleFonts.outfit(textStyle: base.textTheme.headlineSmall),
      titleLarge: GoogleFonts.outfit(textStyle: base.textTheme.titleLarge),
      titleMedium:
          GoogleFonts.outfit(textStyle: base.textTheme.titleMedium),
      titleSmall: GoogleFonts.outfit(textStyle: base.textTheme.titleSmall),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF0B0D10),
      foregroundColor: Colors.white,
      centerTitle: false,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      color: const Color(0xFF12151B),
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Colors.white12),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF12151B),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Colors.white12),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Colors.white12),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFF22D3EE), width: 1.4),
      ),
      hintStyle: const TextStyle(color: Colors.white38),
      labelStyle: const TextStyle(color: Colors.white70),
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: const Color(0xFF12151B),
      side: const BorderSide(color: Colors.white12),
      labelStyle: const TextStyle(color: Colors.white70),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
    dividerColor: Colors.white10,
    splashColor: const Color(0xFF22D3EE).withValues(alpha: 0.08),
    highlightColor: const Color(0xFF22D3EE).withValues(alpha: 0.05),
  );
}


