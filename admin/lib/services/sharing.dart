import 'package:share_plus/share_plus.dart';

/// Service for sharing/exporting files
class SharingService {
  static final SharingService _instance = SharingService._internal();
  factory SharingService() => _instance;
  SharingService._internal();

  /// Share content as text
  Future<void> shareText(String text, {String subject = 'Homesurge Share'}) async {
    try {
      await SharePlus.instance.share(ShareParams(text: text, subject: subject));
    } catch (e) {
      // Silently fail on share errors
    }
  }
}