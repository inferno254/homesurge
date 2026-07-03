import { useEffect } from 'react'

export function usePageMeta(title: string, description?: string, image?: string) {
  useEffect(() => {
    const siteName = 'homesurge'
    const fullTitle = title ? `${title} Â· ${siteName}` : siteName
    const desc = description ?? 'Kenyan homes, curated signal. Browse real listings with prices and broad locations. Save favorites, compare side-by-side.'
    const img = image ?? '/og-default.png'

    document.title = fullTitle

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[data-seo="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('data-seo', name)
        document.head.appendChild(el)
      }
      if (name === 'title' || name === 'description') {
        el.setAttribute('name', name)
      } else {
        el.setAttribute('property', name)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', desc)
    setMeta('og:title', fullTitle)
    setMeta('og:description', desc)
    setMeta('og:image', img)
    setMeta('og:type', 'website')
    setMeta('og:site_name', siteName)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)
    setMeta('twitter:image', img)
  }, [title, description, image])
}
