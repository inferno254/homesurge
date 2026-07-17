import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_provider.dart';
import 'app_shell.dart';
import 'screens/admin_login_screen.dart';
import 'screens/admin_dashboard_screen.dart';
import 'screens/admin_map_screen.dart';
import 'screens/admin_inquiries_screen.dart';
import 'screens/admin_activity_screen.dart';
import 'screens/admin_users_screen.dart';
import 'screens/admin_property_form_screen.dart';

enum AppRoute {
  adminLogin, adminDashboard, adminMap, addListing, editListing, adminInquiries, adminActivity, adminUsers
}

class _AuthRefresh extends ChangeNotifier {
  AuthStatus? _lastStatus;
  String? _lastUserId;

  void update(AuthStatus status, String? userId) {
    if (status != _lastStatus || userId != _lastUserId) {
      _lastStatus = status;
      _lastUserId = userId;
      notifyListeners();
    }
  }
}

final _authRefreshProvider = Provider<_AuthRefresh>((ref) {
  final refresh = _AuthRefresh();
  ref.listen<AuthStatus>(authProvider, (prev, next) {
    final userId = ref.read(authUserProvider)?.id;
    refresh.update(next, userId);
  });
  return refresh;
});

final goRouterProvider = Provider<GoRouter>((ref) {
  final refresh = ref.watch(_authRefreshProvider);

  return GoRouter(
    initialLocation: '/admin/login',
    debugLogDiagnostics: true,
    refreshListenable: refresh,
    routes: [
      ShellRoute(
        builder: (context, state, child) {
          return AppShell(location: state.uri.path, child: child);
        },
        routes: [
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
            builder: (context, state) => const AdminPropertyFormScreen(),
          ),
          GoRoute(
            path: '/admin/edit/:id',
            builder: (context, state) {
              return AdminPropertyFormScreen(listingId: state.pathParameters['id']);
            },
          ),
          GoRoute(
            path: '/admin/inquiries',
            builder: (context, state) => const AdminInquiriesScreen(),
          ),
          GoRoute(
            path: '/admin/activity',
            builder: (context, state) => const AdminActivityScreen(),
          ),
          GoRoute(
            path: '/admin/users',
            builder: (context, state) => const AdminUsersScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/admin/login',
        builder: (context, state) => const AdminLoginScreen(),
      ),
    ],
    redirect: (context, state) {
      final isAdminRoute = state.uri.path.startsWith('/admin/');
      final isLoginRoute = state.uri.path == '/admin/login';
      final user = ref.read(authUserProvider);
      final isAdmin = user?.isAdmin ?? false;
      final isPublisher = user?.isPublisher ?? false;
      final hasAccess = isAdmin || isPublisher;

      if (isAdminRoute && !hasAccess && !isLoginRoute) {
        return '/admin/login';
      }

      if (isLoginRoute && hasAccess) {
        return '/admin/dashboard';
      }

      if (isAdminRoute && hasAccess) {
        final adminOnlyRoutes = ['/admin/activity', '/admin/users'];
        if (!isAdmin && adminOnlyRoutes.any((r) => state.uri.path.startsWith(r))) {
          return '/admin/dashboard';
        }
      }

      return null;
    },
  );
});
