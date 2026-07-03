import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_provider.dart';
import 'app_shell.dart';
import 'map_add_listing_flow.dart';
import 'screens/admin_login_screen.dart';
import 'screens/admin_dashboard_screen.dart';
import 'screens/admin_map_screen.dart';
import 'screens/browse_screen.dart';
import 'screens/compare_screen.dart';
import 'screens/detail_screen.dart';
import 'screens/home_screen.dart';
import 'screens/saved_screen.dart';

enum AppRoute { home, browse, saved, compare, detail, addListing, adminLogin, adminDashboard, adminMap }

final goRouterProvider = Provider<GoRouter>((ref) {
  final authStatus = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      ShellRoute(
        builder: (context, state, child) {
          return AppShell(location: state.uri.path, child: child);
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/browse',
            builder: (context, state) => const BrowseScreen(),
          ),
          GoRoute(
            path: '/saved',
            builder: (context, state) => const SavedScreen(),
          ),
          GoRoute(
            path: '/compare',
            builder: (context, state) => const CompareScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/listing/:id',
        builder: (context, state) {
          return DetailScreen(listingId: state.pathParameters['id'] ?? '');
        },
      ),
      GoRoute(
        path: '/admin/login',
        builder: (context, state) => const AdminLoginScreen(),
      ),
      GoRoute(
        path: '/admin/dashboard',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/admin/map',
        builder: (context, state) => const AdminMapScreen(),
      ),
      GoRoute(
        path: '/admin/new',
        builder: (context, state) => const AddListingFlow(),
      ),
    ],
    redirect: (context, state) {
      final isAdminRoute = state.uri.path.startsWith('/admin/');
      final isAuthenticated = authStatus == AuthStatus.authenticated;

      if (isAdminRoute && !isAuthenticated && state.uri.path != '/admin/login') {
        return '/admin/login';
      }

      if (state.uri.path == '/admin/login' && isAuthenticated) {
        return '/admin/dashboard';
      }

      return null;
    },
  );
});
