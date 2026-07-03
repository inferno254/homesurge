import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props = {
  images: string[]
  onClose?: () => void
}

export function ImageCarousel({ images, onClose }: Props) {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  if (!images.length) return null

  const prev = () => setIdx((i) => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setIdx((i) => (i === images.length - 1 ? 0 : i + 1))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[95vh] max-w-[95vw] flex-col items-center gap-3">
        <div 
          className="flex items-center gap-3" 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={prev}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={images[idx]}
            alt=""
            className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
          <button
            onClick={next}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center gap-2 max-w-[90vw] overflow-x-auto py-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-14 w-18 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === idx ? 'border-cyan-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
