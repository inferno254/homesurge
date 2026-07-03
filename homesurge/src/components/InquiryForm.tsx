import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Phone, Send, CheckCircle } from 'lucide-react'

type Props = {
  propertyId: string
  listingRef: string
}

export function InquiryForm({ propertyId, listingRef }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase || !name.trim() || !phone.trim()) return
    setBusy(true)
    setErr('')
    try {
      const { error } = await supabase.rpc('submit_inquiry', {
        p_property_id: propertyId,
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_message: message.trim() || null,
      })
      if (error) throw error
      setDone(true)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-trace-card p-6 text-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 border border-emerald-400/20 mx-auto">
          <CheckCircle className="h-6 w-6 text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-white">Inquiry sent!</p>
        <p className="text-xs text-zinc-500">We'll reach out about <span className="text-trace-cyan font-medium">{listingRef}</span></p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/[0.08] bg-trace-card p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-trace-cyan/10 border border-trace-cyan/20">
          <Phone className="h-4 w-4 text-trace-cyan" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Interested in this home?</h3>
          <p className="text-xs text-zinc-500 mt-0.5">We'll call you back about {listingRef}</p>
        </div>
      </div>
      <input
        required
        className="glass-input w-full"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        required
        type="tel"
        className="glass-input w-full"
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="glass-input w-full min-h-[80px] resize-none"
        placeholder="Any questions? (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {err && <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">{err}</p>}
      <button
        type="submit"
        disabled={busy || !name.trim() || !phone.trim()}
        className="btn-primary w-full rounded-xl py-3 text-sm"
      >
        <Send className="h-4 w-4" />
        {busy ? 'Sending...' : 'Send inquiry'}
      </button>
    </form>
  )
}
