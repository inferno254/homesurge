import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SignInGate extends StatelessWidget {
  const SignInGate({
    super.key,
    this.title = 'Sign in to continue',
    this.subtitle = 'Sign in or create a free account to access your saved homes and comparisons.',
    this.icon = Icons.lock_outline,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final accent = const Color(0xFF22D3EE);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: accent.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white60),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => context.go('/login'),
              style: FilledButton.styleFrom(
                backgroundColor: accent,
                foregroundColor: const Color(0xFF0B0D10),
              ),
              child: const Text('Sign in'),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => context.go('/login'),
              child: Text('Create an account', style: TextStyle(color: accent)),
            ),
          ],
        ),
      ),
    );
  }
}
