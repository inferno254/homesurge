import { GitCompare, Check } from 'lucide-react'

type Props = {
  id: string
  isSelected: boolean
  onToggle: (id: string) => 'limit' | null
}

export function CompareButton({ id, isSelected, onToggle }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const result = onToggle(id)
    if (result === 'limit') {
      const el = document.getElementById('compare-bar')
      el?.classList.add('ring-2', 'ring-amber-400/50')
      setTimeout(() => el?.classList.remove('ring-2', 'ring-amber-400/50'), 1200)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
        isSelected
          ? 'bg-trace-violet/10 text-trace-violet border border-trace-violet/30'
          : 'text-zinc-500 hover:text-zinc-300 border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]'
      }`}
      title={isSelected ? 'Remove from compare' : 'Add to compare'}
    >
      {isSelected ? <Check className="h-3.5 w-3.5" /> : <GitCompare className="h-3.5 w-3.5" />}
      {isSelected ? 'Comparing' : 'Compare'}
    </button>
  )
}
