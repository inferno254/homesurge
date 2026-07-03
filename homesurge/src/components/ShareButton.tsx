import { Share2, Check, Copy } from 'lucide-react'
import { useState } from 'react'

type Props = {
  url: string
  title: string
}

export function ShareButton({ url, title }: Props) {
  const [copied, setCopied] = useState(false)
  const fullUrl = `${window.location.origin}${url}`

  const shareViaWA = () => {
    const text = `*${title}*\n\nCheck this listing on homesurge:\n${fullUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); shareViaWA() }}
        className="btn-ghost rounded-xl px-3 py-2 text-xs"
      >
        <Share2 className="h-3.5 w-3.5" />
        WhatsApp
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyLink() }}
        className={`btn-ghost rounded-xl px-3 py-2 text-xs ${copied ? 'text-emerald-400' : ''}`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}

