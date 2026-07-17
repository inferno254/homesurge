import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

enum AuthStatus { unknown, loading, authenticated, unauthenticated }

class AuthUser {
  final String id;
  final String? email;
  final String? fullName;
  final String role;

  const AuthUser({required this.id, this.email, this.fullName, this.role = 'customer'});

  bool get isAdmin => role.toLowerCase() == 'admin';
  bool get isPublisher => role.toLowerCase() == 'publisher';
}

class AuthNotifier extends Notifier<AuthStatus> {
  AuthUser? _user;

  @override
  AuthStatus build() {
    final supabase = Supabase.instance.client;
    final session = supabase.auth.currentSession;
    _user = _extractUser(session);
    _listenToAuthChanges();
    return session != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
  }

  AuthUser? _extractUser(Session? session) {
    if (session == null) return null;
    final userId = session.user.id;
    final email = session.user.email;
    final metadata = session.user.userMetadata;
    final role = (metadata?['role'] as String?)?.toLowerCase() ?? 'customer';
    return AuthUser(id: userId, email: email, role: role);
  }

  void _listenToAuthChanges() {
    final supabase = Supabase.instance.client;
    supabase.auth.onAuthStateChange.listen((data) {
      final isAuthed = data.session != null;
      if (isAuthed && state != AuthStatus.authenticated) {
        _user = _extractUser(data.session);
        _fetchProfile(data.session!.user.id);
        state = AuthStatus.authenticated;
      } else if (!isAuthed && state != AuthStatus.unauthenticated) {
        _user = null;
        state = AuthStatus.unauthenticated;
      }
    });
  }

  Future<void> _fetchProfile(String userId) async {
    try {
      final supabase = Supabase.instance.client;
      final result = await supabase
          .from('profiles')
          .select('role, email, full_name')
          .eq('id', userId)
          .maybeSingle();
      if (result != null) {
        final role = (result['role'] as String?)?.toLowerCase() ?? 'customer';
        final email = result['email'] as String?;
        final fullName = result['full_name'] as String?;
        _user = AuthUser(id: userId, email: email ?? _user?.email, fullName: fullName, role: role);
      }
    } catch (e) {
      // Keep existing user data if profile fetch fails
    }
  }

  AuthUser? get user => _user;

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    state = AuthStatus.loading;
    try {
      final supabase = Supabase.instance.client;
      final result = await supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
      _user = _extractUser(result.session);
      if (result.session != null) {
        await _fetchProfile(result.session!.user.id);
      }
      state = result.session != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    } catch (e) {
      _user = null;
      state = AuthStatus.unauthenticated;
      rethrow;
    }
  }

  Future<void> signUp({
    required String email,
    required String password,
  }) async {
    state = AuthStatus.loading;
    try {
      final supabase = Supabase.instance.client;
      final result = await supabase.auth.signUp(
        email: email,
        password: password,
      );
      _user = _extractUser(result.session);
      if (result.session != null) {
        await _fetchProfile(result.session!.user.id);
      }
      state = result.session != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    } catch (e) {
      _user = null;
      state = AuthStatus.unauthenticated;
      rethrow;
    }
  }

  Future<void> resetPassword(String email) async {
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.resetPasswordForEmail(email);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signInWithGoogle() async {
    state = AuthStatus.loading;
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'homesurge://login',
      );
    } catch (e) {
      _user = null;
      state = AuthStatus.unauthenticated;
      rethrow;
    }
  }

  Future<void> signOut() async {
    state = AuthStatus.loading;
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.signOut();
      _user = null;
      state = AuthStatus.unauthenticated;
    } catch (e) {
      _user = null;
      state = AuthStatus.unauthenticated;
      rethrow;
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthStatus>(AuthNotifier.new);
final authUserProvider = Provider<AuthUser?>((ref) {
  final auth = ref.watch(authProvider.notifier);
  return auth.user;
});
