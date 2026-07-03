import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/property.dart';
import '../providers/property_providers.dart';

class CompareScreen extends ConsumerWidget {
  const CompareScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final compareProperties = ref.watch(comparePropertiesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Compare'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          compareProperties.when(
            data: (list) => list.isNotEmpty
                ? IconButton(
                    onPressed: () => ref.read(compareProvider.notifier).clearAll(),
                    icon: const Icon(Icons.delete_outline),
                    tooltip: 'Clear all',
                  )
                : const SizedBox.shrink(),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: compareProperties.when(
        data: (list) {
          if (list.isEmpty) {
            return _EmptyState(
              icon: Icons.compare_arrows,
              title: 'Nothing to compare',
              subtitle: 'Add up to 4 listings to compare side-by-side.',
              actionLabel: 'Browse listings',
              onAction: () => context.go('/browse'),
            );
          }
          return _CompareTable(properties: list);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.white60))),
      ),
    );
  }
}

class _CompareTable extends StatelessWidget {
  const _CompareTable({required this.properties});

  final List<Property> properties;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      scrollDirection: Axis.horizontal,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _LabelColumn(),
            ...properties.map((p) => _PropertyColumn(property: p)),
          ],
        ),
      ),
    );
  }
}

class _LabelColumn extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 120,
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        border: Border(right: BorderSide(color: Colors.white12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 140), // spacer for image/header
          ..._rowLabels().map((label) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(label, style: const TextStyle(color: Colors.white60, fontWeight: FontWeight.w600)),
              )),
        ],
      ),
    );
  }
}

class _PropertyColumn extends StatelessWidget {
  const _PropertyColumn({required this.property});

  final Property property;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        border: Border(right: BorderSide(color: Colors.white12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 100,
            decoration: BoxDecoration(
              color: const Color(0xFF12151B),
              borderRadius: BorderRadius.circular(12),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: property.coverImageUrl != null
                  ? Image.network(property.coverImageUrl!, fit: BoxFit.cover)
                  : const Center(child: Icon(Icons.image_not_supported_outlined, color: Colors.white24)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            property.title,
            style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 13),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          _ValueCell(property.displayPrice),
          _ValueCell(property.shortLocation),
          _ValueCell(property.propertyType),
          _ValueCell(property.bedrooms != null ? '${property.bedrooms} bed' : '—'),
          _ValueCell(property.bathrooms != null ? '${property.bathrooms} bath' : '—'),
          _ValueCell(property.sizeSqm != null ? '${property.sizeSqm!.toStringAsFixed(0)} m²' : '—'),
          _ValueCell(property.furnished ? 'Yes' : 'No'),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () => context.push('/listing/${property.id}'),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF22D3EE),
              foregroundColor: const Color(0xFF0B0D10),
              minimumSize: const Size(double.infinity, 36),
            ),
            child: const Text('View'),
          ),
        ],
      ),
    );
  }
}

class _ValueCell extends StatelessWidget {
  const _ValueCell(this.value);

  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Text(value, style: const TextStyle(color: Colors.white70)),
    );
  }
}

List<String> _rowLabels() => [
      'Price',
      'Location',
      'Type',
      'Bedrooms',
      'Bathrooms',
      'Size',
      'Furnished',
    ];

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
