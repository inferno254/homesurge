import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../components/property_card.dart';
import '../models/property.dart';
import '../providers/property_providers.dart';

class BrowseScreen extends ConsumerStatefulWidget {
  const BrowseScreen({super.key});

  @override
  ConsumerState<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends ConsumerState<BrowseScreen> {
  final List<String> _counties = ['Kajiado'];
  final List<String> _rongaiAreas = [
    'Kandisi',
    'Rimpa',
    'Nkoroi',
    'Merisho',
    'Olekasasi',
    'Tuala',
    'Rangau',
    'Maasai Lodge',
    'Kware',
    'Kiserian',
    'Namanga Colony',
    'Community',
    'Mlimani',
    'Noonikiria',
    'St. Mary\'s',
    'Pillar',
    'Kware Kona',
    'Riara',
    'Milimani',
    'Mbaru Kware',
    'Ekerubo',
    'Koko Agency',
    'Tumaini',
    'St. Patrick\'s',
    'Nsambiti',
    'Tumaini Shopping Centre',
    'Kware To Ecclesia',
    'Riara Centre',
    'Majengo',
    'Kware Qc',
    'Kware Plaza',
    'Kware Centre',
    'Oltukai',
    'Kware Stage',
  ];
  final List<String> _propertyTypes = [
    'apartment',
    'bedsitter',
    'bungalow',
    'maisonette',
    'studio',
    'townhouse',
    'land',
    'commercial',
  ];
  final List<String> _sortOptions = ['Newest', 'Price: low to high', 'Price: high to low'];

  String _qText = '';
  String _county = '';
  String _area = '';
  String _type = '';
  String _sort = 'Newest';
  String _priceMin = '';
  String _priceMax = '';
  bool _furnished = false;
  bool _showFilters = false;

  @override
  Widget build(BuildContext context) {
    final propertiesAsync = ref.watch(publicPropertiesProvider);
    final favoritesAsync = ref.watch(favoritesProvider);
    final compareAsync = ref.watch(compareProvider);

    final favorites = favoritesAsync.whenOrNull(data: (ids) => ids) ?? {};
    final compareIds = compareAsync.whenOrNull(data: (ids) => ids) ?? [];

    final filtered = propertiesAsync.whenOrNull(
          data: _applyFilters,
        ) ??
        [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Browse'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => setState(() => _showFilters = !_showFilters),
            icon: const Icon(Icons.tune_outlined),
            tooltip: 'Filters',
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search by title, town, reference...',
                    prefixIcon: Icon(Icons.search, size: 18),
                  ),
                  onChanged: (v) => setState(() => _qText = v),
                ),
                if (_showFilters) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                           initialValue: _county.isEmpty ? null : _county,
                           decoration: const InputDecoration(
                             contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                             hintText: 'All counties',
                           ),
                          items: [
                            const DropdownMenuItem(value: '', child: Text('All counties')),
                            ..._counties.map((c) => DropdownMenuItem(value: c, child: Text(c))),
                          ],
                          onChanged: (v) => setState(() {
                            _county = v ?? '';
                            _area = '';
                          }),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                           initialValue: _area.isEmpty ? null : _area,
                           decoration: InputDecoration(
                             contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                             hintText: _county.isEmpty ? 'Select county first' : 'All areas',
                           ),
                          isExpanded: true,
                          items: [
                            DropdownMenuItem(value: '', child: Text(_county.isEmpty ? 'Select county first' : 'All areas')),
                            ..._rongaiAreas.map((a) => DropdownMenuItem(value: a, child: Text(a))),
                          ],
                          onChanged: _county.isEmpty ? null : (v) => setState(() => _area = v ?? ''),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                           initialValue: _type.isEmpty ? null : _type,
                           decoration: const InputDecoration(
                             contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                             hintText: 'All types',
                           ),
                          items: [
                            const DropdownMenuItem(value: '', child: Text('All types')),
                            ..._propertyTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))),
                          ],
                          onChanged: (v) => setState(() => _type = v ?? ''),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: const InputDecoration(
                            hintText: 'Min price',
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                          keyboardType: TextInputType.number,
                          onChanged: (v) => setState(() => _priceMin = v),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          decoration: const InputDecoration(
                            hintText: 'Max price',
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                          keyboardType: TextInputType.number,
                          onChanged: (v) => setState(() => _priceMax = v),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                           initialValue: _sort,
                           decoration: const InputDecoration(
                             contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                             hintText: 'Sort',
                           ),
                          items: _sortOptions.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                          onChanged: (v) => setState(() => _sort = v ?? 'Newest'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      FilterChip(
                        label: const Text('Furnished'),
                        selected: _furnished,
                        onSelected: (v) => setState(() => _furnished = v),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () => setState(() {
                          _qText = '';
                          _county = '';
                          _area = '';
                          _type = '';
                          _sort = 'Newest';
                          _priceMin = '';
                          _priceMax = '';
                          _furnished = false;
                        }),
                        child: const Text('Clear all'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const Divider(height: 1, color: Colors.white12),
          Expanded(
            child: propertiesAsync.when(
              data: (_) => filtered.isEmpty
                  ? const Center(child: Text('No listings match your filters'))
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final p = filtered[index];
                        return Padding(
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
                        );
                      },
                    ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.white60))),
            ),
          ),
          _CompareBar(),
        ],
      ),
    );
  }

  List<Property> _applyFilters(List<Property> list) {
    final pMin = _priceMin.isNotEmpty ? double.tryParse(_priceMin) ?? 0.0 : 0.0;
    final pMax = _priceMax.isNotEmpty ? double.tryParse(_priceMax) ?? double.infinity : double.infinity;
    final qt = _qText.trim().toLowerCase();

    final filtered = list.where((p) {
      if (_county.isNotEmpty && (p.county ?? '').toLowerCase() != _county.toLowerCase()) return false;
      if (_type.isNotEmpty && p.propertyType != _type) return false;
      if (p.price < pMin || p.price > pMax) return false;
      if (_area.isNotEmpty && (p.areaLabel ?? '').toLowerCase() != _area.toLowerCase()) return false;
      if (_furnished && !p.furnished) return false;
      if (qt.isEmpty) return true;
      final blob = [
        p.title,
        p.town ?? '',
        p.areaLabel ?? '',
        p.description ?? '',
        p.listingReference ?? '',
      ].join(' ').toLowerCase();
      return blob.contains(qt);
    }).toList();

    switch (_sort) {
      case 'Price: low to high':
        filtered.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'Price: high to low':
        filtered.sort((a, b) => b.price.compareTo(a.price));
        break;
      case 'Newest':
      default:
        filtered.sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));
    }

    return filtered;
  }
}

class _CompareBar extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final compareAsync = ref.watch(compareProvider);
    final count = compareAsync.whenOrNull(data: (ids) => ids.length) ?? 0;
    if (count == 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFF12151B),
        border: Border(top: BorderSide(color: Colors.white12)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Text(
                '$count selected for compare',
                style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600),
              ),
            ),
            TextButton(
              onPressed: () => ref.read(compareProvider.notifier).clearAll(),
              child: const Text('Clear'),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: () => context.push('/compare'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF22D3EE),
                foregroundColor: const Color(0xFF0B0D10),
              ),
              child: const Text('Compare'),
            ),
          ],
        ),
      ),
    );
  }
}
