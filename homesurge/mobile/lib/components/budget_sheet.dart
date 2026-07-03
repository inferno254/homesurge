import 'package:flutter/material.dart';

class BudgetSheet extends StatefulWidget {
  const BudgetSheet({super.key, this.monthlyRent = 0});

  final double monthlyRent;

  @override
  State<BudgetSheet> createState() => _BudgetSheetState();
}

class _BudgetSheetState extends State<BudgetSheet> {
  final _incomeController = TextEditingController();
  bool _includeRent = true;

  @override
  void dispose() {
    _incomeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final income = double.tryParse(_incomeController.text) ?? 0;
    final safeRent = income * 0.3;
    final maxRent = income * 0.5;
    final deposit = widget.monthlyRent;
    final monthlyTotal = _includeRent ? widget.monthlyRent : 0;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        top: 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Budget calculator',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, color: Colors.white),
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close, color: Colors.white60),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _incomeController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Monthly net income (KSh)',
              hintText: 'e.g. 100000',
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          if (widget.monthlyRent > 0)
            SwitchListTile(
              title: const Text('Include this listing\'s rent'),
              subtitle: Text('KSh ${widget.monthlyRent.toStringAsFixed(0)}/mo'),
              value: _includeRent,
              onChanged: (v) => setState(() => _includeRent = v),
              contentPadding: EdgeInsets.zero,
            ),
          const SizedBox(height: 16),
          _ResultRow(label: 'Safe rent (30% rule)', value: 'KSh ${safeRent.toStringAsFixed(0)}', color: const Color(0xFF4ADE80)),
          const SizedBox(height: 8),
          _ResultRow(label: 'Max rent (50% rule)', value: 'KSh ${maxRent.toStringAsFixed(0)}', color: const Color(0xFFFBBF24)),
          const SizedBox(height: 8),
          _ResultRow(label: 'Estimated deposit', value: 'KSh ${deposit.toStringAsFixed(0)}', color: const Color(0xFFA78BFA)),
          const SizedBox(height: 8),
          _ResultRow(label: 'Monthly total', value: 'KSh ${monthlyTotal.toStringAsFixed(0)}', color: Colors.white),
          const SizedBox(height: 24),
        ],
      ),
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
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF12151B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        children: [
          Expanded(child: Text(label, style: const TextStyle(color: Colors.white60))),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 16)),
        ],
      ),
    );
  }
}
