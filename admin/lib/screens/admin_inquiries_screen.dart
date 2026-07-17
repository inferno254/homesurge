import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class Inquiry {
  final String id;
  final String propertyId;
  final String name;
  final String phone;
  final String? message;
  final DateTime createdAt;
  final String propertyTitle;
  final String propertyRef;

  Inquiry({
    required this.id,
    required this.propertyId,
    required this.name,
    required this.phone,
    this.message,
    required this.createdAt,
    required this.propertyTitle,
    required this.propertyRef,
  });

  factory Inquiry.fromJson(Map<String, dynamic> json, Map<String, dynamic>? prop) {
    return Inquiry(
      id: json['id']?.toString() ?? '',
      propertyId: json['property_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      message: json['message']?.toString(),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
      propertyTitle: prop?['title']?.toString() ?? 'Unknown property',
      propertyRef: prop?['listing_reference']?.toString() ?? '—',
    );
  }
}

final inquiriesProvider = FutureProvider<List<Inquiry>>((ref) async {
  final supabase = Supabase.instance.client;
  try {
    final result = await supabase
        .from('property_inquiries')
        .select('*')
        .order('created_at', ascending: false);

    final inquiries = (result as List).map((e) => Map<String, dynamic>.from(e as Map))
        .toList();

    final propertyIds = inquiries.map((i) => i['property_id']).whereType<String>().toList();
    Map<String, Map<String, dynamic>> propMap = {};
    if (propertyIds.isNotEmpty) {
      final props = await supabase.from('properties').select('id, title, listing_reference').inFilter('id', propertyIds);
      for (final p in (props as List)) {
        final m = Map<String, dynamic>.from(p as Map);
        propMap[m['id']?.toString() ?? ''] = m;
      }
    }

    return inquiries.map((i) => Inquiry.fromJson(i, propMap[i['property_id']])).toList();
  } catch (e) {
    return [];
  }
});

class AdminInquiriesScreen extends ConsumerStatefulWidget {
  const AdminInquiriesScreen({super.key});

  @override
  ConsumerState<AdminInquiriesScreen> createState() => _AdminInquiriesScreenState();
}

class _AdminInquiriesScreenState extends ConsumerState<AdminInquiriesScreen> {
  String? expandedId;

  @override
  Widget build(BuildContext context) {
    final inquiriesAsync = ref.watch(inquiriesProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leads & Inquiries'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: inquiriesAsync.when(
        data: (inquiries) {
          if (inquiries.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.chat_bubble_outline, size: 64, color: const Color(0xFF22D3EE).withValues(alpha: 0.3)),
                    const SizedBox(height: 16),
                    Text('No inquiries yet', style: theme.textTheme.titleMedium?.copyWith(color: Colors.white70)),
                    const SizedBox(height: 8),
                    Text(
                      'Inquiries appear here when customers submit interest on listing detail pages.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white60),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: inquiries.length,
            itemBuilder: (context, index) {
              final inquiry = inquiries[index];
              final isOpen = expandedId == inquiry.id;
              final today = DateTime.now();
              final isToday = inquiry.createdAt.year == today.year && inquiry.createdAt.month == today.month && inquiry.createdAt.day == today.day;
              final daysAgo = today.difference(inquiry.createdAt).inDays;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF12151B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white12),
                ),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF22D3EE).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.chat_bubble_outline, color: Color(0xFF22D3EE), size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(inquiry.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                                Text(inquiry.phone, style: const TextStyle(color: Color(0xFF22D3EE), fontSize: 12)),
                              ],
                            ),
                          ),
                          Text(
                            isToday ? 'Today' : daysAgo == 1 ? 'Yesterday' : '${daysAgo}d ago',
                            style: const TextStyle(color: Colors.white60, fontSize: 11),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: () {
                              setState(() {
                                expandedId = isOpen ? null : inquiry.id;
                              });
                            },
                            icon: Icon(isOpen ? Icons.expand_less : Icons.expand_more, color: Colors.white60),
                          ),
                          IconButton(
                            onPressed: () {
                              // Call lead
                            },
                            icon: const Icon(Icons.phone, color: Colors.green),
                          ),
                        ],
                      ),
                    ),
                    if (isOpen)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: const BoxDecoration(
                          border: Border(top: BorderSide(color: Colors.white12)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Property: ${inquiry.propertyTitle}', style: const TextStyle(color: Colors.white70)),
                            Text('Ref: ${inquiry.propertyRef}', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                            if (inquiry.message != null) ...[
                              const SizedBox(height: 8),
                              Text('Message: ${inquiry.message}', style: const TextStyle(color: Colors.white70)),
                            ],
                          ],
                        ),
                      ),
                  ],
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.white60))),
      ),
    );
  }
}