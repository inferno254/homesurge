import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

class AddListingScreen extends ConsumerStatefulWidget {
  const AddListingScreen({super.key});

  @override
  ConsumerState<AddListingScreen> createState() => _AddListingScreenState();
}

class _AddListingScreenState extends ConsumerState<AddListingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _bedrooms = TextEditingController();
  final _bathrooms = TextEditingController();
  final _sizeSqm = TextEditingController();
  final _county = TextEditingController();
  final _town = TextEditingController();
  final _estate = TextEditingController();
  final _address = TextEditingController();
  final _ownerPhone = TextEditingController();

  LatLng? _pickedLocation;
  bool _submitting = false;
  String? _propertyType = 'apartment';
  String? _priceType = 'monthly';
  final bool _isAvailable = true;
  final bool _isPublished = false;
  bool _furnished = false;
  bool _hasBalcony = false;
  bool _hasRooftop = false;
  final List<String> _amenities = [];
  final List<dynamic> _newImageFiles = [];

  static const _propertyTypes = [
    'apartment', 'bedsitter', 'bungalow', 'maisonette',
    'studio', 'townhouse', 'land', 'commercial'
  ];

  static const _amenityOptions = [
    'WiFi', 'Parking', 'Water 24/7', 'Electricity', 'Security',
    'CCTV', 'Gym', 'Backup Generator', 'Balcony', 'Rooftop', 'Free water'
  ];

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _price.dispose();
    _bedrooms.dispose();
    _bathrooms.dispose();
    _sizeSqm.dispose();
    _county.dispose();
    _town.dispose();
    _estate.dispose();
    _address.dispose();
    _ownerPhone.dispose();
    super.dispose();
  }

  Future<void> _detectLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      final lat = position.latitude;
      final lon = position.longitude;

      final response = await http.get(
        Uri.parse('https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lon&zoom=18&addressdetails=1'),
        headers: {'User-Agent': 'homesurge-mobile/1.0'},
      );

      String? displayText;
      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        final address = data['address'] as Map<String, dynamic>?;
        if (address != null) {
          final road = (address['road'] ?? '').toString();
          final suburb = (address['suburb'] ?? address['neighbourhood'] ?? '').toString();
          final town = (address['city'] ?? address['town'] ?? address['municipality'] ?? address['village'] ?? '').toString();
          final county = (address['state'] ?? address['county'] ?? address['region'] ?? '').toString();
          displayText = [road, suburb, town, county].where((s) => s.isNotEmpty).join(', ');
        }
      }

      if (!mounted) return;
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF12151B),
          title: const Text('Use current location?', style: TextStyle(color: Colors.white)),
          content: Text(
            displayText ?? '${lat.toStringAsFixed(6)}, ${lon.toStringAsFixed(6)}',
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Use this')),
          ],
        ),
      );

      if (confirmed == true && mounted) {
        setState(() {
          _pickedLocation = LatLng(lat, lon);
          if (displayText != null) {
            _address.text = displayText;
          }
        });

        final geo = await http.get(
          Uri.parse('https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lon&zoom=18&addressdetails=1'),
          headers: {'User-Agent': 'homesurge-mobile/1.0'},
        );

        if (geo.statusCode == 200 && mounted) {
          final data = json.decode(geo.body) as Map<String, dynamic>;
          final address = data['address'] as Map<String, dynamic>?;
          if (address != null) {
            final county = (address['state'] ?? address['county'] ?? address['region'] ?? '').toString();
            final town = (address['city'] ?? address['town'] ?? address['municipality'] ?? address['village'] ?? '').toString();
            setState(() {
              _county.text = county;
              _town.text = town;
            });
          }
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location set'), backgroundColor: Colors.green),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Location error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage();
    if (picked.isEmpty) return;

    setState(() {
      _newImageFiles.addAll(picked);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);

    try {
      final supabase = Supabase.instance.client;
      final data = <String, dynamic>{
        'title': _title.text.trim(),
        'description': _description.text.trim().isEmpty ? null : _description.text.trim(),
        'price': double.parse(_price.text),
        'price_type': _priceType,
        'bedrooms': _bedrooms.text.isEmpty ? null : int.parse(_bedrooms.text),
        'bathrooms': _bathrooms.text.isEmpty ? null : int.parse(_bathrooms.text),
        'property_type': _propertyType,
        'county': _county.text.trim(),
        'town': _town.text.trim(),
        'area_label': null,
        'estate': _estate.text.trim().isEmpty ? null : _estate.text.trim(),
        'address': _address.text.trim().isEmpty ? null : _address.text.trim(),
        'latitude': _pickedLocation?.latitude,
        'longitude': _pickedLocation?.longitude,
        'owner_phone': _ownerPhone.text.trim().isEmpty ? null : _ownerPhone.text.trim(),
        'is_available': _isAvailable,
        'is_published': _isPublished,
        'furnished': _furnished,
        'has_balcony': _hasBalcony,
        'has_rooftop': _hasRooftop,
      };

      final result = await supabase.from('properties').insert(data).select('id').single();
      final propertyId = result['id']?.toString() ?? '';

      if (_amenities.isNotEmpty && propertyId.isNotEmpty) {
        await supabase.from('amenities').insert(
          _amenities.map((name) => {'property_id': propertyId, 'name': name}).toList(),
        );
      }

      final uploadedUrls = <String>[];
      for (final file in _newImageFiles) {
        final fileName = file.name.replaceAll(RegExp(r'\s+'), '_');
        final path = '$propertyId/${DateTime.now().microsecondsSinceEpoch}_$fileName';
        try {
          await supabase.storage.from('property-images').upload(path, file);
        } catch (e) {
          throw 'Image upload failed: $e';
        }
        final publicUrl = supabase.storage.from('property-images').getPublicUrl(path);
        uploadedUrls.add(publicUrl);
      }

      if (uploadedUrls.isNotEmpty) {
        await supabase.from('property_images').insert(
          uploadedUrls.map((url) => {
            'property_id': propertyId,
            'image_url': url,
            'is_cover': url == uploadedUrls.first,
            'sort_order': uploadedUrls.indexOf(url),
          }).toList(),
        );
        await supabase.from('properties').update({'cover_image_url': uploadedUrls.first}).eq('id', propertyId);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Listing created!'), backgroundColor: Colors.green),
        );
        context.go('/');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Listing'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildSection('Property Details', [
              TextFormField(
                controller: _title,
                decoration: const InputDecoration(labelText: 'Title *'),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _price,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Price (KSh) *'),
                      validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _priceType,
                      decoration: const InputDecoration(labelText: 'Price Type'),
                      items: const [
                        DropdownMenuItem(value: 'monthly', child: Text('Monthly')),
                        DropdownMenuItem(value: 'sale', child: Text('Sale')),
                        DropdownMenuItem(value: 'negotiable', child: Text('Negotiable')),
                      ],
                      onChanged: (v) => setState(() => _priceType = v),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _propertyType,
                decoration: const InputDecoration(labelText: 'Property Type'),
                items: _propertyTypes.map((t) =>
                    DropdownMenuItem(value: t, child: Text(t))
                ).toList(),
                onChanged: (v) => setState(() => _propertyType = v),
              ),
            ]),
            _buildSection('Location', [
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _county,
                      decoration: const InputDecoration(labelText: 'County *'),
                      validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _town,
                      decoration: const InputDecoration(labelText: 'Town *'),
                      validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _estate,
                decoration: const InputDecoration(labelText: 'Estate / neighbourhood'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _address,
                decoration: const InputDecoration(labelText: 'Full address memo'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _detectLocation,
                icon: const Icon(Icons.my_location_outlined, size: 18),
                label: const Text('Use my current location'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF22D3EE),
                  side: const BorderSide(color: Color(0xFF22D3EE)),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _ownerPhone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Your phone number *'),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
            ]),
            _buildSection('Photos', [
              OutlinedButton.icon(
                onPressed: _pickImages,
                icon: const Icon(Icons.upload_outlined),
                label: Text(_newImageFiles.isEmpty ? 'Choose photos' : 'Add more photos'),
              ),
              const SizedBox(height: 12),
              if (_newImageFiles.isNotEmpty)
                SizedBox(
                  height: 120,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _newImageFiles.length,
                    itemBuilder: (context, index) {
                      final file = _newImageFiles[index];
                      return Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(file, width: 120, height: 120, fit: BoxFit.cover),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: InkWell(
                              onTap: () {
                                setState(() => _newImageFiles.removeAt(index));
                              },
                              child: Container(
                                decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                child: const Icon(Icons.close, size: 16, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
            ]),
            _buildSection('Details', [
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _bedrooms,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Bedrooms'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _bathrooms,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Bathrooms'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _sizeSqm,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Size (m²)'),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('Furnished'),
                value: _furnished,
                onChanged: (v) => setState(() => _furnished = v),
              ),
              SwitchListTile(
                title: const Text('Balcony'),
                value: _hasBalcony,
                onChanged: (v) => setState(() => _hasBalcony = v),
              ),
              SwitchListTile(
                title: const Text('Rooftop access'),
                value: _hasRooftop,
                onChanged: (v) => setState(() => _hasRooftop = v),
              ),
            ]),
            _buildSection('Amenities', [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _amenityOptions.map((a) {
                  final selected = _amenities.contains(a);
                  return FilterChip(
                    label: Text(a),
                    selected: selected,
                    onSelected: (v) {
                      setState(() {
                        if (v) {
                          _amenities.add(a);
                        } else {
                          _amenities.remove(a);
                        }
                      });
                    },
                    selectedColor: const Color(0xFFA78BFA).withValues(alpha: 0.2),
                  );
                }).toList(),
              ),
            ]),
            _buildSection('Description', [
              TextFormField(
                controller: _description,
                maxLines: 5,
                decoration: const InputDecoration(
                  hintText: 'Describe the property...',
                  border: OutlineInputBorder(),
                ),
              ),
            ]),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF22D3EE),
                minimumSize: const Size(double.infinity, 52),
              ),
              child: _submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Create Listing'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => context.pop(),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 48),
              ),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF12151B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}
