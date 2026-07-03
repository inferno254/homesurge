import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'homesurge_favorites'
let cachedFavorites: string[] = []
let cachedFavoritesRaw = ''

function getSnapshot(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? ''
    if (raw === cachedFavoritesRaw) {
      return cachedFavorites
    }
    const next = raw ? JSON.parse(raw) : []
    cachedFavoritesRaw = raw
    cachedFavorites = next
    return next
  } catch {
    return cachedFavorites
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function emit() {
  window.dispatchEvent(new Event('storage'))
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot)

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids])

  const toggle = useCallback((id: string) => {
    const cur = getSnapshot()
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    emit()
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    emit()
  }, [])

  return { favorites: ids, count: ids.length, isFavorite, toggle, clear }
}

