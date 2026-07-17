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

  int _currentIndex(String location, bool showUsersTab) {
    if (location.startsWith('/browse')) return 1;
    if (location.startsWith('/saved')) return 2;
    if (location.startsWith('/compare')) return 3;
    if (location.startsWith('/recent')) return 4;
    if (showUsersTab && location.startsWith('/users')) return 5;
    return 0;
  }

  void _navigate(BuildContext context, int index, bool showUsersTab) {
    switch (index) {
      case 0:
        context.go('/');
        break;
      case 1:
        context.go('/browse');
        break;
      case 2:
        context.go('/saved');
        break;
      case 3:
        context.go('/compare');
        break;
      case 4:
        context.go('/recent');
        break;
      case 5:
        if (showUsersTab) context.go('/users');
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authUserProvider);
    final showUsersTab = user?.isPublisher ?? false;
    final isAuthed = user != null;

    final index = _currentIndex(location, showUsersTab);

    return Scaffold(
      body: Stack(
        children: [
          const _BackgroundGrid(),
          SafeArea(child: child),
        ],
      ),
      floatingActionButton: showUsersTab && location != '/add-listing'
          ? FloatingActionButton.extended(
              onPressed: () => context.go('/add-listing'),
              backgroundColor: const Color(0xFF22D3EE),
              label: const Text('Add Listing', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              icon: const Icon(Icons.add, color: Colors.white),
            )
          : null,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text('Homesurge', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF22D3EE))),
        actions: [
          if (!isAuthed)
            TextButton.icon(
              onPressed: () => context.push('/login'),
              icon: const Icon(Icons.login_rounded, size: 18),
              label: const Text('Sign in'),
            )
          else
            IconButton(
              onPressed: () async {
                final auth = ref.read(authProvider.notifier);
                await auth.signOut();
              },
              icon: const Icon(Icons.logout_rounded),
              tooltip: 'Sign out',
            ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => _navigate(context, value, showUsersTab),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        backgroundColor: const Color(0xFF0B0D10),
        indicatorColor: const Color(0xFF22D3EE).withValues(alpha: 0.16),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore),
            label: 'Home',
          ),
          const NavigationDestination(
            icon: Icon(Icons.grid_view_outlined),
            selectedIcon: Icon(Icons.grid_view),
            label: 'Browse',
          ),
          const NavigationDestination(
            icon: Icon(Icons.favorite_border),
            selectedIcon: Icon(Icons.favorite),
            label: 'Saved',
          ),
          const NavigationDestination(
            icon: Icon(Icons.compare_arrows),
            selectedIcon: Icon(Icons.compare_arrows),
            label: 'Compare',
          ),
          const NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history),
            label: 'Recent',
          ),
          if (showUsersTab)
            const NavigationDestination(
              icon: Icon(Icons.person_outlined),
              selectedIcon: Icon(Icons.person),
              label: 'Users',
            ),
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
