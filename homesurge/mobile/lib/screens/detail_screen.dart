import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../components/budget_sheet.dart';
import '../components/inquiry_sheet.dart';
import '../models/property.dart';
import '../providers/property_providers.dart';
import '../services/sharing.dart';

class DetailScreen extends ConsumerStatefulWidget {
  const DetailScreen({super.key, required this.listingId});

  final String listingId;

  @override
  ConsumerState<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends ConsumerState<DetailScreen> {
  int _currentImage = 0;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      await ref.read(recentlyViewedProvider.notifier).add(widget.listingId);
    });
  }

  void _showInquiry(Property property) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0B0D10),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => InquirySheet(property: property),
    );
  }

  void _showBudget(Property property) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0B0D10),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => BudgetSheet(monthlyRent: property.priceType == 'monthly' ? property.price : 0),
    );
  }

  @override
  Widget build(BuildContext context) {
    final propertyAsync = ref.watch(propertyByIdProvider(widget.listingId));
    final favoritesAsync = ref.watch(favoritesProvider);
    final compareAsync = ref.watch(compareProvider);

    final isFavorite = favoritesAsync.whenOrNull(data: (ids) => ids.contains(widget.listingId)) ?? false;
    final isCompare = compareAsync.whenOrNull(data: (ids) => ids.contains(widget.listingId)) ?? false;

    return Scaffold(
      body: propertyAsync.when(
        data: (property) {
          if (property == null) {
            return _buildError('Listing not found');
          }
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 280,
                pinned: true,
                backgroundColor: const Color(0xFF0B0D10),
                leading: IconButton(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back),
                ),
                actions: [
                  IconButton(
                    onPressed: () => shareProperty(context, property),
                    icon: const Icon(Icons.share_outlined),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: _ImageCarousel(
                    property: property,
                    currentIndex: _currentImage,
                    onPageChanged: (i) => setState(() => _currentImage = i),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            property.title,
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      property.displayPrice,
                      style: const TextStyle(color: Color(0xFFA78BFA), fontWeight: FontWeight.w700, fontSize: 20),
                    ),
                    const SizedBox(height: 12),
                    _InfoChipRow(property: property),
                    const SizedBox(height: 20),
                    const _SectionTitle('Location'),
                    const SizedBox(height: 8),
                    Text(
                      property.displayLocation,
                      style: const TextStyle(color: Colors.white70),
                    ),
                    const SizedBox(height: 20),
                    const _SectionTitle('Description'),
                    const SizedBox(height: 8),
                    Text(
                      property.description ?? property.aiGeneratedDescription ?? 'No description available.',
                      style: const TextStyle(color: Colors.white70, height: 1.5),
                    ),
                    if (property.amenities.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      const _SectionTitle('Amenities'),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: property.amenities.map((a) => Chip(label: Text(a))).toList(),
                      ),
                    ],
                    const SizedBox(height: 24),
                    _ActionButtons(
                      isFavorite: isFavorite,
                      isCompare: isCompare,
                      onFavorite: () => ref.read(favoritesProvider.notifier).toggle(widget.listingId),
                      onCompare: () async {
                        final msg = await ref.read(compareProvider.notifier).toggle(widget.listingId);
                        if (msg != null && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
                        }
                      },
                      onInquiry: () => _showInquiry(property),
                      onBudget: () => _showBudget(property),
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: () => _showInquiry(property),
                      icon: const Icon(Icons.chat_bubble_outline),
                      label: const Text('Send inquiry'),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF22D3EE),
                        foregroundColor: const Color(0xFF0B0D10),
                        minimumSize: const Size(double.infinity, 54),
                      ),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () => _showBudget(property),
                      icon: const Icon(Icons.calculate_outlined),
                      label: const Text('Budget calculator'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 54),
                        side: const BorderSide(color: Colors.white12),
                      ),
                    ),
                    const SizedBox(height: 32),
                  ]),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _buildError('Error: $e'),
      ),
    );
  }

  Widget _buildError(String message) {
    return Scaffold(
      appBar: AppBar(title: const Text('Listing')),
      body: Center(child: Text(message, style: const TextStyle(color: Colors.white60))),
    );
  }
}

class _ImageCarousel extends StatelessWidget {
  const _ImageCarousel({required this.property, required this.currentIndex, required this.onPageChanged});

  final Property property;
  final int currentIndex;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context) {
    final images = property.imageUrls.isNotEmpty ? property.imageUrls : [property.coverImageUrl].whereType<String>().toList();
    if (images.isEmpty) {
      return Container(
        color: const Color(0xFF12151B),
        child: const Center(child: Icon(Icons.image_not_supported_outlined, color: Colors.white24, size: 48)),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        PageView.builder(
          itemCount: images.length,
          onPageChanged: onPageChanged,
          itemBuilder: (context, index) {
            return Image.network(images[index], fit: BoxFit.cover);
          },
        ),
        if (images.length > 1)
          Positioned(
            bottom: 16,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(images.length, (index) {
                return Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: index == currentIndex ? const Color(0xFF22D3EE) : Colors.white38,
                  ),
                );
              }),
            ),
          ),
      ],
    );
  }
}

class _InfoChipRow extends StatelessWidget {
  const _InfoChipRow({required this.property});

  final Property property;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _Chip(icon: Icons.bed_outlined, label: '${property.bedrooms ?? '—'} bed'),
        _Chip(icon: Icons.bathtub_outlined, label: '${property.bathrooms ?? '—'} bath'),
        _Chip(icon: Icons.square_foot_outlined, label: property.sizeSqm != null ? '${property.sizeSqm!.toStringAsFixed(0)} m²' : '— m²'),
        _Chip(icon: Icons.home_outlined, label: property.propertyType),
        if (property.furnished) const _Chip(icon: Icons.chair_outlined, label: 'Furnished'),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF12151B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF22D3EE)),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, color: Colors.white),
    );
  }
}

class _ActionButtons extends StatelessWidget {
  const _ActionButtons({
    required this.isFavorite,
    required this.isCompare,
    required this.onFavorite,
    required this.onCompare,
    required this.onInquiry,
    required this.onBudget,
  });

  final bool isFavorite;
  final bool isCompare;
  final VoidCallback onFavorite;
  final VoidCallback onCompare;
  final VoidCallback onInquiry;
  final VoidCallback onBudget;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _IconAction(
          icon: isFavorite ? Icons.favorite : Icons.favorite_border,
          label: isFavorite ? 'Saved' : 'Save',
          color: isFavorite ? const Color(0xFFF43F5E) : Colors.white70,
          onTap: onFavorite,
        ),
        const SizedBox(width: 12),
        _IconAction(
          icon: isCompare ? Icons.compare : Icons.compare_arrows,
          label: isCompare ? 'Comparing' : 'Compare',
          color: isCompare ? const Color(0xFF22D3EE) : Colors.white70,
          onTap: onCompare,
        ),
        const SizedBox(width: 12),
        _IconAction(
          icon: Icons.chat_bubble_outline,
          label: 'Inquire',
          onTap: onInquiry,
        ),
        const SizedBox(width: 12),
        _IconAction(
          icon: Icons.calculate_outlined,
          label: 'Budget',
          onTap: onBudget,
        ),
      ],
    );
  }
}

class _IconAction extends StatelessWidget {
  const _IconAction({required this.icon, required this.label, this.onTap, this.color = Colors.white70});

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF12151B),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white12),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}
