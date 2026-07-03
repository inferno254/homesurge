import { useEffect, useRef, useState } from 'react'
import { MessageSquare, X, Send, Loader2, Home } from 'lucide-react'
import { aiChat } from '../../lib/aiClient'
import { supabase } from '../../lib/supabase'
import { fetchPublicProperties } from '../../lib/supabaseApi'

type Msg = { role: 'user' | 'assistant'; content?: string; listings?: unknown[] }

export function CustomerChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "👋 Hi! I'm the Homesurge assistant. Find me a home, ask about an area, or get a WhatsApp callback." },
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
      const lower = text.toLowerCase()
      let listings: unknown[] = []

      if (lower.includes('find') || lower.includes('show') || lower.includes('list') || lower.includes('bed') || lower.includes('rent') || lower.includes('buy') || lower.includes('available')) {
        const all = await fetchPublicProperties()
        const kw = text.replace(/find|show|me|a|list|of|homes|houses|properties|for|rent|sale|in|under|below|over|with|bed|bath|beds|bathrooms/gi, '').trim().toLowerCase()
        const maybeTown = kw.split(' ')[0]
        listings = all.filter((p) => {
          const hay = `${p.title} ${p.town ?? ''} ${p.county ?? ''} ${p.area_label ?? ''}`.toLowerCase()
          return hay.includes(maybeTown) || hay.includes(kw)
        }).slice(0, 4)
        if (listings.length === 0) {
          setMessages((m) => [...m, { role: 'assistant', content: 'No exact matches found. Browse all listings at /browse or try "show all".' }])
          setLoading(false)
          return
        }
        setMessages((m) => [...m, { role: 'assistant', content: `Found ${listings.length} listing(s):`, listings }])
        setLoading(false)
        return
      }

      if (lower.includes('average') || lower.includes('price') || lower.includes('rent') || lower.includes('how much')) {
        const town = text.match(/in\s+([A-Za-z\s]+?)(?:\?|$|,)/i)?.[1]?.trim() ?? 'Nairobi'
        if (!supabase) {
          setMessages((m) => [...m, { role: 'assistant', content: 'Database not configured.' }])
          setLoading(false)
          return
        }
        const { data: areas } = await supabase.from('nairobi_areas').select('typical_rent_min,typical_rent_max,area_label').ilike('town', `%${town}%`).limit(3)
        if (areas && areas.length) {
          const avg = areas.map((a) => `${a.area_label ?? town}: KSh ${a.typical_rent_min?.toLocaleString()} – ${a.typical_rent_max?.toLocaleString()}`).join('\n')
          setMessages((m) => [...m, { role: 'assistant', content: `Typical rents in ${town}:\n${avg}` }])
        } else {
          setMessages((m) => [...m, { role: 'assistant', content: `I don't have specific rent data for ${town} right now. Try browsing /browse.` }])
        }
        setLoading(false)
        return
      }

      if (lower.includes('whatsapp') || lower.includes('call') || lower.includes('contact')) {
        setMessages((m) => [...m, { role: 'assistant', content: 'You can call or WhatsApp Homesurge directly. Use the "Call Homesurge" button on any listing, or email us through the contact page.' }])
        setLoading(false)
        return
      }

      const { text: reply } = await aiChat(
        messages.map((m) => ({ role: m.role, content: m.content ?? '' })),
        "You are the Homesurge customer assistant for a Kenyan real-estate marketplace. Be friendly, concise, Kenya-aware. If asked about listings, suggest browsing /browse. Never reveal admin-only fields like exact coordinates, estate names, or owner phones."
      )
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I had trouble connecting. Try again or browse /browse directly.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 left-6 z-50 inline-flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-all ${
          open ? 'bg-zinc-800 text-white' : 'bg-gradient-to-r from-cyan-500 to-violet-500 text-trace-dusk'
        }`}
      >
        {open ? <X className="h-5 w-5" /> : <Home className="h-5 w-5" />}
        <span className="text-sm font-semibold">{open ? 'Close' : 'Homesurge AI'}</span>
      </button>

      {open && (
        <div className="fixed bottom-20 left-6 z-50 w-[340px] max-h-[480px] flex flex-col rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 p-3">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            <p className="text-sm font-semibold text-white">Customer assistant</p>
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
                  {m.listings && m.listings.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {(m.listings as Array<{ id: string; title: string; price: number; price_type: string; cover_image_url?: string; town?: string }>).map((p) => (
                        <a key={p.id} href={`/listing/${p.id}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2 hover:border-cyan-400/40 transition-colors">
                          {p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                          <div>
                            <p className="text-xs font-semibold text-white line-clamp-1">{p.title}</p>
                            <p className="text-[10px] text-cyan-300">KSh {Number(p.price).toLocaleString()} {p.price_type === 'monthly' ? '/mo' : ''} {p.town ?? ''}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
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
              {['Find a home in Rongai', 'Avg rent in Kilimani?', 'Show all listings', 'Call Homesurge'].map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[10px] rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder="Find a home, ask about areas..."
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