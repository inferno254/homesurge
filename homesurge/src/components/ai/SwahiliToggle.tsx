import { useState } from 'react'
import { Languages } from 'lucide-react'
import { aiTranslate } from '../../lib/aiClient'

type Props = {
  text: string
  title?: string
}

export function SwahiliToggle({ text, title }: Props) {
  const [swahili, setSwahili] = useState('')
  const [loading, setLoading] = useState(false)

  const translate = async () => {
    if (swahili) {
      setSwahili('')
      return
    }
    setLoading(true)
    try {
      const t = await aiTranslate(text, 'Swahili')
      setSwahili(t)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!text) return null

  return (
    <div className="mt-4">
      <button
        onClick={translate}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
      >
        <Languages className="h-3 w-3" />
        {swahili ? 'Show English' : 'Translate to Swahili'}
      </button>
      {loading && <p className="text-xs text-zinc-500 mt-1">Translating...</p>}
      {swahili && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
          {title && <h4 className="text-xs font-semibold text-zinc-400 mb-1">{title}</h4>}
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{swahili}</p>
        </div>
      )}
    </div>
  )
}
