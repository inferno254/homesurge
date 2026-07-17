import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../providers/property_providers.dart';

class UsersScreen extends ConsumerWidget {
  const UsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final authUser = ref.watch(authUserProvider);
    final propertiesAsync = ref.watch(publicPropertiesProvider);
    final favoritesAsync = ref.watch(favoritesProvider);
    final compareAsync = ref.watch(compareProvider);
    final recentlyViewedAsync = ref.watch(recentlyViewedProvider);

    final favorites = favoritesAsync.whenOrNull(data: (ids) => ids) ?? {};
    final compareIds = compareAsync.whenOrNull(data: (ids) => ids) ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Users & Activity'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (auth == AuthStatus.authenticated) ...[
            _buildSection('Account', [
              ListTile(
                leading: const Icon(Icons.person_outlined, color: Color(0xFF22D3EE)),
                title: Text(authUser?.email ?? 'Signed in', style: const TextStyle(color: Colors.white)),
                subtitle: Text('Role: ${authUser?.role ?? 'customer'}', style: const TextStyle(color: Colors.white60)),
              ),
            ]),
            const SizedBox(height: 16),
          ],
          _buildSection('Your Activity', [
            _buildActivityRow(
              context,
              icon: Icons.history_outlined,
              label: 'Recently viewed',
              value: '${recentlyViewedAsync.whenOrNull(data: (ids) => ids.length) ?? 0} listings',
              onTap: () => context.push('/recent'),
            ),
            _buildActivityRow(
              context,
              icon: Icons.favorite_border,
              label: 'Saved homes',
              value: '${favorites.length} listings',
              onTap: () => context.push('/saved'),
            ),
            _buildActivityRow(
              context,
              icon: Icons.compare_arrows,
              label: 'Comparing',
              value: '${compareIds.length} listings',
              onTap: () => context.push('/compare'),
            ),
          ]),
          const SizedBox(height: 16),
          if ((authUser?.isAdmin ?? false))
            _buildSection('Market Overview', [
            propertiesAsync.when(
              data: (properties) {
                final published = properties.where((p) => p.isPublished).length;
                final available = properties.where((p) => p.isAvailable).length;
                return Column(
                  children: [
                    _buildActivityRow(
                      context,
                      icon: Icons.home_outlined,
                      label: 'Total listings',
                      value: '${properties.length}',
                      onTap: null,
                    ),
                    _buildActivityRow(
                      context,
                      icon: Icons.public,
                      label: 'Published',
                      value: '$published',
                      onTap: null,
                    ),
                    _buildActivityRow(
                      context,
                      icon: Icons.check_circle_outlined,
                      label: 'Available',
                      value: '$available',
                      onTap: null,
                    ),
                  ],
                );
              },
              loading: () => const Center(child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              )),
              error: (e, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text('Error loading stats', style: TextStyle(color: Colors.white.withValues(alpha: 0.6))),
                ),
              ),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF12151B),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white12),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildActivityRow(BuildContext context, {required IconData icon, required String label, required String value, VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: const Color(0xFF22D3EE)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 14)),
            ),
            Text(value, style: const TextStyle(color: Colors.white60, fontSize: 13)),
            if (onTap != null) ...[
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right, size: 18, color: Colors.white38),
            ],
          ],
        ),
      ),
    );
  }
}
