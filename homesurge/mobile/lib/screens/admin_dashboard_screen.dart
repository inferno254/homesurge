import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../providers/auth_provider.dart';
import '../supabase_rpc_map.dart';

final propertiesProvider = FutureProvider.autoDispose((_) async {
  final supabase = Supabase.instance.client;
  final result = await supabase.rpc(SupabaseRpc.fetchPublicProperties);
  return result as List<dynamic>;
});

final inquiriesCountProvider = FutureProvider.autoDispose<int>((_) async {
  try {
    final supabase = Supabase.instance.client;
    final result = await supabase.from('property_inquiries').select('id');
    return (result as List).length;
  } catch (e) {
    return 0;
  }
});

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final propertiesAsync = ref.watch(propertiesProvider);
    final inquiriesAsync = ref.watch(inquiriesCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => ref.read(authProvider.notifier).signOut(),
            icon: const Icon(Icons.logout_outlined),
            tooltip: 'Sign out',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(propertiesProvider.future),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            propertiesAsync.when(
            data: (items) => Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        icon: Icons.home_outlined,
                        label: 'Total listings',
                        value: items.length.toString(),
                        color: const Color(0xFF22D3EE),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        icon: Icons.public_outlined,
                        label: 'Published',
                        value: items.where((p) => p['is_published'] == true).length.toString(),
                        color: const Color(0xFF4ADE80),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        icon: Icons.pending_outlined,
                        label: 'Draft',
                        value: items.where((p) => p['is_published'] != true).length.toString(),
                        color: const Color(0xFFFBBF24),
                      ),
                    ),
                    const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    icon: Icons.chat_bubble_outline_outlined,
                    label: 'Inquiries',
                    value: inquiriesAsync.when(data: (c) => c.toString(), loading: () => '—', error: (_, __) => '—'),
                    color: const Color(0xFFA78BFA),
                  ),
                ),
                  ],
                ),
              ],
            ),
            loading: () => const Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _StatCard(icon: Icons.home_outlined, label: 'Total listings', value: '—', color: Color(0xFF22D3EE))),
                    SizedBox(width: 12),
                    Expanded(child: _StatCard(icon: Icons.public_outlined, label: 'Published', value: '—', color: Color(0xFF4ADE80))),
                  ],
                ),
                SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _StatCard(icon: Icons.pending_outlined, label: 'Draft', value: '—', color: Color(0xFFFBBF24))),
                    SizedBox(width: 12),
                    Expanded(child: _StatCard(icon: Icons.chat_bubble_outline_outlined, label: 'Inquiries', value: '—', color: Color(0xFFA78BFA))),
                  ],
                ),
              ],
            ),
            error: (_, __) => const Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _StatCard(icon: Icons.home_outlined, label: 'Total listings', value: '—', color: Color(0xFF22D3EE))),
                    SizedBox(width: 12),
                    Expanded(child: _StatCard(icon: Icons.public_outlined, label: 'Published', value: '—', color: Color(0xFF4ADE80))),
                  ],
                ),
                SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _StatCard(icon: Icons.pending_outlined, label: 'Draft', value: '—', color: Color(0xFFFBBF24))),
                    SizedBox(width: 12),
                    Expanded(child: _StatCard(icon: Icons.chat_bubble_outline_outlined, label: 'Inquiries', value: '—', color: Color(0xFFA78BFA))),
                  ],
                ),
              ],
            ),
          ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _ActionCard(
                    icon: Icons.add_location_alt_outlined,
                    label: 'Add listing',
                    onTap: () => context.push('/admin/new'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionCard(
                    icon: Icons.map_outlined,
                    label: 'Map view',
                    onTap: () => context.push('/admin/map'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              'Recent listings',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            propertiesAsync.when(
              data: (items) {
                if (items.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.all(24),
                    child: Text(
                      'No listings yet. Add your first one.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white60),
                    ),
                  );
                }
                return ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: items.length > 10 ? 10 : items.length,
                  itemBuilder: (context, index) {
                    final p = items[index];
                    return _PropertyTile(
                      title: p['title'] ?? 'Untitled',
                      ref: p['listing_reference'] ?? '—',
                      price: p['price'] != null
                          ? 'KSh ${(p['price'] as num).toInt().toString()}'
                          : '—',
                      isPublished: p['is_published'] == true,
                      onTap: () {},
                    );
                  },
                );
              },
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (err, stack) => Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Error: $err',
                  style: const TextStyle(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF12151B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 22,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF12151B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF22D3EE), size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PropertyTile extends StatelessWidget {
  const _PropertyTile({
    required this.title,
    required this.ref,
    required this.price,
    required this.isPublished,
    required this.onTap,
  });

  final String title;
  final String ref;
  final String price;
  final bool isPublished;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF12151B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    ref,
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              price,
              style: const TextStyle(
                color: Color(0xFFA78BFA),
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isPublished
                    ? const Color(0xFF4ADE80).withValues(alpha: 0.15)
                    : const Color(0xFFFBBF24).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                isPublished ? 'Live' : 'Draft',
                style: TextStyle(
                  color: isPublished ? const Color(0xFF4ADE80) : const Color(0xFFFBBF24),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
