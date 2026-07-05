import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/property.dart';
import '../services/local_storage.dart';
import '../services/repository.dart';

class FavoritesNotifier extends AsyncNotifier<Set<String>> {
  final LocalStorageService _storage = LocalStorageService();

  @override
  Future<Set<String>> build() async {
    return _storage.getFavorites();
  }

  Future<void> toggle(String id) async {
    final current = Set<String>.from(await future);
    if (current.contains(id)) {
      current.remove(id);
    } else {
      current.add(id);
    }
    await _storage.setFavorites(current);
    state = AsyncData(current);
  }

  Future<void> clearAll() async {
    await _storage.setFavorites({});
    state = const AsyncData({});
  }

  Future<bool> isFavorite(String id) async {
    final current = await future;
    return current.contains(id);
  }
}

final favoritesProvider = AsyncNotifierProvider<FavoritesNotifier, Set<String>>(FavoritesNotifier.new);

final favoritePropertiesProvider = Provider<AsyncValue<List<Property>>>((ref) {
  final allProperties = ref.watch(publicPropertiesProvider);
  final favorites = ref.watch(favoritesProvider);

  return favorites.when(
    data: (ids) => allProperties.when(
      data: (list) => AsyncData(list.where((p) => ids.contains(p.id)).toList()),
      loading: () => const AsyncLoading(),
      error: AsyncError.new,
    ),
    loading: () => const AsyncLoading(),
    error: AsyncError.new,
  );
});

class CompareNotifier extends AsyncNotifier<List<String>> {
  final LocalStorageService _storage = LocalStorageService();

  @override
  Future<List<String>> build() async {
    return _storage.getCompareList();
  }

  Future<String?> toggle(String id) async {
    final current = List<String>.from(await future);
    if (current.contains(id)) {
      current.remove(id);
    } else {
      if (current.length >= 4) {
        return 'You can compare up to 4 listings';
      }
      current.add(id);
    }
    await _storage.setCompareList(current);
    state = AsyncData(current);
    return null;
  }

  Future<void> remove(String id) async {
    final current = List<String>.from(await future);
    current.remove(id);
    await _storage.setCompareList(current);
    state = AsyncData(current);
  }

  Future<void> clearAll() async {
    await _storage.setCompareList([]);
    state = const AsyncData([]);
  }
}

final compareProvider = AsyncNotifierProvider<CompareNotifier, List<String>>(CompareNotifier.new);

final comparePropertiesProvider = Provider<AsyncValue<List<Property>>>((ref) {
  final allProperties = ref.watch(publicPropertiesProvider);
  final compareIds = ref.watch(compareProvider);

  return compareIds.when(
    data: (ids) => allProperties.when(
      data: (list) => AsyncData(list.where((p) => ids.contains(p.id)).toList()),
      loading: () => const AsyncLoading(),
      error: AsyncError.new,
    ),
    loading: () => const AsyncLoading(),
    error: AsyncError.new,
  );
});

class RecentlyViewedNotifier extends AsyncNotifier<List<String>> {
  final LocalStorageService _storage = LocalStorageService();

  @override
  Future<List<String>> build() async {
    return _storage.getRecentlyViewed();
  }

  Future<void> add(String id) async {
    final current = List<String>.from(await future);
    current.remove(id);
    current.insert(0, id);
    final capped = current.length > 10 ? current.sublist(0, 10) : current;
    await _storage.setRecentlyViewed(capped);
    state = AsyncData(capped);
  }

  Future<void> clearAll() async {
    await _storage.setRecentlyViewed([]);
    state = const AsyncData([]);
  }
}

final recentlyViewedProvider = AsyncNotifierProvider<RecentlyViewedNotifier, List<String>>(RecentlyViewedNotifier.new);

final publicPropertiesProvider = FutureProvider<List<Property>>((ref) async {
  final repository = ref.read(propertyRepositoryProvider);
  final result = await repository.fetchPublicProperties();
  if (result == null) {
    throw 'Unable to connect to server. Check your internet connection or Supabase configuration.';
  }
  return result;
});

final propertyByIdProvider = FutureProvider.family<Property?, String>((ref, id) async {
  final repository = ref.read(propertyRepositoryProvider);
  return repository.fetchPublicProperty(id);
});