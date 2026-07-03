import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { aiVision } from '../../../lib/aiClient'
import { useToast } from '../../../components/Toast'

type Props = {
  url: string
  onQualityResult?: (result: { score: number; issues: string[] }) => void
}

export function AIImageGate({ url, onQualityResult }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ text: string } | null>(null)
  const { toast } = useToast()

  const analyze = async () => {
    if (!url) return
    setLoading(true)
    try {
      const text = await aiVision(url)
      setResult({ text })
      const scoreMatch = text.match(/rate\s+(\d)-?(\d)/i) || text.match(/rating[:\s]+(\d)/i) || text.match(/(\d)\/5/i)
      const score = scoreMatch ? Number(scoreMatch[1]) : 3
      const issues: string[] = []
      if (/\bblurry|dark|low-quality|noisy|grainy\b/i.test(text)) issues.push('Quality issue')
      if (/competitor|watermark|logo|brand/i.test(text)) issues.push('Watermark detected')
      if (/\bblurry\b/i.test(text)) issues.push('Blurry')
      if (/\bdark\b/i.test(text)) issues.push('Too dark')
      if (score < 3) issues.push('Low quality score')
      onQualityResult?.({ score, issues })
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (url) analyze()
  }, [url])

  if (!url) return null

  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-white/10">
        <img src={url} alt="" className="h-full w-full object-cover" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-400">
        {result ? (
          <span className="inline-flex items-center gap-1">
            {/watermark|competitor/i.test(result.text) ? <AlertTriangle className="h-3 w-3 text-amber-400" /> : <CheckCircle2 className="h-3 w-3 text-green-400" />}
            {result.text.slice(0, 120)}{result.text.length > 120 ? '...' : ''}
          </span>
        ) : (
          <span className="text-zinc-600">Click to analyze</span>
        )}
      </div>
      {!loading && (
        <button onClick={analyze} className="text-[10px] text-cyan-300 hover:underline">Re-analyze</button>
      )}
    </div>
  )
}
