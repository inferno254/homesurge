import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../components/property_card.dart';
import '../providers/property_providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertiesAsync = ref.watch(publicPropertiesProvider);
    final favoritesAsync = ref.watch(favoritesProvider);
    final compareAsync = ref.watch(compareProvider);

    final favorites = favoritesAsync.whenOrNull(data: (ids) => ids) ?? {};
    final compareIds = compareAsync.whenOrNull(data: (ids) => ids) ?? [];

    final featured = propertiesAsync.whenOrNull(
          data: (list) => list.where((p) => p.isPublished && p.isAvailable).take(4).toList(),
        ) ??
        [];

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Homesurge',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF22D3EE),
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Rongai-focused housing discovery',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white60),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => context.push('/admin/login'),
                    icon: const Icon(Icons.admin_panel_settings_outlined, color: Colors.white60),
                    tooltip: 'Admin',
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Text(
                'Find your next home',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
              ),
              const SizedBox(height: 16),
              _FeatureCard(
                icon: Icons.grid_view_outlined,
                title: 'Browse listings',
                subtitle: 'Explore available homes across Rongai',
                onTap: () => context.push('/browse'),
              ),
              const SizedBox(height: 12),
              _FeatureCard(
                icon: Icons.favorite_border,
                title: 'Saved homes',
                subtitle: 'Your shortlisted properties',
                onTap: () => context.push('/saved'),
              ),
              const SizedBox(height: 12),
              _FeatureCard(
                icon: Icons.compare_arrows,
                title: 'Compare',
                subtitle: 'Side-by-side listing comparison',
                onTap: () => context.push('/compare'),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Featured listings',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                  ),
                  TextButton(
                    onPressed: () => context.push('/browse'),
                    child: const Text('See all'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (propertiesAsync.isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
              else if (featured.isEmpty)
                const Text('No featured listings yet.', style: TextStyle(color: Colors.white60))
              else
                ...featured.map((p) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
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
                    )),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF12151B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white12),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF22D3EE).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: const Color(0xFF22D3EE), size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 15),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white38, size: 20),
          ],
        ),
      ),
    );
  }
}
