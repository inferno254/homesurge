import { env } from './env'

const MODELS = [
  { name: 'gemini-2.0-flash', url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent' },
  { name: 'groq-llama', url: 'https://api.groq.com/openai/v1/chat/completions', key: env.groqKey },
  { name: 'openrouter', url: 'https://openrouter.ai/api/v1/chat/completions', key: env.openrouterKey },
  { name: 'deepseek', url: 'https://api.deepseek.com/v1/chat/completions', key: env.deepseekKey },
  { name: 'mistral', url: 'https://api.mistral.ai/v1/chat/completions', key: env.mistralKey },
]

export async function generateHouseDescription(input: {
  property_type: string
  bedrooms: number | null
  bathrooms: number | null
  county: string
  town: string
  area_label: string | null
  price: number
  price_type: string
  amenities: string[]
}): Promise<string> {
  const prompt = `You are a professional Kenyan real estate copywriter.
Write an attractive 3-paragraph listing for a property with these facts (no exact street or gate details):
Type: ${input.property_type}
Bedrooms: ${input.bedrooms ?? 'n/a'}
Bathrooms: ${input.bathrooms ?? 'n/a'}
Broad area: ${input.town}, ${input.county}${input.area_label ? ` (${input.area_label})` : ''}
Price: KSh ${input.price.toLocaleString()} (${input.price_type})
Amenities: ${input.amenities.join(', ') || 'standard finishes'}

Tone: warm, professional, Kenya-specific context. No invented landmarks unless very well known for that town.`

  // Try /api/ai proxy first
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat', payload: { messages: [{ role: 'user', content: prompt }] } }),
    })
    if (r.ok) {
      const data = (await r.json()) as { text: string }
      return data.text
    }
  } catch {}

  // Try models in order until one succeeds
  for (const model of MODELS) {
    try {
      let res: Response
      let body: any
      
      if (model.name === 'gemini-2.0-flash') {
        if (!env.geminiKey) continue
        const url = `${model.url}?key=${env.geminiKey}`
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        })
        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[]
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (res.ok && text) return text.trim()
      } else {
        if (!model.key) continue
        body = {
          model: model.name.includes('groq') ? 'llama-3.3-70b-versatile' : 
                 model.name === 'deepseek' ? 'deepseek-chat' :
                 model.name === 'openrouter' ? 'google/gemini-2.0-flash-exp' :
                 model.name === 'mistral' ? 'mistral-large-latest' : 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
        }
        res = await fetch(model.url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${model.key}`,
          },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
          const text = data.choices?.[0]?.message?.content
          if (text) return text.trim()
        }
      }
    } catch (e) {
      console.warn(`${model.name} failed:`, e)
      continue
    }
  }

  return 'AI generation failed on all providers. Check API keys.'
}