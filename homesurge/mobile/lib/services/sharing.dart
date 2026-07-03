import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/property.dart';

Future<void> shareProperty(BuildContext context, Property property) async {
  final text = '${property.title}\n${property.displayPrice}\n${property.displayLocation}\n\nView on Homesurge';
  await SharePlus.instance.share(ShareParams(text: text, subject: property.title));
}

Future<void> openWhatsApp(Property property, String phone) async {
  final message = 'Hi, I am interested in ${property.title} (${property.listingReference ?? property.id}).';
  final uri = Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(message)}');
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  } else {
    throw Exception('Could not open WhatsApp');
  }
}

Future<void> callPhone(String phone) async {
  final uri = Uri(scheme: 'tel', path: phone);
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri);
  } else {
    throw Exception('Could not launch phone');
  }
}
