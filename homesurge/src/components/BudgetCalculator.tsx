import { useState } from 'react'
import { Calculator, X } from 'lucide-react'

type Props = {
  onClose?: () => void
  compact?: boolean
}

export function BudgetCalculator({ onClose, compact }: Props) {
  const [income, setIncome] = useState('')
  const [deposit, setDeposit] = useState('')
  const [utilities, setUtilities] = useState('')
  const [result, setResult] = useState<{
    maxRent: number
    safeRent: number
    depositAmount: number
    monthlyTotal: number
  } | null>(null)

  const calculate = () => {
    const inc = Number(income) || 0
    const dep = Number(deposit) || 0
    const util = Number(utilities) || 0

    setResult({
      maxRent: Math.round(inc * 0.5),
      safeRent: Math.round(inc * 0.3),
      depositAmount: dep > 0 ? dep : Math.round(inc * 0.3 * 2),
      monthlyTotal: Math.round(inc * 0.3 + util),
    })
  }

  const content = (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-white">Rent budget calculator</h3>
          {onClose && (
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Monthly income (KSh)</label>
          <input
            type="number"
            className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white"
            placeholder="e.g. 150000"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Deposit saved (KSh)</label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white"
              placeholder="Optional"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Monthly utilities (KSh)</label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white"
              placeholder="Estimate"
              value={utilities}
              onChange={(e) => setUtilities(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={calculate}
          disabled={!income}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-2 text-xs font-bold text-trace-dusk disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Calculate
        </button>
      </div>

      {result && (
        <div className="space-y-2 border-t border-white/10 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Safe rent (30% rule)</span>
            <span className="font-semibold text-green-400">KSh {result.safeRent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Maximum rent (50% rule)</span>
            <span className="font-semibold text-amber-300">KSh {result.maxRent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Estimated deposit needed</span>
            <span className="font-medium text-white">KSh {result.depositAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-white/10 pt-2">
            <span className="text-zinc-300 font-medium">Est. monthly total</span>
            <span className="font-bold text-cyan-300">KSh {result.monthlyTotal.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )

  if (compact) {
    return (
      <div className="glass-card p-4">
        {content}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-cyan-400" />
          {content}
        </div>
      </div>
    </div>
  )
}
