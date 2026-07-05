import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/property_providers.dart';
import '../components/property_card.dart';

class RecentlyViewedScreen extends ConsumerWidget {
  const RecentlyViewedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recentlyViewedAsync = ref.watch(recentlyViewedProvider);
    final propertiesAsync = ref.watch(publicPropertiesProvider);
    final favoritesAsync = ref.watch(favoritesProvider);
    final compareAsync = ref.watch(compareProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recently viewed'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: recentlyViewedAsync.when(
        data: (recentIds) {
          if (recentIds.isEmpty) {
            return const Center(
              child: Text(
                'No recently viewed listings yet.',
                style: TextStyle(color: Colors.white60),
              ),
            );
          }

          return propertiesAsync.when(
            data: (properties) {
              final recentProperties = properties
                  .where((p) => recentIds.contains(p.id))
                  .toList();

              if (recentProperties.isEmpty) {
                return const Center(
                  child: Text(
                    'No recently viewed listings found.',
                    style: TextStyle(color: Colors.white60),
                  ),
                );
              }

              final favorites = favoritesAsync.whenOrNull(data: (ids) => ids) ?? {};
              final compareIds = compareAsync.whenOrNull(data: (ids) => ids) ?? [];

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: recentProperties.length,
                itemBuilder: (context, index) {
                  final p = recentProperties[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: PropertyCard(
                      property: p,
                      isFavorite: favorites.contains(p.id),
                      isCompare: compareIds.contains(p.id),
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
            error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.red))),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.red))),
      ),
    );
  }
}