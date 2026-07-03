import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'homesurge_compare'
const MAX_COMPARE = 4
let cachedCompare: string[] = []
let cachedCompareRaw = ''

function getSnapshot(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? ''
    if (raw === cachedCompareRaw) {
      return cachedCompare
    }
    const next = raw ? JSON.parse(raw) : []
    cachedCompareRaw = raw
    cachedCompare = next
    return next
  } catch {
    return cachedCompare
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function emit() {
  window.dispatchEvent(new Event('storage'))
}

export function useCompare() {
  const ids = useSyncExternalStore(subscribe, getSnapshot)

  const isSelected = useCallback((id: string) => ids.includes(id), [ids])

  const toggle = useCallback((id: string) => {
    const cur = getSnapshot()
    if (cur.includes(id)) {
      const next = cur.filter((x) => x !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } else {
      if (cur.length >= MAX_COMPARE) return 'limit'
      const next = [...cur, id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    emit()
    return null
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    emit()
  }, [])

  return { compare: ids, count: ids.length, isSelected, toggle, clear, max: MAX_COMPARE }
}

