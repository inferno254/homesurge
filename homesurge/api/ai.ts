import type { VercelRequest, VercelResponse } from '@vercel/node'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).json(body)
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  try {
    const { action, payload } = req.body as {
      action: string
      payload: Record<string, unknown>
    }

    switch (action) {
      case 'chat':
        return handleChat(req, res, payload)
      case 'parse-listing':
        return handleParseListing(req, res, payload)
      case 'geocode':
        return handleGeocode(req, res, payload)
      case 'vision':
        return handleVision(req, res, payload)
      case 'translate':
        return handleTranslate(req, res, payload)
      case 'deal-analysis':
        return handleDealAnalysis(req, res, payload)
      default:
        return json(res, 400, { error: `Unknown action: ${action}` })
    }
  } catch (err) {
    console.error('AI proxy error:', err)
    return json(res, 500, { error: 'AI proxy failed' })
  }
}

async function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]) as T
}

async function groqChat(messages: Array<{ role: string; content: string }>) {
  const key = process.env.GROQ_API_KEY || ''
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
  const key = process.env.GEMINI_API_KEY || ''
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
  const key = process.env.MOONDREAM_API_KEY || ''
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
  if (!r.ok) throw new Error(`Moondream error ${r.status}`)
  const data = await r.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function tavilySearch(query: string) {
  const key = process.env.TAVILY_API_KEY || ''
  const r = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, max_results: 5, include_answer: true }),
  })
  if (!r.ok) throw new Error(`Tavily error ${r.status}`)
  return (await r.json()) as { answer?: string; results?: Array<{ title: string; url: string }> }
}

async function handleChat(_req: VercelRequest, res: VercelResponse, payload: Record<string, unknown>) {
  const { messages, context } = payload as { messages: Array<{ role: string; content: string }>; context?: string }
  const systemPrompt = context
    ? `You are the Homesurge AI assistant for a Kenyan real-estate admin. Context about the app: ${context}. Help with tasks like adding properties, geocoding, answering inquiries, and general admin questions. Be concise and action-oriented.`
    : `You are the Homesurge AI assistant. Help admins manage property listings, answer questions about Nairobi real estate, and assist with data entry. Be concise and helpful.`

  try {
    const text = await withTimeout(groqChat([{ role: 'system', content: systemPrompt }, ...messages]))
    return json(res, 200, { text, provider: 'groq' })
  } catch {
    try {
      const lastUser = messages.filter((m) => m.role === 'user').pop()?.content ?? ''
      const text = await withTimeout(geminiGenerate(lastUser, systemPrompt))
      return json(res, 200, { text, provider: 'gemini' })
    } catch (err) {
      return json(res, 500, { error: 'Both Groq and Gemini failed', details: String(err) })
    }
  }
}

async function handleParseListing(_req: VercelRequest, res: VercelResponse, payload: Record<string, unknown>) {
  const { rawText } = payload as { rawText: string }
  const prompt = `Extract property listing details from this raw Kenyan real-estate text. Return ONLY valid JSON with these exact keys: title, price (number), price_type ("monthly"|"sale"|"negotiable"), bedrooms (number or null), bathrooms (number or null), property_type ("apartment"|"bedsitter"|"bungalow"|"maisonette"|"studio"|"townhouse"|"land"|"commercial"), county, town, area_label, estate, address, owner_phone, description, amenities (array of strings), furnished (boolean). If a field is missing, use null or empty string. Do NOT invent values. Text: "${rawText.slice(0, 4000)}"`

  try {
    const text = await withTimeout(geminiGenerate(prompt, 'You are a strict JSON extraction engine for Kenyan real estate. Output ONLY valid JSON, no markdown, no commentary.'))
    const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim()
    const data = JSON.parse(cleaned)
    return json(res, 200, { data })
  } catch (err) {
    return json(res, 500, { error: 'Failed to parse listing', details: String(err) })
  }
}

