import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'widgets/map_tap_picker.dart';

class AddListingFlow extends ConsumerStatefulWidget {
  const AddListingFlow({super.key});

  @override
  ConsumerState<AddListingFlow> createState() => _AddListingFlowState();
}

class _AddListingFlowState extends ConsumerState<AddListingFlow> {
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
  final _listingRef = TextEditingController();
  final _depositAmount = TextEditingController();
  final _waterDeposit = TextEditingController();
  final _electricityDeposit = TextEditingController();
  final _waterPricePerUnit = TextEditingController();

  LatLng? _pickedLocation;
  bool _submitting = false;
  String? _propertyType;
  String? _priceType;
  bool _isAvailable = true;
  bool _isPublished = false;
  bool _furnished = false;
  bool _hasBalcony = false;
  bool _hasRooftop = false;
  final List<String> _amenities = [];

  static const _propertyTypes = [
    'apartment',
    'bedsitter',
    'bungalow',
    'maisonette',
    'studio',
    'townhouse',
    'land',
    'commercial',
  ];

  static const _priceTypes = [
    'monthly',
    'sale',
    'negotiable',
  ];

  static const _amenityOptions = [
    'WiFi',
    'Parking',
    'Water 24/7',
    'Electricity',
    'Security',
    'CCTV',
    'Gym',
    'Backup Generator',
    'Balcony',
    'Rooftop',
    'Free water',
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
    _listingRef.dispose();
    _depositAmount.dispose();
    _waterDeposit.dispose();
    _electricityDeposit.dispose();
    _waterPricePerUnit.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_pickedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please tap the map to set the property location')),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      final supabase = Supabase.instance.client;
      final row = {
        'title': _title.text.trim(),
        'description': _description.text.trim().isEmpty ? null : _description.text.trim(),
        'price': double.parse(_price.text),
        'price_type': _priceType ?? 'monthly',
        'bedrooms': _bedrooms.text.isEmpty ? null : int.parse(_bedrooms.text),
        'bathrooms': _bathrooms.text.isEmpty ? null : int.parse(_bathrooms.text),
        'property_type': _propertyType ?? 'apartment',
        'county': _county.text.trim(),
        'town': _town.text.trim(),
        'area_label': null,
        'estate': _estate.text.trim().isEmpty ? null : _estate.text.trim(),
        'address': _address.text.trim().isEmpty ? null : _address.text.trim(),
        'latitude': _pickedLocation!.latitude,
        'longitude': _pickedLocation!.longitude,
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

      final prop = await supabase
          .from('properties')
          .insert(row)
          .select('id')
          .single();

      final pid = prop['id'] as String;

      if (_amenities.isNotEmpty) {
        await supabase.from('amenities').insert(
          _amenities.map((name) => {'property_id': pid, 'name': name}).toList(),
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Listing saved successfully'), backgroundColor: Colors.green),
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
        title: const Text('Add a house'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Property details',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _title,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'Marketing title *',
                      hintText: 'e.g. Modern 2BR in Kilimani',
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _price,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'Price (KSh) *',
                            hintText: '0',
                          ),
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) return 'Required';
                            if (double.tryParse(v) == null) return 'Invalid number';
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _priceType,
                          decoration: const InputDecoration(labelText: 'Price type'),
                          items: _priceTypes
                              .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                              .toList(),
                          onChanged: (v) => setState(() => _priceType = v),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _propertyType,
                    decoration: const InputDecoration(labelText: 'Property type'),
                    items: _propertyTypes
                        .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                        .toList(),
                    onChanged: (v) => setState(() => _propertyType = v),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _bedrooms,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(labelText: 'Bedrooms'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _bathrooms,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(labelText: 'Bathrooms'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _sizeSqm,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(labelText: 'Size (m²)'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    title: const Text('Furnished'),
                    value: _furnished,
                    onChanged: (v) => setState(() => _furnished = v),
                    contentPadding: EdgeInsets.zero,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Location',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _county,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(labelText: 'County *'),
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _town,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(labelText: 'Town/Area *'),
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _estate,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Estate / neighbourhood'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _address,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Full address memo'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _ownerPhone,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Owner / agent phone'),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    height: 220,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: MapTapPicker(
                        initialCenter: const LatLng(-1.286389, 36.817223),
                        initialZoom: 12,
                        onPicked: (latLng) {
                          setState(() => _pickedLocation = latLng);
                        },
                      ),
                    ),
                  ),
                  if (_pickedLocation != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: Color(0xFF22D3EE), size: 16),
                        const SizedBox(width: 6),
                        Text(
                          '${_pickedLocation!.latitude.toStringAsFixed(6)}, ${_pickedLocation!.longitude.toStringAsFixed(6)}',
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                        const Spacer(),
                        TextButton.icon(
                          onPressed: () => setState(() => _pickedLocation = null),
                          icon: const Icon(Icons.close, size: 16),
                          label: const Text('Clear'),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),
            _GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Financials & utilities',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _depositAmount,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'Deposit (KSh)',
                            hintText: '0',
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _waterPricePerUnit,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'Water price/unit (KSh)',
                            hintText: '0',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _waterDeposit,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'Water deposit (KSh)',
                            hintText: '0',
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _electricityDeposit,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'Electricity deposit (KSh)',
                            hintText: '0',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Features',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: SwitchListTile(
                          title: const Text('Balcony'),
                          value: _hasBalcony,
                          onChanged: (v) => setState(() => _hasBalcony = v),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                      Expanded(
                        child: SwitchListTile(
                          title: const Text('Rooftop access'),
                          value: _hasRooftop,
                          onChanged: (v) => setState(() => _hasRooftop = v),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Amenities',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
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
                        selectedColor: const Color(0xFFA78BFA).withValues(alpha: 0.25),
                        checkmarkColor: const Color(0xFFA78BFA),
                        backgroundColor: const Color(0xFF12151B),
                        side: BorderSide(
                          color: selected ? const Color(0xFFA78BFA) : Colors.white12,
                        ),
                        labelStyle: TextStyle(
                          color: selected ? const Color(0xFFA78BFA) : Colors.white70,
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Description',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _description,
                    maxLines: 5,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      hintText: 'Describe the property...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                SwitchListTile(
                  title: const Text('Available'),
                  value: _isAvailable,
                  onChanged: (v) => setState(() => _isAvailable = v),
                  contentPadding: EdgeInsets.zero,
                ),
                SwitchListTile(
                  title: const Text('Publish now'),
                  value: _isPublished,
                  onChanged: (v) => setState(() => _isPublished = v),
                  contentPadding: EdgeInsets.zero,
                ),
              ],
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _submitting ? null : _submit,
              icon: _submitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.cloud_upload_outlined),
              label: Text(_submitting ? 'Saving...' : 'Save listing'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF22D3EE),
                foregroundColor: const Color(0xFF0B0D10),
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => context.go('/admin/dashboard'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 48),
                side: const BorderSide(color: Colors.white12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Cancel'),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _GlassCard extends StatelessWidget {
  const _GlassCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF12151B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white12),
      ),
      child: child,
    );
  }
}
