import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { supabase, CLUB_ID, friendlyError } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import type { ClubEvent } from '../types'

export default function Memories() {
  const { user } = useAuth()
  const [events, setEvents] = useState<ClubEvent[] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', CLUB_ID)
      .order('event_date', { ascending: false })
    if (error) {
      setError(friendlyError(error))
      return
    }
    setEvents((data as ClubEvent[]) ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!user || !name.trim()) return
    const { error } = await supabase.from('events').insert({
      club_id: CLUB_ID,
      name: name.trim(),
      description: description.trim() || null,
      event_date: eventDate || null,
      created_by: user.id,
    })
    if (error) {
      setError(friendlyError(error))
      return
    }
    setModalOpen(false)
    setName('')
    setDescription('')
    setEventDate('')
    load()
  }

  return (
    <div className="px-5 sm:px-8 py-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-deep">✦ Memories</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary/90 active:scale-95 transition-transform"
        >
          <Plus size={16} /> New event
        </button>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {events === null ? (
        <LoadingSkeleton count={3} />
      ) : events.length === 0 ? (
        <EmptyState glyph="✦" title="Nothing here yet" subtitle="Your next event could be the first page." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e, i) => (
            <Link
              key={e.id}
              to={`/memories/${e.id}`}
              className={`rounded-card bg-white/70 border border-lavender/60 p-5 hover:shadow-soft hover:-translate-y-1 transition-all ${
                i % 3 === 1 ? 'sm:rotate-[0.6deg]' : i % 3 === 2 ? 'sm:-rotate-[0.6deg]' : ''
              }`}
            >
              <p className="text-primary text-sm mb-1">✦</p>
              <h2 className="font-bold text-deep">{e.name}</h2>
              <p className="text-xs text-muted mt-1">{e.event_date ?? 'Date TBA'}</p>
              {e.description ? <p className="text-sm text-muted mt-2 line-clamp-2">{e.description}</p> : null}
            </Link>
          ))}
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-card bg-white p-6 shadow-soft animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-deep">New event ✦</h2>
              <button onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} className="text-muted" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                required
                autoFocus
                placeholder="Event name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-lavender px-3 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-lavender px-3 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-lavender px-3 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-primary text-white font-semibold py-2.5 mt-2 hover:bg-primary/90 active:scale-[0.98] transition-transform"
              >
                Create event ✦
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}