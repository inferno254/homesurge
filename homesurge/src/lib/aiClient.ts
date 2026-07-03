import { env } from './env'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type ParsedListing = {
  title: string
  price: number
  price_type: string
  bedrooms: number | null
  bathrooms: number | null
  property_type: string
  county: string
  town: string
  area_label: string
  estate: string
  address: string
  owner_phone: string
  description: string
  amenities: string[]
  furnished: boolean
}

export type GeocodeResult = {
  lat: number
  lng: number
  display: string
}

export type DealAnalysis = {
  verdict: 'good_deal' | 'fair' | 'overpriced'
  reason: string
  suggested_range: { min: number; max: number }
}

async function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]) as T
}

async function groqChat(messages: Array<{ role: string; content: string }>) {
  const key = env.groqKey || ''
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.7, max_tokens: 1024 }),
  })
  if (!r.ok) throw new Error(`Groq error ${r.status}`)
  const data = await r.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function geminiGenerate(prompt: string, systemInstruction?: string) {
  const key = env.geminiKey || ''
  const model = 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
  const body: Record<string, unknown> = { contents: [{ parts: [{ text: prompt }] }] }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`Gemini error ${r.status}`)
  const data = await r.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')
  return text.trim()
}

async function moondreamVision(imageUrl: string, question: string) {
  const key = env.moondreamKey || ''
  const r = await fetch('https://api.moondream.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'moondream2',
      messages: [
        { role: 'user', content: [{ type: 'image_url', image_url: imageUrl }, { type: 'text', text: question }] },
      ],
    }),
  })
  const data = await r.json().catch(() => ({}))
  const msg = data?.choices?.[0]?.message?.content
  if (msg && typeof msg === 'string') return msg
  const err = data?.error?.message || data?.message || ''
  if (String(err).toLowerCase().includes('does not support image') || String(err).toLowerCase().includes('not support image')) {
    return 'This AI model currently does not support image input, so I cannot analyze this photo right now.'
  }
  if (!r.ok) throw new Error(`Moondream error ${r.status}: ${err}`)
  return ''
}

export async function aiChat(messages: ChatMessage[], context?: string): Promise<{ text: string; provider: string }> {
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat', payload: { messages, context } }),
    })
    if (r.ok) return (await r.json()) as { text: string; provider: string }
  } catch {
    // fallback to direct
  }

  const systemPrompt = context
    ? `You are the Homesurge AI assistant for a Kenyan real-estate admin. Context about the app: ${context}. Help with tasks like adding properties, geocoding, answering inquiries, and general admin questions. Be concise and action-oriented.`
    : `You are the Homesurge AI assistant. Help admins manage property listings, answer questions about Nairobi real estate, and assist with data entry. Be concise and helpful.`
  const text = await withTimeout(groqChat([{ role: 'system', content: systemPrompt }, ...messages.map(m => ({ role: m.role, content: m.content }))]))
  return { text, provider: 'groq-fallback' }
}

export async function aiParseListing(rawText: string): Promise<ParsedListing> {
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'parse-listing', payload: { rawText } }),
    })
    if (r.ok) {
      const data = (await r.json()) as { data: ParsedListing }
      return data.data
    }
  } catch {
    // fallback
  }

  const prompt = `Extract property listing details from this raw Kenyan real-estate text. Return ONLY valid JSON with these exact keys: title, price (number), price_type ("monthly"|"sale"|"negotiable"), bedrooms (number or null), bathrooms (number or null), property_type ("apartment"|"bedsitter"|"bungalow"|"maisonette"|"studio"|"townhouse"|"land"|"commercial"), county, town, area_label, estate, address, owner_phone, description, amenities (array of strings), furnished (boolean). If a field is missing, use null or empty string. Do NOT invent values. Text: "${rawText.slice(0, 4000)}"`
  const text = await withTimeout(geminiGenerate(prompt, 'You are a strict JSON extraction engine for Kenyan real estate. Output ONLY valid JSON, no markdown, no commentary.'))
  const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}

