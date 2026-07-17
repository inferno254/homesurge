import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/property.dart';

/// Flutter port of the React `AreaInsights` block shown above featured listings.
class AreaInsights extends StatefulWidget {
  final List<Property> properties;
  const AreaInsights({super.key, required this.properties});

  @override
  State<AreaInsights> createState() => _AreaInsightsState();
}

class _AreaInsightsState extends State<AreaInsights> {
  late final Future<List<Map<String, dynamic>>> _areasFuture;

  @override
  void initState() {
    super.initState();
    _areasFuture = _loadAreas();
  }

  Future<List<Map<String, dynamic>>> _loadAreas() async {
    try {
      final data = await Supabase.instance.client.from('nairobi_areas').select().limit(10);
      return (data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = widget.properties;
    final rentalPrices = filtered
        .where((p) => p.priceType == 'monthly' && p.price > 0)
        .map((p) => p.price)
        .toList();
    final salePrices = filtered
        .where((p) => p.priceType == 'sale' && p.price > 0)
        .map((p) => p.price)
        .toList();

    final avgRent = rentalPrices.isNotEmpty
        ? (rentalPrices.reduce((a, b) => a + b) / rentalPrices.length).round()
        : null;
    final avgSale = salePrices.isNotEmpty
        ? (salePrices.reduce((a, b) => a + b) / salePrices.length).round()
        : null;

    final typeCount = <String, int>{};
    for (final p in filtered) {
      typeCount[p.propertyType] = (typeCount[p.propertyType] ?? 0) + 1;
    }
    final topTypes = typeCount.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final top3 = topTypes.take(3).toList();

    final hasStats = filtered.length >= 2;

    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _areasFuture,
      builder: (context, snapshot) {
        final areas = snapshot.data ?? [];
        if (!hasStats && areas.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (hasStats)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF12151B),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _SectionTitle(
                      icon: Icons.map_outlined,
                      text: 'Area insights',
                      color: Color(0xFFA78BFA),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _StatBox(
                            icon: Icons.home_outlined,
                            label: 'Listings',
                            value: '${filtered.length}',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatBox(
                            icon: Icons.attach_money,
                            label: 'Avg. rent',
                            value: avgRent != null ? 'KSh ${avgRent.toString()}' : '—',
                            valueColor: const Color(0xFF22D3EE),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _StatBox(
                            icon: Icons.trending_up,
                            label: 'Avg. sale',
                            value: avgSale != null ? 'KSh ${avgSale.toString()}' : '—',
                            valueColor: const Color(0xFFA78BFA),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatBox(
                            icon: Icons.home_outlined,
                            label: 'Top types',
                            child: Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: top3
                                  .map(
                                    (e) => Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withValues(alpha: 0.04),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                                      ),
                                      child: Text(
                                        '${e.key} ${e.value}',
                                        style: const TextStyle(color: Colors.white70, fontSize: 10),
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            if (areas.isNotEmpty) const SizedBox(height: 16),
            for (final area in areas) _AreaCard(area: area),
          ],
        );
      },
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.text, required this.color});
  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 6),
        Text(
          text.toUpperCase(),
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 1,
          ),
        ),
      ],
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({required this.icon, required this.label, this.value, this.valueColor, this.child});
  final IconData icon;
  final String label;
  final String? value;
  final Color? valueColor;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 12, color: const Color(0xFF64748B)),
              const SizedBox(width: 6),
              Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 10)),
            ],
          ),
          const SizedBox(height: 6),
          if (value != null)
            Text(
              value!,
              style: TextStyle(
                color: valueColor ?? Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            )
          else if (child != null)
            child!
          else
            const SizedBox(height: 18),
        ],
      ),
    );
  }
}

class _AreaCard extends StatelessWidget {
  const _AreaCard({required this.area});
  final Map<String, dynamic> area;

  @override
  Widget build(BuildContext context) {
    final rating = area['security_rating'] as String?;
    final min = area['typical_rent_min'];
    final max = area['typical_rent_max'];
    final transport = area['transport_notes'] as String?;
    final schools = _asList(area['schools_nearby']);
    final hospitals = _asList(area['hospitals_nearby']);
    final shopping = _asList(area['shopping_nearby']);
    final amenities = _asList(area['amenities_nearby']);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF12151B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionTitle(
            icon: Icons.map_outlined,
            text: [
              if (area['estate'] != null) area['estate'].toString(),
              if (area['area_label'] != null) area['area_label'].toString(),
            ].where((e) => e.isNotEmpty).join(' · '),
            color: const Color(0xFFA78BFA),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              if (rating != null) _RatingBadge(rating: rating),
              if (min != null && max != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                  ),
                  child: Text(
                    'KSh ${(min as num).toString()} – ${(max as num).toString()}',
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
                  ),
                ),
            ],
          ),
          if (transport != null) ...[
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.directions_bus, size: 14, color: Color(0xFF22D3EE)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(transport, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (schools.isNotEmpty)
                Expanded(child: _NearbyList(icon: Icons.school, title: 'Schools', items: schools)),
              if (hospitals.isNotEmpty)
                Expanded(child: _NearbyList(icon: Icons.local_hospital, title: 'Hospitals', items: hospitals)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (shopping.isNotEmpty)
                Expanded(child: _NearbyList(icon: Icons.shopping_bag, title: 'Shopping', items: shopping)),
              if (amenities.isNotEmpty)
                Expanded(child: _NearbyList(icon: Icons.home, title: 'Amenities', items: amenities)),
            ],
          ),
        ],
      ),
    );
  }

  static List<String> _asList(dynamic value) {
    if (value == null) return [];
    if (value is List) return value.map((e) => e.toString()).toList();
    return [];
  }
}

class _RatingBadge extends StatelessWidget {
  const _RatingBadge({required this.rating});
  final String rating;

  static const _colors = {
    'low': Color(0xFFFB7185),
    'medium': Color(0xFFFBBF24),
    'high': Color(0xFF22D3EE),
    'premium': Color(0xFFA78BFA),
  };

  @override
  Widget build(BuildContext context) {
    final color = _colors[rating] ?? const Color(0xFF94A3B8);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.shield, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            rating,
            style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }
}

class _NearbyList extends StatelessWidget {
  const _NearbyList({required this.icon, required this.title, required this.items});
  final IconData icon;
  final String title;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    final shown = items.take(3).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: const Color(0xFF64748B)),
            const SizedBox(width: 6),
            Text(title, style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 6),
        ...shown.map(
          (s) => Padding(
            padding: const EdgeInsets.only(bottom: 2),
            child: Text('· $s', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
          ),
        ),
        if (items.length > 3)
          Text('+${items.length - 3} more', style: const TextStyle(color: Color(0xFF64748B), fontSize: 10)),
      ],
    );
  }
}
