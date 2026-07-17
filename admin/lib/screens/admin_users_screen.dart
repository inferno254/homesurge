import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final adminUsersProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  try {
    final result = await supabase
        .from('profiles')
        .select()
        .order('created_at', ascending: false);
    return (result as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  } catch (e) {
    return [];
  }
});

Color _roleChipColor(String role) {
  switch (role) {
    case 'admin':
      return const Color(0xFF22D3EE).withValues(alpha: 0.2);
    case 'publisher':
      return const Color(0xFFA78BFA).withValues(alpha: 0.2);
    default:
      return Colors.white.withValues(alpha: 0.1);
  }
}

Color _roleTextColor(String role) {
  switch (role) {
    case 'admin':
      return const Color(0xFF22D3EE);
    case 'publisher':
      return const Color(0xFFA78BFA);
    default:
      return Colors.white60;
  }
}

class AdminUsersScreen extends ConsumerWidget {
  const AdminUsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usersAsync = ref.watch(adminUsersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Users'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(adminUsersProvider.future),
        child: usersAsync.when(
          data: (users) {
            if (users.isEmpty) {
              return const Center(
                child: Text(
                  'No users found.',
                  style: TextStyle(color: Colors.white60),
                ),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: users.length,
              itemBuilder: (context, index) {
                final user = users[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListTile(
                    tileColor: const Color(0xFF12151B),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      user['full_name']?.toString() ?? '—',
                      style: const TextStyle(color: Colors.white),
                    ),
                    subtitle: Text(
                      user['email']?.toString() ?? user['id']?.toString() ?? '—',
                      style: const TextStyle(color: Colors.white60, fontSize: 11),
                    ),
                    trailing: PopupMenuButton<String>(
                      initialValue: (user['role']?.toString() ?? 'customer').toLowerCase(),
                      onSelected: (role) async {
                        final currentRole = (user['role']?.toString() ?? 'customer').toLowerCase();
                        if (role == currentRole) return;
                        try {
                          await Supabase.instance.client
                              .from('profiles')
                              .update({'role': role})
                              .eq('id', user['id']);
                          ref.refresh(adminUsersProvider);
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Failed to update role: $e')),
                            );
                          }
                        }
                      },
                      itemBuilder: (ctx) => const [
                        PopupMenuItem(value: 'customer', child: Text('Customer')),
                        PopupMenuItem(value: 'publisher', child: Text('Publisher')),
                        PopupMenuItem(value: 'admin', child: Text('Admin')),
                      ],
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: _roleChipColor((user['role']?.toString() ?? 'customer').toLowerCase()),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              (user['role']?.toString() ?? 'customer').toLowerCase(),
                              style: TextStyle(
                                color: _roleTextColor((user['role']?.toString() ?? 'customer').toLowerCase()),
                                fontSize: 11,
                              ),
                            ),
                            const Icon(Icons.arrow_drop_down, size: 14),
                          ],
                        ),
                      ),
                    ),
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
}