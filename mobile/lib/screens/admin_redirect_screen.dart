import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';

class AdminRedirectScreen extends ConsumerWidget {
  const AdminRedirectScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authUserProvider);

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: const Color(0xFF22D3EE).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.admin_panel_settings_outlined, size: 40, color: Color(0xFF22D3EE)),
              ),
              const SizedBox(height: 24),
              Text(
                'Admin Account Detected',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'This app is for customers and publishers. Please use the Admin app to manage properties.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white60),
                textAlign: TextAlign.center,
              ),
              if (user != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Logged in as: ${user.email ?? 'admin'}',
                  style: const TextStyle(color: Colors.white38, fontSize: 12),
                ),
              ],
              const SizedBox(height: 32),
              FilledButton.icon(
                onPressed: () async {
                  final auth = ref.read(authProvider.notifier);
                  await auth.signOut();
                  if (context.mounted) context.go('/');
                },
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('Sign out'),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF22D3EE),
                  foregroundColor: const Color(0xFF0B0D10),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
