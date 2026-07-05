import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final adminActivityProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  try {
    final result = await supabase
        .from('admin_activity_log')
        .select()
        .order('created_at', ascending: false);
    return (result as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  } catch (e) {
    return [];
  }
});

class AdminActivityScreen extends ConsumerWidget {
  const AdminActivityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activityAsync = ref.watch(adminActivityProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity Log'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminActivityProvider.future),
        child: activityAsync.when(
          data: (activities) {
            if (activities.isEmpty) {
              return const Center(
                child: Text(
                  'No activity recorded yet.',
                  style: TextStyle(color: Colors.white60),
                ),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: activities.length,
              itemBuilder: (context, index) {
                final activity = activities[index];
                final action = activity['action']?.toString() ?? 'Unknown';
                final timestamp = DateTime.tryParse(activity['created_at']?.toString() ?? '');
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF12151B),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          _buildActionBadge(action),
                          const SizedBox(width: 12),
                          Text(
                            _formatTimeAgo(timestamp),
                            style: const TextStyle(color: Colors.white60, fontSize: 12),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Ref: ${activity["property_ref"] ?? "—"}',
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ],
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.red))),
        ),
      ),
    );
  }

  Widget _buildActionBadge(String action) {
    Color backColor;
    Color textColor;
    
    switch (action) {
      case 'CREATE':
        backColor = Colors.green.withValues(alpha: 0.2);
        textColor = Colors.green;
        break;
      case 'UPDATE':
        backColor = Colors.blue.withValues(alpha: 0.2);
        textColor = Colors.blue;
        break;
      case 'DELETE':
        backColor = Colors.red.withValues(alpha: 0.2);
        textColor = Colors.red;
        break;
      case 'PUBLISH':
        backColor = const Color(0xFF4ADE80).withValues(alpha: 0.2);
        textColor = const Color(0xFF4ADE80);
        break;
      case 'UNPUBLISH':
        backColor = Colors.amber.withValues(alpha: 0.2);
        textColor = Colors.amber;
        break;
      default:
        backColor = Colors.white.withValues(alpha: 0.2);
        textColor = Colors.white;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        action,
        style: TextStyle(color: textColor, fontSize: 10, fontWeight: FontWeight.w600),
      ),
    );
  }

  String _formatTimeAgo(DateTime? timestamp) {
    if (timestamp == null) return '—';
    final now = DateTime.now();
    final diff = now.difference(timestamp);
    
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}