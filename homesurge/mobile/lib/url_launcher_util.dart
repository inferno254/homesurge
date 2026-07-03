import 'package:url_launcher/url_launcher.dart';

Future<void> launchExternalUrl(Uri uri) async {
  final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!ok) {
    throw Exception('Could not launch $uri');
  }
}

