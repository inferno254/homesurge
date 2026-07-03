import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_homesurge.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: '.env');

  final url = dotenv.env['VITE_SUPABASE_URL']?.trim() ?? '';
  final anonKey = dotenv.env['VITE_SUPABASE_ANON_KEY']?.trim() ?? '';

  if (url.isNotEmpty && anonKey.isNotEmpty) {
    await Supabase.initialize(url: url, publishableKey: anonKey);
  }

  runApp(const ProviderScope(child: HomesurgeApp()));
}



