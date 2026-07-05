import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_homesurge.dart';

bool _isSupabaseInitialized = false;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    debugPrint('.env file not found, using placeholder values');
  }

  final url = dotenv.env['VITE_SUPABASE_URL']?.trim() ?? '';
  final anonKey = dotenv.env['VITE_SUPABASE_ANON_KEY']?.trim() ?? '';

  if (url.isNotEmpty && anonKey.isNotEmpty) {
    try {
      await Supabase.initialize(url: url, publishableKey: anonKey);
      _isSupabaseInitialized = true;
    } catch (e) {
      debugPrint('Supabase initialization failed: $e');
    }
  } else {
    debugPrint('.env file missing Supabase credentials - set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }

  runApp(const ProviderScope(child: HomesurgeApp()));
}

bool get supabaseConfigured => _isSupabaseInitialized;