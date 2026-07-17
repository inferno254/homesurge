import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/property.dart';

class PropertyCard extends StatefulWidget {
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

  static bool shouldShowBathrooms(int? bedrooms, String? propertyType) {
    if (propertyType == 'bedsitter') return false;
    if (bedrooms == null) return true;
    return bedrooms >= 2;
  }

  @override
  State<PropertyCard> createState() => _PropertyCardState();
}

class _PropertyCardState extends State<PropertyCard> {
  late final PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 1);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  List<String> get _images {
    final urls = <String>[];
    if (widget.property.coverImageUrl != null && widget.property.coverImageUrl!.isNotEmpty) {
      urls.add(widget.property.coverImageUrl!);
    }
    for (final u in widget.property.imageUrls) {
      if (u.isNotEmpty && !urls.contains(u)) urls.add(u);
    }
    return urls;
  }

  void _go(int delta) {
    if (_images.isEmpty) return;
    final next = (_currentPage + delta).clamp(0, _images.length - 1);
    _pageController.animateToPage(
      next,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final images = _images;
    final hasImages = images.isNotEmpty;

    return InkWell(
      onTap: () => context.push('/listing/${widget.property.id}'),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 18),
        decoration: BoxDecoration(
          color: const Color(0xFF12151B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 4 / 3,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: hasImages
                    ? Stack(
                        fit: StackFit.expand,
                        children: [
                          PageView.builder(
                            controller: _pageController,
                            itemCount: images.length,
                            onPageChanged: (i) => setState(() => _currentPage = i),
                            itemBuilder: (context, i) {
                              final url = images[i];
                              return Image.network(
                                url,
                                fit: BoxFit.cover,
                                width: double.infinity,
                                loadingBuilder: (_, child, progress) {
                                  if (progress == null) return child;
                                  return const ColoredBox(
                                    color: Color(0xFF1A1D24),
                                    child: Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF22D3EE)))),
                                  );
                                },
                                errorBuilder: (_, __, ___) => const ColoredBox(
                                  color: Color(0xFF1A1D24),
                                  child: Icon(Icons.image_not_supported_outlined, color: Colors.white24, size: 36),
                                ),
                              );
                            },
                          ),
                          if (images.length > 1) ...[
                            Positioned(
                              left: 8,
                              top: 0,
                              bottom: 0,
                              child: _Arrow(
                                icon: Icons.chevron_left,
                                onTap: () => _go(-1),
                                visible: _currentPage > 0,
                              ),
                            ),
                            Positioned(
                              right: 8,
                              top: 0,
                              bottom: 0,
                              child: _Arrow(
                                icon: Icons.chevron_right,
                                onTap: () => _go(1),
                                visible: _currentPage < images.length - 1,
                              ),
                            ),
                            Positioned(
                              bottom: 10,
                              left: 0,
                              right: 0,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: List.generate(images.length, (i) {
                                  final active = i == _currentPage;
                                  return AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    margin: const EdgeInsets.symmetric(horizontal: 3),
                                    height: 6,
                                    width: active ? 18 : 6,
                                    decoration: BoxDecoration(
                                      color: active ? const Color(0xFF22D3EE) : Colors.white38,
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                  );
                                }),
                              ),
                            ),
                          ],
                        ],
                      )
                    : const ColoredBox(
                        color: Color(0xFF1A1D24),
                        child: Center(child: Icon(Icons.home_outlined, color: Colors.white24, size: 48)),
                      ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          widget.property.title,
                          style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 16),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        widget.property.displayPrice,
                        style: const TextStyle(color: Color(0xFFA78BFA), fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 13, color: Colors.white38),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          widget.property.shortLocation,
                          style: const TextStyle(color: Colors.white60, fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _SpecChip(icon: Icons.bed_outlined, value: widget.property.bedrooms?.toString() ?? '—'),
                        const SizedBox(width: 6),
                        if (PropertyCard.shouldShowBathrooms(widget.property.bedrooms, widget.property.propertyType))
                          _SpecChip(icon: Icons.bathtub_outlined, value: widget.property.bathrooms?.toString() ?? '—'),
                        const SizedBox(width: 6),
                        _SpecChip(icon: Icons.square_foot_outlined, value: widget.property.sizeSqm != null ? '${widget.property.sizeSqm!.toStringAsFixed(0)} m²' : '—'),
                        if (widget.property.furnished) ...[
                          const SizedBox(width: 6),
                          const _SpecChip(icon: Icons.chair_outlined, value: 'Furnished'),
                        ],
                        if (widget.property.amenities.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          _SpecChip(icon: Icons.checklist_outlined, value: '${widget.property.amenities.length} amenities'),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _ActionIcon(
                        icon: widget.isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: widget.isFavorite ? const Color(0xFFF43F5E) : Colors.white38,
                        onTap: widget.onFavoriteToggle,
                      ),
                      const SizedBox(width: 6),
                      _ActionIcon(
                        icon: widget.isCompare ? Icons.compare : Icons.compare_arrows,
                        color: widget.isCompare ? const Color(0xFF22D3EE) : Colors.white38,
                        onTap: widget.onCompareToggle,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Arrow extends StatelessWidget {
  const _Arrow({required this.icon, required this.onTap, required this.visible});

  final IconData icon;
  final VoidCallback onTap;
  final bool visible;

  @override
  Widget build(BuildContext context) {
    if (!visible) return const SizedBox.shrink();
    return Material(
      color: Colors.black38,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Padding(padding: const EdgeInsets.all(8), child: Icon(icon, color: Colors.white, size: 22)),
      ),
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
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
