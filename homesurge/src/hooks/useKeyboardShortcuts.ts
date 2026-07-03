import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k': case 'K': e.preventDefault(); navigate('/admin/map'); break
          case 'n': case 'N': e.preventDefault(); navigate('/admin/new'); break
          case 'd': case 'D': e.preventDefault(); navigate('/admin'); break
          case 'i': case 'I': e.preventDefault(); navigate('/admin/inquiries'); break
          case 'a': case 'A': e.preventDefault(); navigate('/admin/activity'); break
        case 'u': case 'U': e.preventDefault(); navigate('/admin/users'); break
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])
}