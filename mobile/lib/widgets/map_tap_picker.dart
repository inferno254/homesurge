import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

/// Simple tap-to-place marker map picker.
///
/// Returns currently selected [LatLng] via [onPicked].
class MapTapPicker extends StatefulWidget {
  const MapTapPicker({
    super.key,
    this.initialCenter = const LatLng(-1.286389, 36.817223),
    this.initialZoom = 12.0,
    this.onPicked,
  });

  final LatLng initialCenter;
  final double initialZoom;
  final ValueChanged<LatLng>? onPicked;

  @override
  State<MapTapPicker> createState() => _MapTapPickerState();
}

class _MapTapPickerState extends State<MapTapPicker> {
  LatLng? _picked;

  @override
  Widget build(BuildContext context) {
    return FlutterMap(
      options: MapOptions(
        initialCenter: widget.initialCenter,
        initialZoom: widget.initialZoom,
        onTap: (tapPosition, latLng) {
          setState(() => _picked = latLng);
          widget.onPicked?.call(latLng);
        },
      ),
      children: [
        TileLayer(
          urlTemplate:
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'homesurge_mobile',
        ),
        if (_picked != null)
          MarkerLayer(
            markers: [
              Marker(
                point: _picked!,
                width: 42,
                height: 42,
                child: const Icon(Icons.location_on,
                    color: Color(0xFF22D3EE), size: 42),
              ),
            ],
          ),
      ],
    );
  }
}

