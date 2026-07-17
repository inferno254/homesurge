import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/property.dart';

/// Repository for all Supabase data operations with proper error handling
class PropertyRepository {
  final SupabaseClient _client;
  
  PropertyRepository(this._client);

  /// Fetch all published properties for public browsing
  /// Returns null if Supabase is not configured or RPC fails
  Future<List<Property>?> fetchPublicProperties() async {
    try {
      final result = await _client.rpc('fetch_public_properties');
      final list = (result as List<dynamic>? ?? [])
          .map((e) => Property.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      return list;
    } catch (e) {
      debugPrint('Failed to fetch public properties: $e');
      return null;
    }
  }

  /// Fetch a single property by ID
  Future<Property?> fetchPublicProperty(String id) async {
    try {
      final result = await _client.rpc('fetch_public_property', params: {'target_id': id});
      if (result == null) return null;
      final list = result as List<dynamic>;
      if (list.isEmpty) return null;
      return Property.fromJson(Map<String, dynamic>.from(list.first as Map));
    } catch (e) {
      debugPrint('Failed to fetch property $id: $e');
      return null;
    }
  }

  /// Fetch properties for admin map (includes coordinates)
  Future<List<Property>?> fetchAdminProperties() async {
    try {
      final result = await _client.from('properties').select();
      final list = (result as List<dynamic>)
          .map((e) => Property.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      return list;
    } catch (e) {
      debugPrint('Failed to fetch admin properties: $e');
      return null;
    }
  }

  /// Create or update a property
  Future<bool> upsertProperty(Property property) async {
    try {
      final data = property.toJson();
      await _client.from('properties').upsert(data);
      return true;
    } catch (e) {
      debugPrint('Failed to upsert property: $e');
      return false;
    }
  }

  /// Delete a property
  Future<bool> deleteProperty(String id) async {
    try {
      await _client.from('properties').delete().eq('id', id);
      return true;
    } catch (e) {
      debugPrint('Failed to delete property $id: $e');
      return false;
    }
  }

  /// Submit an inquiry for a property
  Future<bool> submitInquiry({
    required String propertyId,
    required String name,
    required String phone,
    String? message,
  }) async {
    try {
      await _client.from('property_inquiries').insert({
        'property_id': propertyId,
        'name': name,
        'phone': phone,
        'message': message,
      });
      return true;
    } catch (e) {
      debugPrint('Failed to submit inquiry: $e');
      return false;
    }
  }
}

/// Extension to convert Property to JSON for Supabase
extension PropertyToJson on Property {
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'slug': slug,
      'description': description,
      'ai_generated_description': aiGeneratedDescription,
      'price': price,
      'price_type': priceType,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'property_type': propertyType,
      'furnished': furnished,
      'size_sqm': sizeSqm,
      'deposit_amount': depositAmount,
      'water_deposit': waterDeposit,
      'electricity_deposit': electricityDeposit,
      'water_price_per_unit': waterPricePerUnit,
      'has_balcony': hasBalcony,
      'has_rooftop': hasRooftop,
      'county': county,
      'town': town,
      'area_label': areaLabel,
      'estate': estate,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'owner_phone': ownerPhone,
      'listing_reference': listingReference,
      'is_available': isAvailable,
      'is_published': isPublished,
      'cover_image_url': coverImageUrl,
    };
  }
}

/// Provider for the repository
final propertyRepositoryProvider = Provider<PropertyRepository>((ref) {
  final supabase = Supabase.instance.client;
  return PropertyRepository(supabase);
});