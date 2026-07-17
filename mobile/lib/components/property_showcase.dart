import 'package:flutter/material.dart';

/// Flutter port of the React `PropertyShowcase` hero visual:
/// three coloured "houses" that rise, hold, then fall on a loop.
class PropertyShowcase extends StatefulWidget {
  const PropertyShowcase({super.key});

  @override
  State<PropertyShowcase> createState() => _PropertyShowcaseState();
}

class _PropertyShowcaseState extends State<PropertyShowcase>
    with SingleTickerProviderStateMixin {
  static const _cycle = 5;
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: _cycle),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final houses = [
      const _HouseColors(top: Color(0xFF22D3EE), mid: Color(0xFF67E8F9), base: Color(0xFF0E7490)),
      const _HouseColors(top: Color(0xFFA78BFA), mid: Color(0xFFC4B5FD), base: Color(0xFF6D28D9)),
      const _HouseColors(top: Color(0xFFFBBF24), mid: Color(0xFFFCD34D), base: Color(0xFFB45309)),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        return SizedBox(
          height: 280,
          child: Stack(
            alignment: Alignment.center,
            children: [
              for (var i = 0; i < houses.length; i++)
                AnimatedBuilder(
                  animation: _controller,
                  builder: (context, _) {
                    final start = i * (_cycle / 3) / _cycle;
                    final p = ((_controller.value - start) % 1 + 1) % 1;
                    final (offsetY, opacity) = _housePhase(p);
                    return Positioned(
                      left: i == 0 ? constraints.maxWidth / 2 - 150 : i == 2 ? constraints.maxWidth / 2 + 20 : constraints.maxWidth / 2 - 65,
                      child: Opacity(
                        opacity: opacity,
                        child: Transform.translate(
                          offset: Offset(0, offsetY),
                          child: _House(colors: houses[i]),
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  /// Mirrors the React framer-motion timing: rise from -60 to 0, hold, fall back.
  (double, double) _housePhase(double p) {
    if (p < 0.1) {
      final t = p / 0.1;
      return (-60 + 60 * t, t);
    } else if (p < 0.9) {
      return (0.0, 1.0);
    } else {
      final t = (p - 0.9) / 0.1;
      return (-60 * t, 1 - t);
    }
  }
}

class _HouseColors {
  const _HouseColors({required this.top, required this.mid, required this.base});
  final Color top;
  final Color mid;
  final Color base;
}

class _House extends StatelessWidget {
  const _House({required this.colors});
  final _HouseColors colors;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipPath(
          clipper: _TriangleClipper(),
          child: Container(
            width: 128,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [colors.top, colors.mid],
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: 128,
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.04),
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(8),
              bottomRight: Radius.circular(8),
            ),
            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
          ),
          child: Column(
            children: [
              for (var r = 0; r < 3; r++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      for (var b = 0; b < 3; b++)
                        Container(
                          width: 32,
                          height: 16,
                          margin: const EdgeInsets.symmetric(horizontal: 1),
                          decoration: BoxDecoration(
                            color: colors.mid.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: 128,
          height: 10,
          decoration: BoxDecoration(
            color: colors.base,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 8),
        Icon(Icons.home, color: colors.mid.withValues(alpha: 0.6), size: 18),
      ],
    );
  }
}

class _TriangleClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    return Path()
      ..moveTo(0, size.height)
      ..lineTo(size.width / 2, 0)
      ..lineTo(size.width, size.height)
      ..close();
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}
