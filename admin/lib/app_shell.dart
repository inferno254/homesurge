import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_provider.dart';

class AppShell extends ConsumerWidget {
  const AppShell({
    super.key,
    required this.child,
    required this.location,
  });

  final Widget child;
  final String location;

  int _currentIndex(String location, bool isAdmin) {
    if (!isAdmin) return 0;
    if (location.startsWith('/admin/dashboard')) return 0;
    if (location.startsWith('/admin/map')) return 1;
    if (location.startsWith('/admin/new') || location.startsWith('/admin/edit')) return 2;
    if (location.startsWith('/admin/inquiries')) return 3;
    if (location.startsWith('/admin/activity')) return 4;
    if (location.startsWith('/admin/users')) return 5;
    return 0;
  }

  void _navigate(BuildContext context, int index, bool isAdmin) {
    switch (index) {
      case 0:
        context.go('/admin/dashboard');
        break;
      case 1:
        context.go('/admin/map');
        break;
      case 2:
        context.go('/admin/new');
        break;
      case 3:
        context.go('/admin/inquiries');
        break;
      case 4:
        if (isAdmin) context.go('/admin/activity');
        break;
      case 5:
        if (isAdmin) context.go('/admin/users');
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = ref.watch(authUserProvider);
    final isAdmin = user?.isAdmin ?? false;

    final index = _currentIndex(location, isAdmin);

    return Scaffold(
      body: Stack(
        children: [
          const _BackgroundGrid(),
          SafeArea(child: child),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => _navigate(context, value, isAdmin),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        backgroundColor: const Color(0xFF0B0D10),
        indicatorColor: const Color(0xFF22D3EE).withValues(alpha: 0.16),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          const NavigationDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map),
            label: 'Map',
          ),
          const NavigationDestination(
            icon: Icon(Icons.add_home_outlined),
            selectedIcon: Icon(Icons.add_home),
            label: 'Properties',
          ),
          const NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline_outlined),
            selectedIcon: Icon(Icons.chat_bubble_outline),
            label: 'Inquiries',
          ),
          if (isAdmin) ...[
            const NavigationDestination(
              icon: Icon(Icons.history_outlined),
              selectedIcon: Icon(Icons.history),
              label: 'Activity',
            ),
            const NavigationDestination(
              icon: Icon(Icons.people_outlined),
              selectedIcon: Icon(Icons.people),
              label: 'Users',
            ),
          ],
        ],
      ),
    );
  }
}

class _BackgroundGrid extends StatelessWidget {
  const _BackgroundGrid();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
        size: Size.infinite,
        painter: _GridPainter(),
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.035)
      ..strokeWidth = 0.7;

    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _GridPainter oldDelegate) => false;
}
