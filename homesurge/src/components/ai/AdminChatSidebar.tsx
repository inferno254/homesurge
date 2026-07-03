import { useEffect, useRef, useState } from 'react'
import { MessageSquare, X, Sparkles, Send, Loader2 } from 'lucide-react'
import { aiChat } from '../../lib/aiClient'

type Msg = { role: 'user' | 'assistant'; content: string }

const QUICK_ACTIONS = [
  { label: 'Add a bedsitter in Rongai, Kware, 18k/mo', prompt: 'Add a bedsitter in Rongai, Kware area, 18000 KES monthly, furnished.' },
  { label: 'How many inquiries today?', prompt: 'How many inquiries have we received today?' },
  { label: 'Pin Maasai Lodge on map', prompt: 'Help me pin a property at Maasai Lodge, Rongai. Give me coordinates.' },
  { label: 'Show unpublised listings', prompt: 'List all unpublished properties that need review.' },
  { label: 'Draft a WhatsApp greeting', prompt: 'Draft a friendly WhatsApp greeting for a new lead inquiring about a bedsitter in Rongai.' },
]

export function AdminChatSidebar() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm your Homesurge admin assistant. I can help add listings, pin locations, check inquiries, and draft messages. Try a quick action below or type anything." },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: text.trim() }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { text: reply } = await aiChat([
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text.trim() },
      ], "This is the Homesurge admin panel for Nairobi real-estate listings. The user is an admin managing properties, inquiries, and map pins. Help them be fast and actionable.")
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${(e as Error).message}. Make sure VITE_GEMINI_API_KEY is set or deploy to Vercel with GROQ_API_KEY.` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-all ${
          open ? 'bg-zinc-800 text-white' : 'bg-gradient-to-r from-cyan-500 to-violet-500 text-trace-dusk'
        }`}
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        <span className="text-sm font-semibold">{open ? 'Close assistant' : 'AI Assistant'}</span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[360px] max-h-[520px] flex flex-col rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 p-3">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            <p className="text-sm font-semibold text-white">Admin assistant</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user' ? 'bg-cyan-500/20 text-cyan-100' : 'bg-white/5 text-zinc-200'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-zinc-400 inline-flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/10 p-2">
            <div className="flex flex-wrap gap-1 mb-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => send(a.prompt)}
                  className="text-[10px] rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder="Ask anything..."
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-400 focus:outline-none"
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-2 text-trace-dusk disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}