async function handleGeocode(_req: VercelRequest, res: VercelResponse, payload: Record<string, unknown>) {
  const { placeName, country = 'Kenya' } = payload as { placeName: string; country?: string }
  const prompt = `You are a geocoding assistant for Kenya. Given a place name, return the approximate latitude and longitude as JSON: { "lat": number, "lng": number, "display": string }. For Nairobi estates, use these approximate centers: Westlands (-1.2675,36.8095), Kilimani (-1.2821,36.7915), Kileleshwa (-1.2741,36.7785), Lavington (-1.2720,36.7689), Rongai (-1.3800,36.7432), Kware (-1.3188,36.7872), Buruburu (-1.2889,36.8766), Karen (-1.3506,36.7085), Parklands (-1.2615,36.8065), Gigiri (-1.2431,36.8036), CBD (-1.2833,36.8167), Eastlands (-1.2780,36.9078), Langata (-1.3653,36.7472), Upper Hill (-1.2956,36.8196), Riverside (-1.2656,36.7989), Muthaiga (-1.2489,36.8197), Spring Valley (-1.2646,36.7919), Kahawa (-1.1960,36.9097), Kasarani (-1.2220,36.8860), Roysambu (-1.2147,36.8700), Embakasi (-1.3197,36.9078), Utawala (-1.2990,36.9400), Dandora (-1.2545,36.8776), Ruaka (-1.2150,36.7520), Ruiru (-1.1489,36.9494), Kiambu Town (-1.1720,36.8350), Thika (-1.0396,37.0839), Athi River (-1.4611,36.9814), Kitengela (-1.4890,36.9536), Ngong (-1.3610,36.6582), Madaraka (-1.3188,36.7872), South B (-1.3056,36.8487), South C (-1.3056,36.8487). Place: "${placeName}" in ${country}.`

  try {
    const text = await withTimeout(geminiGenerate(prompt, 'Return only JSON with lat, lng, display.'))
    const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim()
    const data = JSON.parse(cleaned)
    return json(res, 200, { data })
  } catch {
    const q = encodeURIComponent(placeName)
    const mapsR = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { Accept: 'application/json' },
    })
    if (!mapsR.ok) return json(res, 500, { error: 'Geocoding failed' })
    const arr = await mapsR.json()
    if (!arr[0]) return json(res, 404, { error: 'Place not found' })
    return json(res, 200, { data: { lat: Number(arr[0].lat), lng: Number(arr[0].lon), display: arr[0].display_name }, provider: 'nominatim' })
  }
}

async function handleVision(_req: VercelRequest, res: VercelResponse, payload: Record<string, unknown>) {
  const { imageUrl, question = 'Describe this property photo. Is it blurry, dark, or low-quality? Does it show a competitor watermark? Rate 1-5.' } = payload as { imageUrl: string; question?: string }
  try {
    const text = await withTimeout(moondreamVision(imageUrl, question))
    return json(res, 200, { text, provider: 'moondream' })
  } catch (err) {
    return json(res, 500, { error: 'Vision analysis failed', details: String(err) })
  }
}

async function handleTranslate(_req: VercelRequest, res: VercelResponse, payload: Record<string, unknown>) {
  const { text, targetLang = 'Swahili' } = payload as { text: string; targetLang?: string }
  const prompt = `Translate the following real-estate listing text to ${targetLang}. Keep the tone warm and professional. Preserve numbers, prices, and proper nouns. Return ONLY the translation. Text: "${text.slice(0, 4000)}"`
  try {
    const translated = await withTimeout(geminiGenerate(prompt, `You are a professional translator to ${targetLang}.`))
    return json(res, 200, { text: translated })
  } catch (err) {
    return json(res, 500, { error: 'Translation failed', details: String(err) })
  }
}

async function handleDealAnalysis(_req: VercelRequest, res: VercelResponse, payload: Record<string, unknown>) {
  const { price, price_type, town, county, property_type, bedrooms, size_sqm } = payload as {
    price: number
    price_type: string
    town: string
    county?: string
    property_type?: string
    bedrooms?: number | null
    size_sqm?: number | null
  }
  const prompt = `You are a Kenyan real-estate pricing analyst. Based on typical market ranges for Nairobi environs in 2025-2026, rate whether this listing is a good deal, fair, or overpriced. Return concise JSON: { "verdict": "good_deal"|"fair"|"overpriced", "reason": string, "suggested_range": { "min": number, "max": number } }. Listing: ${property_type ?? 'apartment'} in ${town ?? 'unknown'}, ${county ?? 'Nairobi'}, ${bedrooms ?? 'n/a'} bed, ${size_sqm ?? 'n/a'} m², KSh ${price} ${price_type}. Known typical ranges by town are approximate.`

  try {
    const text = await withTimeout(geminiGenerate(prompt, 'Output ONLY valid JSON, no markdown.'))
    const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim()
    const data = JSON.parse(cleaned)
    return json(res, 200, { data })
  } catch (err) {
    return json(res, 500, { error: 'Deal analysis failed', details: String(err) })
  }
}
