import { Heart } from 'lucide-react'

type Props = {
  id: string
  isFavorite: boolean
  onToggle: (id: string) => void
  compact?: boolean
}

export function SaveButton({ id, isFavorite, onToggle, compact }: Props) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(id) }}
      className={`flex items-center justify-center transition-all duration-200 ${
        isFavorite
          ? 'text-rose-400'
          : 'text-zinc-600 hover:text-rose-400'
      } ${compact ? 'h-8 w-8 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-rose-400/30' : 'gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border border-white/[0.08] bg-white/[0.03]'}`}
      title={isFavorite ? 'Remove from saved' : 'Save listing'}
    >
      <Heart className={isFavorite ? 'h-4 w-4 fill-rose-400' : 'h-4 w-4'} />
      {!compact && (isFavorite ? 'Saved' : 'Save')}
    </button>
  )
}
