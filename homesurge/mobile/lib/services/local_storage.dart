import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  static final LocalStorageService _instance = LocalStorageService._internal();
  factory LocalStorageService() => _instance;
  LocalStorageService._internal();

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<Set<String>> getFavorites() async {
    await init();
    final raw = _prefs!.getStringList('favorites') ?? [];
    return raw.toSet();
  }

  Future<void> setFavorites(Set<String> ids) async {
    await init();
    await _prefs!.setStringList('favorites', ids.toList());
  }

  Future<List<String>> getCompareList() async {
    await init();
    return _prefs!.getStringList('compare') ?? [];
  }

  Future<void> setCompareList(List<String> ids) async {
    await init();
    await _prefs!.setStringList('compare', ids);
  }

  Future<List<String>> getRecentlyViewed() async {
    await init();
    return _prefs!.getStringList('recently_viewed') ?? [];
  }

  Future<void> setRecentlyViewed(List<String> ids) async {
    await init();
    await _prefs!.setStringList('recently_viewed', ids);
  }

  Future<Map<String, dynamic>> getMapLayerPrefs() async {
    await init();
    final raw = _prefs!.getString('map_prefs');
    if (raw == null) return {};
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  Future<void> setMapLayerPrefs(Map<String, dynamic> prefs) async {
    await init();
    await _prefs!.setString('map_prefs', jsonEncode(prefs));
  }
}
