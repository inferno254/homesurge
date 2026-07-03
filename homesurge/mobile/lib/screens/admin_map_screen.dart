import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;

class AdminMapScreen extends StatefulWidget {
  const AdminMapScreen({super.key});

  @override
  State<AdminMapScreen> createState() => _AdminMapScreenState();
}

class _AdminMapScreenState extends State<AdminMapScreen> {
  final MapController _mapController = MapController();
  int _activeLayerIndex = 0;
  bool _isLoadingBuildings = false;
  bool _isLoadingStreets = false;
  GeoJSONFeatureCollection _buildings = GeoJSONFeatureCollection(features: []);
  GeoJSONFeatureCollection _streets = GeoJSONFeatureCollection(features: []);

  static const List<Map<String, String>> _tileLayers = [
    {
      'label': 'Voyager',
      'url': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      'attribution': 'CARTO',
    },
    {
      'label': 'Satellite',
      'url': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      'attribution': 'Esri',
    },
    {
      'label': 'Streets',
      'url': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'attribution': 'OpenStreetMap',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    // Default to Rongai area
    await _loadBuildingsForBounds(
      west: 36.68,
      south: -1.45,
      east: 36.80,
      north: -1.34,
    );
    await _loadStreetLabels();
  }

  Future<void> _loadBuildingsForBounds({
    required double west,
    required double south,
    required double east,
    required double north,
  }) async {
    setState(() => _isLoadingBuildings = true);
    try {
      final supabase = Supabase.instance.client;
      final result = await supabase.rpc('get_buildings_by_bounds', params: {
        'min_lon': west,
        'min_lat': south,
        'max_lon': east,
        'max_lat': north,
      });
      final data = result as List<dynamic>? ?? [];
      final features = data.map((f) {
        return GeoJSONFeature(
          type: 'Feature',
          properties: Map<String, dynamic>.from(f as Map),
          geometry: f['geometry'] as Map<String, dynamic>,
        );
      }).toList();
      setState(() {
        _buildings = GeoJSONFeatureCollection(features: features);
      });
    } catch (e) {
      debugPrint('Buildings load failed: $e');
    } finally {
      setState(() => _isLoadingBuildings = false);
    }
  }

  Future<void> _loadStreetLabels() async {
    setState(() => _isLoadingStreets = true);
    try {
      // Rongai + Nairobi environs street names
      const bbox = '-1.45,36.68,-1.34,36.80';
      final query = '[out:json][timeout:120];(way["highway"]["name"]($bbox););out body;>;out skel qt;';
      final url = 'https://overpass-api.de/api/interpreter?data=${Uri.encodeComponent(query)}';
      final resp = await http.get(Uri.parse(url), headers: {'User-Agent': 'Homesurge/1.0'});
      if (resp.statusCode != 200) return;

      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final elements = data['elements'] as List<dynamic>? ?? [];

      final nodes = <int, List<double>>{};
      final ways = <int, List<int>>{};
      final tags = <int, Map<String, dynamic>>{};

      for (final el in elements) {
        final e = el as Map<String, dynamic>;
        if (e['type'] == 'node') {
          nodes[e['id'] as int] = [(e['lon'] as num).toDouble(), (e['lat'] as num).toDouble()];
        } else if (e['type'] == 'way') {
          ways[e['id'] as int] = (e['nodes'] as List<dynamic>).map((n) => n as int).toList();
          tags[e['id'] as int] = (e['tags'] as Map<String, dynamic>? ?? {});
        }
      }

      final features = <GeoJSONFeature>[];
      for (final entry in ways.entries) {
        final tag = tags[entry.key] ?? {};
        final name = tag['name']?.toString();
        if (name == null || name.isEmpty) continue;
        final coords = entry.value
            .map((nid) => nodes[nid])
            .whereType<List<double>>()
            .toList();
        if (coords.length < 2) continue;
        features.add(GeoJSONFeature(
          type: 'Feature',
          properties: {'name': name, 'highway': tag['highway']?.toString()},
          geometry: {'type': 'LineString', 'coordinates': coords},
        ));
      }

      setState(() {
        _streets = GeoJSONFeatureCollection(features: features);
      });
    } catch (e) {
      debugPrint('Street labels load failed: $e');
    } finally {
      setState(() => _isLoadingStreets = false);
    }
  }

  void _onMapEvent(MapEvent event) {
    if (event is MapEventMoveEnd) {
      final bounds = _mapController.camera.visibleBounds;
      _loadBuildingsForBounds(
        west: bounds.west,
        south: bounds.south,
        east: bounds.east,
        north: bounds.north,
      );
    }
  }

  String get _activeLayerLabel => _tileLayers[_activeLayerIndex]['label']!;

  @override
  Widget build(BuildContext context) {
    final layer = _tileLayers[_activeLayerIndex];
    final showBuildings = _activeLayerLabel == 'Voyager';
    final showStreets = _activeLayerLabel == 'Streets';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Map'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (_isLoadingBuildings || _isLoadingStreets)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
            ),
        ],
      ),
      body: FlutterMap(
        mapController: _mapController,
        options: MapOptions(
          initialCenter: const LatLng(-1.3960, 36.7550),
          initialZoom: 14,
          onMapEvent: _onMapEvent,
        ),
        children: [
          TileLayer(
            urlTemplate: layer['url']!,
            userAgentPackageName: 'homesurge_mobile',
          ),
          if (showBuildings && _buildings.features.isNotEmpty)
            PolygonLayer(
              polygons: _buildings.features.map((f) {
                final coords = _extractPolygonCoords(f.geometry);
                return Polygon(
                  points: coords,
                  color: const Color(0xFF22D3EE).withValues(alpha: 0.25),
                  borderColor: const Color(0xFF22D3EE),
                  borderStrokeWidth: 1,
                );
              }).toList(),
            ),
          if (showStreets && _streets.features.isNotEmpty)
            MarkerLayer(
              markers: _streets.features.map((f) {
                final coords = _extractLineCoords(f.geometry);
                if (coords.isEmpty) return null;
                final mid = coords[coords.length ~/ 2];
                return Marker(
                  point: mid,
                  width: 120,
                  height: 28,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0B0D10).withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF22D3EE).withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      f.properties['name']?.toString() ?? '',
                      style: const TextStyle(color: Color(0xFF22D3EE), fontSize: 10, fontWeight: FontWeight.w600),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ),
                );
              }).whereType<Marker>().toList(),
            ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < _tileLayers.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: FloatingActionButton.small(
                heroTag: 'layer_$i',
                onPressed: () => setState(() => _activeLayerIndex = i),
                backgroundColor: _activeLayerIndex == i
                    ? const Color(0xFF22D3EE)
                    : const Color(0xFF12151B),
                foregroundColor: _activeLayerIndex == i
                    ? const Color(0xFF0B0D10)
                    : Colors.white,
                child: Text(_tileLayers[i]['label']![0]),
              ),
            ),
        ],
      ),
    );
  }

  List<LatLng> _extractPolygonCoords(Map<String, dynamic> geometry) {
    if (geometry['type'] != 'Polygon') return [];
    final rings = geometry['coordinates'] as List<dynamic>;
    if (rings.isEmpty) return [];
    final coords = rings[0] as List<dynamic>;
    return coords.map((c) {
      final list = c as List<dynamic>;
      return LatLng((list[1] as num).toDouble(), (list[0] as num).toDouble());
    }).toList();
  }

  List<LatLng> _extractLineCoords(Map<String, dynamic> geometry) {
    if (geometry['type'] != 'LineString') return [];
    final coords = geometry['coordinates'] as List<dynamic>;
    return coords.map((c) {
      final list = c as List<dynamic>;
      return LatLng((list[1] as num).toDouble(), (list[0] as num).toDouble());
    }).toList();
  }
}

class GeoJSONFeature {
  final String type;
  final Map<String, dynamic> properties;
  final Map<String, dynamic> geometry;

  GeoJSONFeature({
    required this.type,
    required this.properties,
    required this.geometry,
  });
}

class GeoJSONFeatureCollection {
  final String type;
  final List<GeoJSONFeature> features;

  GeoJSONFeatureCollection({
    this.type = 'FeatureCollection',
    required this.features,
  });
}
