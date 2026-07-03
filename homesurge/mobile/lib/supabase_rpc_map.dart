/// Centralized names of Supabase RPC functions used by the mobile app.
///
/// Keeping these in one place prevents typo bugs and makes schema evolution easier.
class SupabaseRpc {
  static const String fetchPublicProperties = 'fetch_public_properties';
  static const String fetchPublicProperty = 'fetch_public_property';
  static const String submitInquiry = 'submit_inquiry';

  // Map-related (Sprint 2 enhancements)
  static const String geocodeProperty = 'geocode_property';
}

