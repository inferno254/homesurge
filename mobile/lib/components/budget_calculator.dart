import 'package:flutter/material.dart';

/// Flutter port of the React `BudgetCalculator` modal.
void showBudgetCalculator(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const BudgetCalculator(),
  );
}

class BudgetCalculator extends StatefulWidget {
  const BudgetCalculator({super.key});

  @override
  State<BudgetCalculator> createState() => _BudgetCalculatorState();
}

class _BudgetCalculatorState extends State<BudgetCalculator> {
  final _income = TextEditingController();
  final _deposit = TextEditingController();
  final _utilities = TextEditingController();

  @override
  void dispose() {
    _income.dispose();
    _deposit.dispose();
    _utilities.dispose();
    super.dispose();
  }

  void _calculate() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final inc = double.tryParse(_income.text) ?? 0;
    final dep = double.tryParse(_deposit.text) ?? 0;
    final util = double.tryParse(_utilities.text) ?? 0;

    final maxRent = (inc * 0.5).round();
    final safeRent = (inc * 0.3).round();
    final depositAmount = dep > 0 ? dep.round() : (inc * 0.3 * 2).round();
    final monthlyTotal = (inc * 0.3 + util).round();

    return Container(
      margin: const EdgeInsets.all(16),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFF12151B),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        boxShadow: const [
          BoxShadow(color: Color(0x40000000), blurRadius: 40, offset: Offset(0, 20)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.calculate_outlined, size: 20, color: Color(0xFF22D3EE)),
              const SizedBox(width: 8),
              const Text(
                'Rent budget calculator',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close, color: Color(0xFF64748B)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _Field(
            label: 'Monthly income (KSh)',
            hint: 'e.g. 150000',
            controller: _income,
            onChanged: (_) => _calculate(),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _Field(
                  label: 'Deposit saved (KSh)',
                  hint: 'Optional',
                  controller: _deposit,
                  onChanged: (_) => _calculate(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _Field(
                  label: 'Monthly utilities (KSh)',
                  hint: 'Estimate',
                  controller: _utilities,
                  onChanged: (_) => _calculate(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF22D3EE), Color(0xFFA78BFA)],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: ElevatedButton(
                onPressed: inc > 0 ? _calculate : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  foregroundColor: const Color(0xFF0B0D10),
                  disabledForegroundColor: const Color(0xFF0B0D10).withValues(alpha: 0.5),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Calculate', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ),
          ),
          if (inc > 0) ...[
            const SizedBox(height: 16),
            const Divider(color: Colors.white10),
            const SizedBox(height: 8),
            _ResultRow(label: 'Safe rent (30% rule)', value: 'KSh ${safeRent.toString()}', color: const Color(0xFF4ADE80)),
            const SizedBox(height: 8),
            _ResultRow(label: 'Maximum rent (50% rule)', value: 'KSh ${maxRent.toString()}', color: const Color(0xFFFBBF24)),
            const SizedBox(height: 8),
            _ResultRow(label: 'Estimated deposit needed', value: 'KSh ${depositAmount.toString()}', color: Colors.white),
            const SizedBox(height: 8),
            _ResultRow(label: 'Est. monthly total', value: 'KSh ${monthlyTotal.toString()}', color: const Color(0xFF22D3EE)),
          ],
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.hint, required this.controller, required this.onChanged});
  final String label;
  final String hint;
  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          onChanged: onChanged,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Color(0xFF64748B)),
            filled: true,
            fillColor: Colors.black.withValues(alpha: 0.35),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.white10),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.white10),
            ),
          ),
        ),
      ],
    );
  }
}

class _ResultRow extends StatelessWidget {
  const _ResultRow({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13)),
      ],
    );
  }
}
