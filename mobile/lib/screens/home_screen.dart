import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../components/property_card.dart';
import '../providers/property_providers.dart';
import '../env.dart';

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
          data: (list) => list.take(4).toList(),
        ) ??
        [];

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      color: Color(0xFF22D3EE),
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                    ),
                    child: const Icon(Icons.home_rounded, color: Color(0xFF0B0D10), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Homesurge',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF22D3EE),
                                fontSize: 22,
                              ),
                        ),
                        Text(
                          'Kenya housing discovery',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white60),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),
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
                subtitle: 'Explore available homes',
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
              if (AppEnv.hasPublicPhone || AppEnv.hasWhatsApp) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    if (AppEnv.hasPublicPhone)
                      Expanded(
                        child: _ContactButton(
                          icon: Icons.phone_outlined,
                          label: 'Call',
                          color: const Color(0xFF22D3EE),
                          onTap: () async {
                            final uri = Uri.parse('tel:${AppEnv.publicPhone!.replaceAll(RegExp(r'\s+'), '')}');
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(uri);
                            }
                          },
                        ),
                      ),
                    if (AppEnv.hasPublicPhone && AppEnv.hasWhatsApp) const SizedBox(width: 12),
                    if (AppEnv.hasWhatsApp)
                      Expanded(
                        child: _ContactButton(
                          icon: Icons.chat_outlined,
                          label: 'WhatsApp',
                          color: const Color(0xFF25D366),
                          onTap: () async {
                            final uri = Uri.parse(AppEnv.whatsappUrl!);
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(uri, mode: LaunchMode.externalApplication);
                            }
                          },
                        ),
                      ),
                  ],
                ),
              ],
              const SizedBox(height: 28),
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
              else if (propertiesAsync.hasError)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        const Icon(Icons.wifi_off_rounded, color: Colors.white24, size: 48),
                        const SizedBox(height: 16),
                        const Text('Unable to load listings', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 8),
                        TextButton.icon(
                          onPressed: () => ref.invalidate(publicPropertiesProvider),
                          icon: const Icon(Icons.refresh, size: 18),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              else if (featured.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: [
                        Icon(Icons.home_outlined, size: 48, color: Colors.white.withValues(alpha: 0.15)),
                        const SizedBox(height: 12),
                        Text('No featured listings yet.', style: TextStyle(color: Colors.white.withValues(alpha: 0.6))),
                      ],
                    ),
                  ),
                )
              else
                Column(
                  children: featured
                      .map((p) => PropertyCard(
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
                          ))
                      .toList(),
                )
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

class _ContactButton extends StatelessWidget {
  const _ContactButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF12151B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
