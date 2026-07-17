import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

import '../widgets/map_tap_picker.dart';

class AdminPropertyFormScreen extends ConsumerStatefulWidget {
  const AdminPropertyFormScreen({super.key, this.listingId});
  final String? listingId;

  @override
  ConsumerState<AdminPropertyFormScreen> createState() => _AdminPropertyFormScreenState();
}

class _AdminPropertyFormScreenState extends ConsumerState<AdminPropertyFormScreen> {
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
  final _depositAmount = TextEditingController();
  final _waterDeposit = TextEditingController();
  final _electricityDeposit = TextEditingController();
  final _waterPricePerUnit = TextEditingController();

  LatLng? _pickedLocation;
  bool _submitting = false;
  bool _isEdit = false;
  String? _propertyType = 'apartment';
  String? _priceType = 'monthly';
  bool _isAvailable = true;
  bool _isPublished = false;
  bool _furnished = false;
  bool _hasBalcony = false;
  bool _hasRooftop = false;
  final List<String> _amenities = [];
  final List<String> _existingImages = [];
  final List<dynamic> _newImageFiles = [];

  bool _shouldShowBathrooms() {
    final bedrooms = int.tryParse(_bedrooms.text);
    final type = _propertyType;
    if (type == 'bedsitter') return false;
    if (bedrooms != null && bedrooms < 2) return false;
    return true;
  }

  static const _propertyTypes = [
    'apartment', 'bedsitter', 'bungalow', 'maisonette',
    'studio', 'townhouse', 'bnb', 'land', 'commercial'
  ];

  static const _amenityOptions = [
    'WiFi', 'Parking', 'Water 24/7', 'Electricity', 'Security',
    'CCTV', 'Gym', 'Backup Generator', 'Balcony', 'Rooftop', 'Free water'
  ];

