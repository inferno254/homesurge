import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../components/property_card.dart';
import '../providers/property_providers.dart';

class SavedScreen extends ConsumerWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedProperties = ref.watch(favoritePropertiesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved homes'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          savedProperties.when(
            data: (list) => list.isNotEmpty
                ? IconButton(
                    onPressed: () => ref.read(favoritesProvider.notifier).clearAll(),
                    icon: const Icon(Icons.delete_outline),
                    tooltip: 'Clear all',
                  )
                : const SizedBox.shrink(),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: savedProperties.when(
        data: (list) {
          if (list.isEmpty) {
            return _EmptyState(
              icon: Icons.favorite_border,
              title: 'No saved homes',
              subtitle: 'Tap the heart on a listing to save it here.',
              actionLabel: 'Browse listings',
              onAction: () => context.go('/browse'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            itemCount: list.length,
            itemBuilder: (context, index) {
              final p = list[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: PropertyCard(
                  property: p,
                  isFavorite: true,
                  onFavoriteToggle: () => ref.read(favoritesProvider.notifier).toggle(p.id),
                  onCompareToggle: () async {
                    final msg = await ref.read(compareProvider.notifier).toggle(p.id);
                    if (msg != null && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
                    }
                  },
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.white60))),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: const Color(0xFF22D3EE).withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white60),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: onAction,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF22D3EE),
                foregroundColor: const Color(0xFF0B0D10),
              ),
              child: Text(actionLabel),
            ),
          ],
        ),
      ),
    );
  }
}
