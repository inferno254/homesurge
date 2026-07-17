import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnv {
  static String? get publicPhone => dotenv.env['VITE_HOMESURGE_PUBLIC_PHONE'];
  static String? get whatsappUrl => dotenv.env['VITE_HOMESURGE_WHATSAPP_URL'];
  static bool get hasPublicPhone => publicPhone != null && publicPhone!.isNotEmpty;
  static bool get hasWhatsApp => whatsappUrl != null && whatsappUrl!.isNotEmpty && whatsappUrl != '#';
}
