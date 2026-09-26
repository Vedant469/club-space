import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Upload, Trash2 } from 'lucide-react'
import { supabase, friendlyError } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import PhotoViewer, { type ViewerPhoto } from '../components/PhotoViewer'
import type { ClubEvent, EventPhoto } from '../types'

interface PhotoWithUrl extends EventPhoto {
  url: string
}

export default function EventGallery() {
  const { eventId } = useParams<{ eventId: string }>()
  const { user } = useAuth()
  const [event, setEvent] = useState<ClubEvent | null>(null)
  const [photos, setPhotos] = useState<PhotoWithUrl[] | null>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function load() {
    if (!eventId) return
    const { data: eventData } = await supabase.from('events').select('*').eq('id', eventId).single()
    setEvent((eventData as ClubEvent) ?? null)

    const { data: photoRows, error } = await supabase
      .from('event_photos')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (error) {
      setError(friendlyError(error))
      return
    }
    const rows = (photoRows as EventPhoto[]) ?? []
    const withUrls = await Promise.all(
      rows.map(async (p) => {
        const { data } = await supabase.storage.from('club-photos').createSignedUrl(p.storage_path, 3600)
        return { ...p, url: data?.signedUrl ?? '' }
      })
    )
    setPhotos(withUrls)
  }

  useEffect(() => {
    load()
  }, [eventId])

  async function handleUpload(files: FileList | null) {
    if (!files || !user || !eventId) return
    for (const file of Array.from(files)) {
      const path = `${eventId}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('club-photos').upload(path, file)
      if (uploadError) {
        setError(friendlyError(uploadError))
        continue
      }
      await supabase.from('event_photos').insert({ event_id: eventId, uploaded_by: user.id, storage_path: path })
    }
    load()
  }

  async function handleDelete(photo: PhotoWithUrl) {
    setPhotos((prev) => prev?.filter((p) => p.id !== photo.id) ?? null)
    await supabase.storage.from('club-photos').remove([photo.storage_path])
    const { error } = await supabase.from('event_photos').delete().eq('id', photo.id)
    if (error) {
      setError(friendlyError(error))
      load()
    }
  }

  const viewerPhotos: ViewerPhoto[] = (photos ?? []).map((p) => ({ url: p.url, caption: p.caption }))

  return (
    <div className="px-5 sm:px-8 py-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/memories" aria-label="Back to memories" className="text-muted hover:text-deep">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-deep">{event?.name ?? 'Event'} ✦</h1>
            <p className="text-xs text-muted">{event?.event_date ?? 'Date TBA'}</p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-full bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary/90 active:scale-95 transition-transform"
        >
          <Upload size={16} /> Add photos
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {photos === null ? (
        <LoadingSkeleton count={4} />
      ) : photos.length === 0 ? (
        <EmptyState glyph="✦" title="Nothing here yet" subtitle="Upload the first photo from this event." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p, i) => (
            <div
              key={p.id}
              className={`group relative rounded-xl bg-white p-2 pb-6 shadow-sm hover:shadow-soft transition-all cursor-pointer ${
                i % 2 === 0 ? 'rotate-[0.8deg]' : '-rotate-[0.8deg]'
              }`}
              onClick={() => setViewerIndex(i)}
            >
              <img src={p.url} alt={p.caption ?? 'Event photo'} loading="lazy" className="w-full aspect-square object-cover rounded-md" />
              {p.caption ? <p className="text-[11px] text-muted mt-1.5 truncate px-1">{p.caption}</p> : null}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(p)
                }}
                aria-label="Delete photo"
                className="absolute top-1 right-1 p-1 rounded-full bg-white/90 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {viewerIndex !== null ? (
        <PhotoViewer photos={viewerPhotos} index={viewerIndex} onClose={() => setViewerIndex(null)} onIndexChange={setViewerIndex} />
      ) : null}
    </div>
  )
}