export async function aiGeocode(placeName: string, country = 'Kenya'): Promise<GeocodeResult> {
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'geocode', payload: { placeName, country } }),
    })
    if (r.ok) {
      const data = (await r.json()) as { data: GeocodeResult; provider?: string }
      return data.data
    }
  } catch {
    // fallback
  }

  const prompt = `You are a geocoding assistant for Kenya. Given a place name, return the approximate latitude and longitude as JSON: { "lat": number, "lng": number, "display": string }. For Nairobi estates, use these approximate centers: Westlands (-1.2675,36.8095), Kilimani (-1.2821,36.7915), Kileleshwa (-1.2741,36.7785), Lavington (-1.2720,36.7689), Rongai (-1.3800,36.7432), Kware (-1.3188,36.7872), Buruburu (-1.2889,36.8766), Karen (-1.3506,36.7085), Parklands (-1.2615,36.8065), Gigiri (-1.2431,36.8036), CBD (-1.2833,36.8167), Eastlands (-1.2780,36.9078), Langata (-1.3653,36.7472), Upper Hill (-1.2956,36.8196), Riverside (-1.2656,36.7989), Muthaiga (-1.2489,36.8197), Spring Valley (-1.2646,36.7919), Kahawa (-1.1960,36.9097), Kasarani (-1.2220,36.8860), Roysambu (-1.2147,36.8700), Embakasi (-1.3197,36.9078), Utawala (-1.2990,36.9400), Dandora (-1.2545,36.8776), Ruaka (-1.2150,36.7520), Ruiru (-1.1489,36.9494), Kiambu Town (-1.1720,36.8350), Thika (-1.0396,37.0839), Athi River (-1.4611,36.9814), Kitengela (-1.4890,36.9536), Ngong (-1.3610,36.6582), Madaraka (-1.3188,36.7872), South B (-1.3056,36.8487), South C (-1.3056,36.8487). Place: "${placeName}" in ${country}.`
  const text = await withTimeout(geminiGenerate(prompt, 'Return only JSON with lat, lng, display.'))
  const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}

export async function aiVision(imageUrl: string, question?: string): Promise<string> {
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vision', payload: { imageUrl, question: question ?? 'Describe this property photo. Is it blurry, dark, or low-quality? Does it show a competitor watermark? Rate 1-5 and list issues.' } }),
    })
    if (r.ok) {
      const data = (await r.json()) as { text: string; provider: string }
      return data.text
    }
  } catch {
    // fallback
  }

  return await withTimeout(moondreamVision(imageUrl, question ?? 'Describe this property photo. Is it blurry, dark, or low-quality? Does it show a competitor watermark? Rate 1-5 and list issues.'))
}

export async function aiTranslate(text: string, targetLang = 'Swahili'): Promise<string> {
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'translate', payload: { text, targetLang } }),
    })
    if (r.ok) {
      const data = (await r.json()) as { text: string }
      return data.text
    }
  } catch {
    // fallback
  }

  const prompt = `Translate the following real-estate listing text to ${targetLang}. Keep the tone warm and professional. Preserve numbers, prices, and proper nouns. Return ONLY the translation. Text: "${text.slice(0, 4000)}"`
  return await withTimeout(geminiGenerate(prompt, `You are a professional translator to ${targetLang}.`))
}

export async function aiDealAnalysis(payload: {
  price: number
  price_type: string
  town: string
  county?: string
  property_type?: string
  bedrooms?: number | null
  size_sqm?: number | null
}): Promise<DealAnalysis> {
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deal-analysis', payload }),
    })
    if (r.ok) {
      const data = (await r.json()) as { data: DealAnalysis }
      return data.data
    }
  } catch {
    // fallback
  }

  const prompt = `You are a Kenyan real-estate pricing analyst. Based on typical market ranges for Nairobi environs in 2025-2026, rate whether this listing is a good deal, fair, or overpriced. Return concise JSON: { "verdict": "good_deal"|"fair"|"overpriced", "reason": string, "suggested_range": { "min": number, "max": number } }. Listing: ${payload.property_type ?? 'apartment'} in ${payload.town ?? 'unknown'}, ${payload.county ?? 'Nairobi'}, ${payload.bedrooms ?? 'n/a'} bed, ${payload.size_sqm ?? 'n/a'} m², KSh ${payload.price} ${payload.price_type}. Known typical ranges by town are approximate.`
  const text = await withTimeout(geminiGenerate(prompt, 'Output ONLY valid JSON, no markdown.'))
  const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}
