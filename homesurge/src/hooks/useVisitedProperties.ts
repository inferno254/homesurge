import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'homesurge_visited_properties'

export function useVisitedProperties() {
  const [visitedIds, setVisitedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return new Set(parsed)
        }
      }
    } catch {}
    return new Set()
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...visitedIds]))
    } catch {}
  }, [visitedIds])

  const markVisited = useCallback((id: string) => {
    setVisitedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const markVisitedBatch = useCallback((ids: string[]) => {
    setVisitedIds((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [])

  const clearVisited = useCallback(() => {
    setVisitedIds(new Set())
  }, [])

  const isVisited = useCallback((id: string) => visitedIds.has(id), [visitedIds])

  const unvisitedIds = useCallback(
    (allIds: string[]) => allIds.filter((id) => !visitedIds.has(id)),
    [visitedIds]
  )

  return {
    visitedIds,
    visitedCount: visitedIds.size,
    markVisited,
    markVisitedBatch,
    clearVisited,
    isVisited,
    unvisitedIds,
  }
}

