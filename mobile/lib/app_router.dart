import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_shell.dart';
import 'screens/add_listing_screen.dart';
import 'screens/admin_redirect_screen.dart';
import 'screens/browse_screen.dart';
import 'screens/compare_screen.dart';
import 'screens/customer_login_screen.dart';
import 'screens/detail_screen.dart';
import 'screens/home_screen.dart';
import 'screens/saved_screen.dart';
import 'screens/recently_viewed_screen.dart';
import 'screens/users_screen.dart';
import '../providers/auth_provider.dart';

enum AppRoute {
  home, browse, saved, compare, detail, recent
}

final goRouterProvider = Provider<GoRouter>((ref) {
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
          GoRoute(
            path: '/recent',
            builder: (context, state) => const RecentlyViewedScreen(),
          ),
          GoRoute(
            path: '/users',
            builder: (context, state) => const UsersScreen(),
          ),
          GoRoute(
            path: '/add-listing',
            builder: (context, state) => const AddListingScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const CustomerLoginScreen(),
      ),
      GoRoute(
        path: '/admin-required',
        builder: (context, state) => const AdminRedirectScreen(),
      ),
      GoRoute(
        path: '/listing/:id',
        builder: (context, state) {
          return DetailScreen(listingId: state.pathParameters['id'] ?? '');
        },
      ),
    ],
    redirect: (context, state) {
      final user = ref.read(authUserProvider);
      final isAdmin = user?.isAdmin ?? false;
      final isPublisher = user?.isPublisher ?? false;
      final isAuthRoute = state.uri.path == '/login';
      final isAuthenticated = user != null;

      if (isAuthenticated && isAuthRoute) {
        return isPublisher ? '/users' : '/';
      }

      if (isAdmin && !isAuthRoute && state.uri.path != '/admin-required') {
        return '/admin-required';
      }

      if (state.uri.path.startsWith('/users') && !isPublisher) {
        return '/';
      }

      if (state.uri.path.startsWith('/add-listing') && !isPublisher) {
        return '/';
      }

      return null;
    },
  );
});
