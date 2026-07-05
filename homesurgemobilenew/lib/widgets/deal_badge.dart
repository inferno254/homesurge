import 'package:flutter/material.dart';

class DealBadge extends StatelessWidget {
  const DealBadge({
    super.key,
    required this.price,
    required this.priceType,
    required this.town,
    required this.county,
    required this.propertyType,
    this.bedrooms,
    this.sizeSqm,
  });

  final double price;
  final String priceType;
  final String? town;
  final String? county;
  final String? propertyType;
  final int? bedrooms;
  final double? sizeSqm;

  @override
  Widget build(BuildContext context) {
    Color badgeColor;
    String badgeText;

    final normalizedTown = town?.toLowerCase() ?? '';
    final avgPrice = _getAvgPrice(normalizedTown, propertyType ?? 'apartment', bedrooms ?? 1);
    
    if (avgPrice > 0 && price < avgPrice * 0.9) {
      badgeColor = const Color(0xFF4ADE80);
      badgeText = 'Good Deal';
    } else if (avgPrice > 0 && price < avgPrice * 1.1) {
      badgeColor = const Color(0xFFFBBF24);
      badgeText = 'Fair Price';
    } else {
      badgeColor = const Color(0xFFF43F5E);
      badgeText = 'High Price';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
      ),
      child: Text(
        badgeText,
        style: TextStyle(
          color: badgeColor,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  double _getAvgPrice(String town, String type, int bedrooms) {
    final key = '$town|$type|$bedrooms';
    const prices = {
      'rongai|apartment|1': 15000,
      'rongai|apartment|2': 22000,
      'rongai|apartment|3': 30000,
      'rongai|bedsitter|1': 8000,
      'rongai|bungalow|3': 35000,
      'kajiado|apartment|1': 12000,
      'kajiado|apartment|2': 18000,
    };
    return (prices[key] ?? 20000).toDouble();
  }
}