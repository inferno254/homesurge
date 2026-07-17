import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_router.dart';
import 'theme.dart';
import 'main.dart';

class HomesurgeApp extends ConsumerWidget {
  const HomesurgeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);

    return DeepLinkListener(
      child: MaterialApp.router(
        debugShowCheckedModeBanner: false,
        theme: buildhomesurgeTheme(),
        routerConfig: router,
      ),
    );
  }
}
