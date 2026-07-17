import 'package:flutter/material.dart';

class SwahiliToggle extends StatelessWidget {
  const SwahiliToggle({super.key, required this.text, required this.title});

  final String text;
  final String title;

  Future<void> _translateToSwahili() async {
    // Simple inline translation placeholder - in production would call Gemini API
    // For now, just show a placeholder
    debugPrint('Would translate to Swahili: $text');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.translate, size: 16, color: Color(0xFF22D3EE)),
            const SizedBox(width: 6),
            Text(title, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          text,
          style: const TextStyle(color: Colors.white60, fontSize: 11),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        TextButton(
          onPressed: _translateToSwahili,
          style: TextButton.styleFrom(
            padding: EdgeInsets.zero,
            minimumSize: const Size(50, 20),
            textStyle: const TextStyle(fontSize: 11),
          ),
          child: const Text('Show in Swahili'),
        ),
      ],
    );
  }
}