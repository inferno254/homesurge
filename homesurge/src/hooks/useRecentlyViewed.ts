import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'homesurge_recently_viewed'
const MAX_ITEMS = 10

export function useRecentlyViewed() {
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentIds))
  }, [recentIds])

  const addToRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)]
      return next.slice(0, MAX_ITEMS)
    })
  }, [])

  const removeFromRecent = useCallback((id: string) => {
    setRecentIds((prev) => prev.filter((x) => x !== id))
  }, [])

  const clearRecent = useCallback(() => {
    setRecentIds([])
  }, [])

  return { recentIds, addToRecent, removeFromRecent, clearRecent }
}

