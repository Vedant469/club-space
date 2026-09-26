import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'

export interface ViewerPhoto {
  url: string
  caption?: string | null
}

interface PhotoViewerProps {
  photos: ViewerPhoto[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

export default function PhotoViewer({ photos, index, onClose, onIndexChange }: PhotoViewerProps) {
  const photo = photos[index]

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % photos.length)
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [index, photos.length, onClose, onIndexChange])

  if (!photo) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-deep/95 backdrop-blur-sm animate-fade-in">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm text-lavender/80">
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-3">
          <a href={photo.url} download aria-label="Download photo" className="p-2 hover:text-primary">
            <Download size={20} />
          </a>
          <button onClick={onClose} aria-label="Close viewer" className="p-2 hover:text-primary">
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-4">
        {photos.length > 1 ? (
          <button
            onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-6 p-2 text-white/80 hover:text-white"
          >
            <ChevronLeft size={32} />
          </button>
        ) : null}

        <img
          src={photo.url}
          alt={photo.caption ?? 'Event photo'}
          className="max-h-[75vh] max-w-full rounded-lg object-contain transition-opacity duration-300"
        />

        {photos.length > 1 ? (
          <button
            onClick={() => onIndexChange((index + 1) % photos.length)}
            aria-label="Next photo"
            className="absolute right-2 sm:right-6 p-2 text-white/80 hover:text-white"
          >
            <ChevronRight size={32} />
          </button>
        ) : null}
      </div>

      {photo.caption ? (
        <p className="text-center text-lavender/90 text-sm pb-6 px-6">{photo.caption}</p>
      ) : (
        <div className="pb-6" />
      )}
    </div>
  )
}