  @override
  void initState() {
    super.initState();
    _isEdit = widget.listingId != null;
    if (_isEdit && widget.listingId != null) {
      _loadProperty();
    }
  }

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
    _depositAmount.dispose();
    _waterDeposit.dispose();
    _electricityDeposit.dispose();
    _waterPricePerUnit.dispose();
    super.dispose();
  }

  Future<void> _loadProperty() async {
    final supabase = Supabase.instance.client;
    try {
      final result = await supabase
          .from('properties')
          .select('*, property_images(image_url, is_cover), amenities(name)')
          .eq('id', widget.listingId!)
          .single();

      final data = Map<String, dynamic>.from(result as Map);

      _title.text = data['title'] ?? '';
      _description.text = data['description'] ?? '';
      _price.text = data['price']?.toString() ?? '';
      _bedrooms.text = data['bedrooms']?.toString() ?? '';
      _bathrooms.text = data['bathrooms']?.toString() ?? '';
      _sizeSqm.text = data['size_sqm']?.toString() ?? '';
      _county.text = data['county'] ?? '';
      _town.text = data['town'] ?? '';
      _estate.text = data['estate'] ?? '';
      _address.text = data['address'] ?? '';
      _ownerPhone.text = data['owner_phone'] ?? '';
      _depositAmount.text = data['deposit_amount']?.toString() ?? '';
      _waterDeposit.text = data['water_deposit']?.toString() ?? '';
      _electricityDeposit.text = data['electricity_deposit']?.toString() ?? '';
      _waterPricePerUnit.text = data['water_price_per_unit']?.toString() ?? '';

      setState(() {
        _propertyType = data['property_type'] ?? 'apartment';
        _priceType = data['price_type'] ?? 'monthly';
        _isAvailable = data['is_available'] ?? true;
        _isPublished = data['is_published'] ?? false;
        _furnished = data['furnished'] ?? false;
        _hasBalcony = data['has_balcony'] ?? false;
        _hasRooftop = data['has_rooftop'] ?? false;
        _amenities.addAll((data['amenities'] as List<dynamic>?)?.map((a) => a['name'].toString()).toList() ?? []);
        _existingImages.addAll((data['property_images'] as List<dynamic>?)?.map((i) => i['image_url'].toString()).toList() ?? []);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading property: $e'), backgroundColor: Colors.red),
        );
      }
    }
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
        headers: {'User-Agent': 'homesurge-admin/1.0'},
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
          headers: {'User-Agent': 'homesurge-admin/1.0'},
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
    final supabase = Supabase.instance.client;
    try {
      final result = await supabase.storage.from('property-images').list();
      if (result.isEmpty && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No images in bucket'), backgroundColor: Colors.red),
        );
        return;
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Bucket check failed: $e'), backgroundColor: Colors.red),
        );
      }
    }
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
        'size_sqm': _sizeSqm.text.isEmpty ? null : double.parse(_sizeSqm.text),
        'deposit_amount': _depositAmount.text.isEmpty ? null : double.parse(_depositAmount.text),
        'water_deposit': _waterDeposit.text.isEmpty ? null : double.parse(_waterDeposit.text),
        'electricity_deposit': _electricityDeposit.text.isEmpty ? null : double.parse(_electricityDeposit.text),
        'water_price_per_unit': _waterPricePerUnit.text.isEmpty ? null : double.parse(_waterPricePerUnit.text),
        'has_balcony': _hasBalcony,
        'has_rooftop': _hasRooftop,
      };

      String? propertyId;

      if (_isEdit && widget.listingId != null) {
        await supabase.from('properties').update(data).eq('id', widget.listingId!);

        await supabase.from('amenities').delete().eq('property_id', widget.listingId!);
        if (_amenities.isNotEmpty) {
          await supabase.from('amenities').insert(
            _amenities.map((name) => {'property_id': widget.listingId!, 'name': name}).toList(),
          );
        }
      } else {
        final result = await supabase.from('properties').insert(data).select('id').single();
        propertyId = result['id']?.toString() ?? '';

        if (_amenities.isNotEmpty) {
          await supabase.from('amenities').insert(
            _amenities.map((name) => {'property_id': propertyId, 'name': name}).toList(),
          );
        }
      }

      final pid = _isEdit && widget.listingId != null ? widget.listingId! : propertyId;

      if (pid == null || pid.isEmpty) {
        throw const SnackBar(content: Text('Could not determine property id for images'), backgroundColor: Colors.red);
      }

      final allImages = List<String>.from(_existingImages);

      for (final file in _newImageFiles) {
        final fileName = file.name.replaceAll(RegExp(r'\s+'), '_');
        final path = '$pid/${DateTime.now().microsecondsSinceEpoch}_$fileName';
        try {
          await supabase.storage.from('property-images').upload(path, file);
        } catch (e) {
          throw 'Image upload failed: $e';
        }
        final publicUrl = supabase.storage.from('property-images').getPublicUrl(path);
        allImages.add(publicUrl);
      }

      if (allImages.isNotEmpty) {
        await supabase.from('properties').update({'cover_image_url': allImages.first}).eq('id', pid);

        if (_isEdit) {
          await supabase.from('property_images').delete().eq('property_id', pid);
        }

        if (allImages.isNotEmpty) {
          await supabase.from('property_images').insert(
            allImages.map((url) => {
              'property_id': pid,
              'image_url': url,
              'is_cover': url == allImages.first,
              'sort_order': allImages.indexOf(url),
            }).toList(),
          );
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEdit ? 'Property updated' : 'Property created'),
            backgroundColor: Colors.green,
          ),
        );
        context.go('/admin/dashboard');
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
        title: Text(_isEdit ? 'Edit Property' : 'Add Property'),
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
                  onChanged: (v) {
                    setState(() => _propertyType = v);
                    if (!_shouldShowBathrooms()) {
                      _bathrooms.clear();
                    }
                  },
                ),
               const SizedBox(height: 12),
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
                   if (_shouldShowBathrooms())
                     Expanded(
                       child: TextFormField(
                         controller: _bathrooms,
                         keyboardType: TextInputType.number,
                         decoration: const InputDecoration(labelText: 'Bathrooms'),
                       ),
                     ),
                 ],
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
              _buildMapPicker(),
            ]),
            _buildSection('Photos', [
              OutlinedButton.icon(
                onPressed: _pickImages,
                icon: const Icon(Icons.upload_outlined),
                label: const Text('Choose photos'),
              ),
              const SizedBox(height: 12),
              if (_existingImages.isNotEmpty)
                ..._existingImages.map((url) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: SizedBox(
                        height: 120,
                        child: Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(url, width: 120, height: 120, fit: BoxFit.cover),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: InkWell(
                                onTap: () {
                                  setState(() => _existingImages.remove(url));
                                },
                                child: Container(
                                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                  child: const Icon(Icons.close, size: 16, color: Colors.white),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )),
            ]),
            _buildSection('Internal Details', [
              TextFormField(
                controller: _ownerPhone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Owner / agent phone'),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('Available'),
                value: _isAvailable,
                onChanged: (v) => setState(() => _isAvailable = v),
              ),
              SwitchListTile(
                title: const Text('Publish now'),
                value: _isPublished,
                onChanged: (v) => setState(() => _isPublished = v),
              ),
            ]),
            _buildSection('Financials & Utilities', [
              TextFormField(
                controller: _depositAmount,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Deposit (KSh)'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _waterPricePerUnit,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Water price/unit (KSh)'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _waterDeposit,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Water deposit (KSh)'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _electricityDeposit,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Electricity deposit (KSh)'),
              ),
            ]),
            _buildSection('Features', [
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
                  : Text(_isEdit ? 'Update Property' : 'Create Property'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => context.go('/admin/dashboard'),
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

  Widget _buildMapPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Tap on map to set location (optional)', style: TextStyle(color: Colors.white60, fontSize: 12)),
        const SizedBox(height: 8),
        Container(
          height: 200,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white12),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: MapTapPicker(
              initialCenter: const LatLng(-1.286389, 36.817223),
              initialZoom: 12,
              onPicked: (latlng) {
                setState(() => _pickedLocation = latlng);
              },
            ),
          ),
        ),
        if (_pickedLocation != null) ...[
          const SizedBox(height: 8),
          Text(
            '${_pickedLocation!.latitude.toStringAsFixed(6)}, ${_pickedLocation!.longitude.toStringAsFixed(6)}',
            style: const TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ],
      ],
    );
  }
}
