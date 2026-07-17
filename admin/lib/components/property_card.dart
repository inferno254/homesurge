import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/property.dart';

class PropertyCard extends StatelessWidget {
  const PropertyCard({
    super.key,
    required this.property,
    this.isFavorite = false,
    this.isCompare = false,
    this.onFavoriteToggle,
    this.onCompareToggle,
  });

  final Property property;
  final bool isFavorite;
  final bool isCompare;
  final VoidCallback? onFavoriteToggle;
  final VoidCallback? onCompareToggle;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/listing/${property.id}'),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF12151B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Thumbnail(property: property),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        property.title,
                        style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 14),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        property.displayPrice,
                        style: const TextStyle(color: Color(0xFFA78BFA), fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 12, color: Colors.white38),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              property.shortLocation,
                              style: const TextStyle(color: Colors.white60, fontSize: 12),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _SpecChip(icon: Icons.bed_outlined, value: property.bedrooms?.toString() ?? '—'),
                  const SizedBox(width: 6),
                  _SpecChip(icon: Icons.bathtub_outlined, value: property.bathrooms?.toString() ?? '—'),
                  const SizedBox(width: 6),
                  _SpecChip(icon: Icons.square_foot_outlined, value: property.sizeSqm != null ? '${property.sizeSqm!.toStringAsFixed(0)} m²' : '—'),
                  if (property.furnished) ...[
                    const SizedBox(width: 6),
                    _SpecChip(icon: Icons.chair_outlined, value: 'Furnished'),
                  ],
                  if (property.amenities.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    _SpecChip(icon: Icons.checklist_outlined, value: '${property.amenities.length} amenities'),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                _ActionIcon(
                  icon: isFavorite ? Icons.favorite : Icons.favorite_border,
                  color: isFavorite ? const Color(0xFFF43F5E) : Colors.white38,
                  onTap: onFavoriteToggle,
                ),
                const SizedBox(width: 6),
                _ActionIcon(
                  icon: isCompare ? Icons.compare : Icons.compare_arrows,
                  color: isCompare ? const Color(0xFF22D3EE) : Colors.white38,
                  onTap: onCompareToggle,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  const _Thumbnail({required this.property});

  final Property property;

  @override
  Widget build(BuildContext context) {
    final imageUrl = property.coverImageUrl ?? (property.imageUrls.isNotEmpty ? property.imageUrls.first : null);
    return Container(
      width: 150,
      height: 150,
      decoration: BoxDecoration(
        color: const Color(0xFF22D3EE).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: imageUrl != null && imageUrl.isNotEmpty
          ? ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                imageUrl,
                fit: BoxFit.cover,
                width: 150,
                height: 150,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.image_not_supported_outlined,
                  color: Colors.white24,
                  size: 28,
                ),
                loadingBuilder: (_, child, progress) {
                  if (progress == null) return child;
                  return const Icon(
                    Icons.image_not_supported_outlined,
                    color: Colors.white24,
                    size: 28,
                  );
                },
              ),
            )
          : const Icon(Icons.image_not_supported_outlined, color: Colors.white24, size: 28),
    );
  }
}

class _SpecChip extends StatelessWidget {
  const _SpecChip({required this.icon, required this.value});

  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF22D3EE).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: const Color(0xFF22D3EE)),
          const SizedBox(width: 4),
          Text(
            value,
            style: const TextStyle(color: Color(0xFF22D3EE), fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _ActionIcon extends StatelessWidget {
  const _ActionIcon({required this.icon, required this.color, this.onTap});

  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Icon(icon, color: color, size: 20),
      ),
    );
  }
}
