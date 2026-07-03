import 'package:flutter/foundation.dart';

@immutable
class Property {
  final String id;
  final String title;
  final String? slug;
  final String? description;
  final String? aiGeneratedDescription;
  final double price;
  final String priceType;
  final int? bedrooms;
  final int? bathrooms;
  final String propertyType;
  final bool furnished;
  final double? sizeSqm;
  final String? county;
  final String? town;
  final String? areaLabel;
  final String? estate;
  final String? address;
  final double? latitude;
  final double? longitude;
  final String? ownerPhone;
  final String? listingReference;
  final bool isAvailable;
  final bool isPublished;
  final String? coverImageUrl;
  final List<String> imageUrls;
  final List<String> amenities;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Property({
    required this.id,
    required this.title,
    this.slug,
    this.description,
    this.aiGeneratedDescription,
    required this.price,
    this.priceType = 'monthly',
    this.bedrooms,
    this.bathrooms,
    this.propertyType = 'apartment',
    this.furnished = false,
    this.sizeSqm,
    this.county,
    this.town,
    this.areaLabel,
    this.estate,
    this.address,
    this.latitude,
    this.longitude,
    this.ownerPhone,
    this.listingReference,
    this.isAvailable = true,
    this.isPublished = false,
    this.coverImageUrl,
    this.imageUrls = const [],
    this.amenities = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    final imagesRaw = json['image_urls'];
    final amenitiesRaw = json['amenity_names'];
    final created = json['created_at'];
    final updated = json['updated_at'];

    return Property(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      slug: json['slug']?.toString(),
      description: json['description']?.toString(),
      aiGeneratedDescription: json['ai_generated_description']?.toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      priceType: json['price_type']?.toString() ?? 'monthly',
      bedrooms: json['bedrooms'] as int?,
      bathrooms: json['bathrooms'] as int?,
      propertyType: json['property_type']?.toString() ?? 'apartment',
      furnished: json['furnished'] == true,
      sizeSqm: (json['size_sqm'] as num?)?.toDouble(),
      county: json['county']?.toString(),
      town: json['town']?.toString(),
      areaLabel: json['area_label']?.toString(),
      estate: json['estate']?.toString(),
      address: json['address']?.toString(),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      ownerPhone: json['owner_phone']?.toString(),
      listingReference: json['listing_reference']?.toString(),
      isAvailable: json['is_available'] != false,
      isPublished: json['is_published'] == true,
      coverImageUrl: json['cover_image_url']?.toString(),
      imageUrls: _toStringList(imagesRaw),
      amenities: _toStringList(amenitiesRaw),
      createdAt: created != null ? DateTime.tryParse(created.toString()) : null,
      updatedAt: updated != null ? DateTime.tryParse(updated.toString()) : null,
    );
  }

  static List<String> _toStringList(dynamic value) {
    if (value == null) return const [];
    if (value is List) return value.map((e) => e.toString()).toList();
    return const [];
  }

  String get displayPrice {
    final formatted = price.toStringAsFixed(price.truncateToDouble() == price ? 0 : 2);
    switch (priceType) {
      case 'sale':
        return 'KSh $formatted';
      case 'negotiable':
        return 'KSh $formatted (negotiable)';
      case 'monthly':
      default:
        return 'KSh $formatted/mo';
    }
  }

  String get displayLocation {
    final parts = <String>[
      if (areaLabel?.isNotEmpty == true) areaLabel!,
      if (town?.isNotEmpty == true) town!,
      if (county?.isNotEmpty == true) county!,
    ];
    return parts.isEmpty ? 'Location unknown' : parts.join(', ');
  }

  String get shortLocation {
    return areaLabel ?? town ?? county ?? 'Kenya';
  }

  Property copyWith({
    String? id,
    String? title,
    String? slug,
    String? description,
    String? aiGeneratedDescription,
    double? price,
    String? priceType,
    int? bedrooms,
    int? bathrooms,
    String? propertyType,
    bool? furnished,
    double? sizeSqm,
    String? county,
    String? town,
    String? areaLabel,
    String? estate,
    String? address,
    double? latitude,
    double? longitude,
    String? ownerPhone,
    String? listingReference,
    bool? isAvailable,
    bool? isPublished,
    String? coverImageUrl,
    List<String>? imageUrls,
    List<String>? amenities,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Property(
      id: id ?? this.id,
      title: title ?? this.title,
      slug: slug ?? this.slug,
      description: description ?? this.description,
      aiGeneratedDescription: aiGeneratedDescription ?? this.aiGeneratedDescription,
      price: price ?? this.price,
      priceType: priceType ?? this.priceType,
      bedrooms: bedrooms ?? this.bedrooms,
      bathrooms: bathrooms ?? this.bathrooms,
      propertyType: propertyType ?? this.propertyType,
      furnished: furnished ?? this.furnished,
      sizeSqm: sizeSqm ?? this.sizeSqm,
      county: county ?? this.county,
      town: town ?? this.town,
      areaLabel: areaLabel ?? this.areaLabel,
      estate: estate ?? this.estate,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      ownerPhone: ownerPhone ?? this.ownerPhone,
      listingReference: listingReference ?? this.listingReference,
      isAvailable: isAvailable ?? this.isAvailable,
      isPublished: isPublished ?? this.isPublished,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      imageUrls: imageUrls ?? this.imageUrls,
      amenities: amenities ?? this.amenities,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
