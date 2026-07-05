import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../providers/auth_provider.dart';

class AdminProperty {
  final String id;
  final String title;
  final String? listingReference;
  final double price;
  final String propertyType;
  final int? bedrooms;
  final int? bathrooms;
  final String? county;
  final String? town;
  final String? estate;
  final bool isPublished;
  final bool isAvailable;
  final String? coverImageUrl;
  final double? latitude;
  final double? longitude;
  final String? ownerPhone;
  final DateTime createdAt;
  final DateTime updatedAt;

  AdminProperty({
    required this.id,
    required this.title,
    this.listingReference,
    required this.price,
    required this.propertyType,
    this.bedrooms,
    this.bathrooms,
    this.county,
    this.town,
    this.estate,
    required this.isPublished,
    required this.isAvailable,
    this.coverImageUrl,
    this.latitude,
    this.longitude,
    this.ownerPhone,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AdminProperty.fromJson(Map<String, dynamic> json) {
    return AdminProperty(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      listingReference: json['listing_reference']?.toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      propertyType: json['property_type']?.toString() ?? 'apartment',
      bedrooms: json['bedrooms'] as int?,
      bathrooms: json['bathrooms'] as int?,
      county: json['county']?.toString(),
      town: json['town']?.toString(),
      estate: json['estate']?.toString(),
      isPublished: json['is_published'] == true,
      isAvailable: json['is_available'] != false,
      coverImageUrl: json['cover_image_url']?.toString(),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      ownerPhone: json['owner_phone']?.toString(),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updated_at']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  int get qualityScore {
    int score = 0;
    if (title.isNotEmpty) score++;
    if (price > 0) score++;
    if (bedrooms != null || ['bedsitter', 'studio'].contains(propertyType)) score++;
    if (bathrooms != null) score++;
    if (county != null) score++;
    if (town != null) score++;
    if (coverImageUrl != null) score++;
    if (latitude != null && longitude != null) score++;
    if (estate != null) score++;
    if (ownerPhone != null) score++;
    return score;
  }
}

final adminPropertiesProvider = FutureProvider.autoDispose<List<AdminProperty>>((ref) async {
  final supabase = Supabase.instance.client;
  final result = await supabase.from('properties').select();
  return (result as List).map((e) => AdminProperty.fromJson(Map<String, dynamic>.from(e as Map))).toList();
});

class SelectedIdsNotifier extends Notifier<Set<String>> {
  @override
  Set<String> build() => {};
  
  void toggle(String id) {
    final next = Set<String>.from(state);
    if (state.contains(id)) {
      next.remove(id);
    } else {
      next.add(id);
    }
    state = next;
  }
  
  void clear() => state = {};
}
final selectedIdsProvider = NotifierProvider<SelectedIdsNotifier, Set<String>>(SelectedIdsNotifier.new);

class SearchQueryNotifier extends Notifier<String> {
  @override
  String build() => '';
  
  void setQuery(String q) => state = q;
}
final searchQueryProvider = NotifierProvider<SearchQueryNotifier, String>(SearchQueryNotifier.new);

// Sort notifier
class SortNotifier extends Notifier<(String, bool)> {
  @override
  (String, bool) build() => ('updated_at', true); // (field, ascending)
  
  void setSort(String field) {
    final current = state;
    state = (field, current.$1 == field ? !current.$2 : true);
  }
}
final sortProvider = NotifierProvider<SortNotifier, (String, bool)>(SortNotifier.new);

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  Future<void> _bulkAction(WidgetRef ref, List<String> ids, String action) async {
    if (ids.isEmpty) return;
    final supabase = Supabase.instance.client;
    try {
      switch (action) {
        case 'publish':
          await supabase.from('properties').update({'is_published': true}).inFilter('id', ids);
          break;
        case 'unpublish':
          await supabase.from('properties').update({'is_published': false}).inFilter('id', ids);
          break;
        case 'delete':
          final confirmed = await showDialog<bool>(
            context: ref.context,
            builder: (c) => AlertDialog(
              backgroundColor: const Color(0xFF12151B),
              title: const Text('Delete properties?', style: TextStyle(color: Colors.white)),
              content: Text('Delete ${ids.length} properties permanently?', style: const TextStyle(color: Colors.white70)),
              actions: [
                TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
              ],
            ),
          );
          if (confirmed == true) {
            await supabase.from('properties').delete().inFilter('id', ids);
          }
          break;
      }
      ref.read(selectedIdsProvider.notifier).clear();
      ref.invalidate(adminPropertiesProvider);
    } catch (e) {
      if (ref.context.mounted) {
        ScaffoldMessenger.of(ref.context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _duplicateProperty(BuildContext context, WidgetRef ref, AdminProperty property) async {
    final supabase = Supabase.instance.client;
    try {
      final data = {
        'title': property.title,
        'description': null,
        'price': property.price,
        'price_type': 'monthly',
        'bedrooms': property.bedrooms,
        'bathrooms': property.bathrooms,
        'property_type': property.propertyType,
        'county': property.county,
        'town': property.town,
        'area_label': null,
        'estate': property.estate,
        'address': null,
        'latitude': property.latitude,
        'longitude': property.longitude,
        'owner_phone': property.ownerPhone,
        'is_available': true,
        'is_published': false,
        'furnished': false,
        'size_sqm': null,
        'deposit_amount': null,
        'water_deposit': null,
        'electricity_deposit': null,
        'water_price_per_unit': null,
        'has_balcony': false,
        'has_rooftop': false,
      };
      
      final result = await supabase.from('properties').insert(data).select('id').single();
      final newId = result['id']?.toString() ?? '';
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: const Text('Property duplicated'), backgroundColor: Colors.green),
        );
        ref.read(searchQueryProvider.notifier).setQuery('');
        context.go('/admin/edit/$newId');
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _exportCsv(WidgetRef ref, List<AdminProperty> properties) async {
    final headers = [
      'listing_reference', 'title', 'price', 'price_type', 'bedrooms', 'bathrooms',
      'property_type', 'county', 'town', 'area_label', 'estate', 'is_published',
      'is_available', 'furnished', 'size_sqm', 'owner_phone', 'created_at'
    ];
    final escape = (v) {
      final s = v?.toString() ?? '';
      return s.contains(',') || s.contains('"') || s.contains('\n') ? '"${s.replaceAll('"', '""')}"' : s;
    };
    final lines = [headers.join(',')];
    for (final r in properties) {
      lines.add(headers.map((h) => escape((r as Map<String, dynamic>)[h])).join(','));
    }
    final csv = lines.join('\n');
    // Note: In mobile, you'd use path_provider + file_saver to save the file
    ScaffoldMessenger.of(ref.context).showSnackBar(
      SnackBar(content: Text('CSV ready (${properties.length} rows) - share/save not implemented'), backgroundColor: Colors.blue),
    );
  }

  Widget _buildBulkButton(WidgetRef ref, String label, IconData icon, Color color, String action) {
    return InkWell(
      onTap: () => _bulkAction(ref, ref.read(selectedIdsProvider).toList(), action),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertiesAsync = ref.watch(adminPropertiesProvider);
    final selectedIds = ref.watch(selectedIdsProvider);
    final searchQuery = ref.watch(searchQueryProvider);
    final sortState = ref.watch(sortProvider);

    final filtered = propertiesAsync.when<List<AdminProperty>>(
      data: (properties) {
        var list = searchQuery.isEmpty ? List<AdminProperty>.from(properties) : properties.where((p) {
          final q = searchQuery.toLowerCase();
          return p.title.toLowerCase().contains(q) ||
              (p.listingReference?.toLowerCase().contains(q) ?? false) ||
              (p.town?.toLowerCase().contains(q) ?? false) ||
              (p.county?.toLowerCase().contains(q) ?? false) ||
              (p.estate?.toLowerCase().contains(q) ?? false);
        }).toList();
        
        // Sort the list
        list.sort((a, b) {
          final field = sortState.$1;
          final asc = sortState.$2;
          final aVal = _getFieldValue(a, field);
          final bVal = _getFieldValue(b, field);
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return asc ? 1 : -1;
          if (bVal == null) return asc ? -1 : 1;
          if (aVal is num && bVal is num) return asc ? aVal.compareTo(bVal) : bVal.compareTo(aVal);
          return asc ? aVal.toString().compareTo(bVal.toString()) : bVal.toString().compareTo(aVal.toString());
        });
        return list;
      },
      loading: () => [],
      error: (_, __) => [],
    );

    final published = filtered.where((p) => p.isPublished).length;
    final drafts = filtered.length - published;
    final geocoded = filtered.where((p) => p.latitude != null && p.longitude != null).length;

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
        onRefresh: () => ref.refresh(adminPropertiesProvider.future),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Stats Grid
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    icon: Icons.home_outlined,
                    label: 'Total pipeline',
                    value: filtered.length.toString(),
                    color: const Color(0xFF22D3EE),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    icon: Icons.public_outlined,
                    label: 'Live listings',
                    value: published.toString(),
                    sub: '$drafts drafts',
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
                    icon: Icons.map_outlined,
                    label: 'Pins on map',
                    value: geocoded.toString(),
                    sub: 'Add lat/lng to appear',
                    color: const Color(0xFFA78BFA),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    icon: Icons.chat_bubble_outline,
                    label: 'Inquiries',
                    value: 'View all',
                    color: const Color(0xFFFBBF24),
                    onTap: () => context.push('/admin/inquiries'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Action buttons
            Wrap(
              spacing: 8,
              children: [
                TextButton.icon(
                  onPressed: () => context.push('/admin/map'),
                  icon: const Icon(Icons.map_outlined, size: 16),
                  label: const Text('Map view'),
                ),
                TextButton.icon(
                  onPressed: () => context.push('/admin/activity'),
                  icon: const Icon(Icons.history, size: 16),
                  label: const Text('Activity'),
                ),
                TextButton.icon(
                  onPressed: () => _exportCsv(ref, filtered),
                  icon: const Icon(Icons.download, size: 16),
                  label: const Text('Export CSV'),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Bulk actions
            if (selectedIds.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Row(
                  children: [
                    Text('${selectedIds.length} selected', style: const TextStyle(color: Colors.white70)),
                    const SizedBox(width: 8),
                    _buildBulkButton(ref, 'Publish', Icons.public, Colors.green, 'publish'),
                    const SizedBox(width: 6),
                    _buildBulkButton(ref, 'Unpublish', Icons.public_off, Colors.amber, 'unpublish'),
                    const SizedBox(width: 6),
                    _buildBulkButton(ref, 'Delete', Icons.delete, Colors.red, 'delete'),
                  ],
                ),
              ),
            const SizedBox(height: 12),

            // Search
            TextField(
              decoration: InputDecoration(
                hintText: 'Search by ref, title, town, estate...',
                prefixIcon: const Icon(Icons.search, size: 18, color: Colors.white60),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.05),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (v) => ref.read(searchQueryProvider.notifier).state = v,
            ),
            const SizedBox(height: 12),

            // Add property button
            FilledButton.icon(
              onPressed: () => context.push('/admin/new'),
              icon: const Icon(Icons.add),
              label: const Text('Add property'),
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF22D3EE)),
            ),
            const SizedBox(height: 16),

            // Properties list
            propertiesAsync.when(
              data: (properties) {
                if (filtered.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Text(searchQuery.isNotEmpty ? 'No results found' : 'No listings yet', style: const TextStyle(color: Colors.white60)),
                    ),
                  );
                }
                return ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final p = filtered[index];
                    final isSelected = selectedIds.contains(p.id);
                    return _PropertyTile(
                      property: p,
                      isSelected: isSelected,
                      onSelected: (v) {
                        ref.read(selectedIdsProvider.notifier).toggle(p.id);
                      },
                      onDuplicate: (prop) => _duplicateProperty(context, ref, prop),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text('Error: $e', style: const TextStyle(color: Colors.red)),
            ),
          ],
        ),
      ),
    );
  }

  dynamic _getFieldValue(AdminProperty p, String field) {
    switch (field) {
      case 'listing_reference': return p.listingReference;
      case 'title': return p.title;
      case 'price': return p.price;
      case 'updated_at': return p.updatedAt;
      case 'bedrooms': return p.bedrooms;
      default: return null;
    }
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    this.sub,
    required this.color,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final String? sub;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
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
            Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 22)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: Colors.white60, fontSize: 12)),
            if (sub != null) Text(sub!, style: const TextStyle(color: Colors.white60, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _PropertyTile extends StatelessWidget {
  const _PropertyTile({
    required this.property,
    required this.isSelected,
    required this.onSelected,
    required this.onDuplicate,
  });

  final AdminProperty property;
  final bool isSelected;
  final ValueChanged<bool?> onSelected;
  final ValueChanged<AdminProperty> onDuplicate;

  @override
  Widget build(BuildContext context) {
    final quality = property.qualityScore;
    Color qualityColor;
    if (quality >= 8) {
      qualityColor = Colors.green;
    } else if (quality >= 5) {
      qualityColor = Colors.amber;
    } else {
      qualityColor = Colors.red;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isSelected ? Colors.cyan.withValues(alpha: 0.1) : const Color(0xFF12151B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isSelected ? Colors.cyan : Colors.white12),
      ),
      child: ListTile(
        leading: Checkbox(
          value: isSelected,
          onChanged: onSelected,
          fillColor: WidgetStateProperty.all(isSelected ? Colors.cyan : Colors.white38),
        ),
        title: Text(property.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('${property.listingReference ?? '—'} • ${property.town ?? '—'}', style: const TextStyle(color: Colors.white60, fontSize: 11)),
            const SizedBox(height: 4),
            Container(
              height: 4,
              width: 60,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(2),
              ),
              child: Align(
                alignment: Alignment.centerLeft,
                child: FractionallySizedBox(
                  widthFactor: quality / 11,
                  child: Container(decoration: BoxDecoration(color: qualityColor, borderRadius: BorderRadius.circular(2))),
                ),
              ),
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('KSh ${property.price.toInt()}', style: const TextStyle(color: Color(0xFFA78BFA))),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: property.isPublished ? Colors.green.withValues(alpha: 0.2) : Colors.amber.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                property.isPublished ? 'Live' : 'Draft',
                style: TextStyle(color: property.isPublished ? Colors.green : Colors.amber),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.edit_outlined, size: 18),
              onPressed: () => context.go('/admin/edit/${property.id}'),
              color: Colors.white60,
            ),
            IconButton(
              icon: const Icon(Icons.copy, size: 16),
              onPressed: () => onDuplicate(property),
              color: Colors.white60,
              tooltip: 'Duplicate',
            ),
          ],
        ),
        onTap: () => context.go('/admin/edit/${property.id}'),
      ),
    );
  }
}