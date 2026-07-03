import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

enum AuthStatus { unknown, loading, authenticated, unauthenticated }

class AuthNotifier extends Notifier<AuthStatus> {
  @override
  AuthStatus build() {
    final supabase = Supabase.instance.client;
    final session = supabase.auth.currentSession;
    _listenToAuthChanges();
    return session != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
  }

  void _listenToAuthChanges() {
    final supabase = Supabase.instance.client;
    supabase.auth.onAuthStateChange.listen((data) {
      final isAuthed = data.session != null;
      if (isAuthed && state != AuthStatus.authenticated) {
        state = AuthStatus.authenticated;
      } else if (!isAuthed && state != AuthStatus.unauthenticated) {
        state = AuthStatus.unauthenticated;
      }
    });
  }

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
      state = result.session != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    } catch (e) {
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
      await supabase.auth.signUp(
        email: email,
        password: password,
      );
      state = AuthStatus.authenticated;
    } catch (e) {
      state = AuthStatus.unauthenticated;
      rethrow;
    }
  }

  Future<void> signOut() async {
    state = AuthStatus.loading;
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.signOut();
      state = AuthStatus.unauthenticated;
    } catch (e) {
      state = AuthStatus.unauthenticated;
      rethrow;
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthStatus>(AuthNotifier.new);
