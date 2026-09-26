import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, CLUB_ID } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import GreetingHeader from '../components/GreetingHeader'
import QuotePlaceholder from '../components/QuotePlaceholder'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { formatDueDate, formatTime } from '../lib/time'
import type { ChatMessage, ClubDocument, ClubEvent, ClubTask, PersonalTask, Profile } from '../types'

export default function Home() {
  const { user, profile } = useAuth()
  const [tasks, setTasks] = useState<PersonalTask[] | null>(null)
  const [clubTasks, setClubTasks] = useState<ClubTask[] | null>(null)
  const [messages, setMessages] = useState<(ChatMessage & { profile?: Profile })[] | null>(null)
  const [docs, setDocs] = useState<ClubDocument[] | null>(null)
  const [events, setEvents] = useState<ClubEvent[] | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('personal_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(3)
      .then(({ data }) => setTasks((data as PersonalTask[]) ?? []))

    supabase
      .from('club_tasks')
      .select('*')
      .eq('club_id', CLUB_ID)
      .neq('status', 'completed')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(3)
      .then(({ data }) => setClubTasks((data as ClubTask[]) ?? []))

    supabase
      .from('chat_messages')
      .select('*, profile:profiles(*)')
      .eq('club_id', CLUB_ID)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setMessages((data as (ChatMessage & { profile?: Profile })[]) ?? []))

    supabase
      .from('documents')
      .select('*')
      .eq('club_id', CLUB_ID)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setDocs((data as ClubDocument[]) ?? []))

    supabase
      .from('events')
      .select('*')
      .eq('club_id', CLUB_ID)
      .order('event_date', { ascending: false })
      .limit(2)
      .then(({ data }) => setEvents((data as ClubEvent[]) ?? []))
  }, [user])

  return (
    <div className="px-5 sm:px-8 py-8 max-w-6xl mx-auto space-y-6">
      <GreetingHeader displayName={profile?.display_name ?? '...'} />
      <QuotePlaceholder />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* My Tasks - tall card */}
        <Link to="/tasks" className="md:row-span-2 rounded-card bg-white/70 border border-lavender/60 p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all">
          <h2 className="font-bold text-deep mb-3">✧ My Tasks</h2>
          {tasks === null ? (
            <LoadingSkeleton count={3} />
          ) : tasks.length === 0 ? (
            <EmptyState glyph="✦" title="Nothing waiting for you" subtitle="Your space is clear." />
          ) : (
            <ul className="space-y-2.5">
              {tasks.map((t) => (
                <li key={t.id} className="text-sm text-deep flex justify-between gap-2">
                  <span className="truncate">○ {t.title}</span>
                  <span className="text-muted text-xs shrink-0">{formatDueDate(t.due_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Link>

        {/* Club Tasks */}
        <Link to="/club-tasks" className="rounded-card bg-lavender/30 border border-lavender/60 p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all">
          <h2 className="font-bold text-deep mb-3">✦ Club Tasks</h2>
          {clubTasks === null ? (
            <LoadingSkeleton count={2} />
          ) : clubTasks.length === 0 ? (
            <EmptyState glyph="✧" title="All caught up" subtitle="No open club tasks." />
          ) : (
            <ul className="space-y-2">
              {clubTasks.map((t) => (
                <li key={t.id} className="text-sm text-deep truncate">
                  ○ {t.title}
                </li>
              ))}
            </ul>
          )}
        </Link>

        {/* Chat preview */}
        <Link to="/chat" className="rounded-card bg-pink/30 border border-pink/50 p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all">
          <h2 className="font-bold text-deep mb-3">✧ Club Chat</h2>
          {messages === null ? (
            <LoadingSkeleton count={2} />
          ) : messages.length === 0 ? (
            <EmptyState glyph="⋆" title="Quiet for now" subtitle="Someone should say hello." />
          ) : (
            <ul className="space-y-2">
              {messages.map((m) => (
                <li key={m.id} className="text-sm">
                  <span className="font-semibold text-primary">{m.profile?.display_name ?? 'Member'}: </span>
                  <span className="text-deep">{m.message}</span>
                  <span className="text-muted text-xs ml-1">{formatTime(m.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Link>

        {/* Recent Documents */}
        <Link to="/documents" className="rounded-card bg-white/70 border border-lavender/60 p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all">
          <h2 className="font-bold text-deep mb-3">✦ Recent Documents</h2>
          {docs === null ? (
            <LoadingSkeleton count={2} />
          ) : docs.length === 0 ? (
            <EmptyState glyph="✧" title="Your archive is empty" subtitle="Upload something to get started." />
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="text-sm text-deep truncate">
                  {d.file_name}
                </li>
              ))}
            </ul>
          )}
        </Link>

        {/* Memories - full width */}
        <Link to="/memories" className="md:col-span-3 rounded-card bg-gradient-to-r from-lavender/40 via-pink/30 to-lavender/40 border border-lavender/60 p-6 hover:shadow-soft transition-all">
          <h2 className="font-bold text-deep mb-3">✦ Memories</h2>
          {events === null ? (
            <LoadingSkeleton count={1} />
          ) : events.length === 0 ? (
            <EmptyState glyph="✦" title="Nothing here yet" subtitle="Your next event could be the first page." />
          ) : (
            <div className="flex gap-4 overflow-x-auto">
              {events.map((e) => (
                <div key={e.id} className="min-w-[160px] rounded-xl bg-white/60 px-4 py-3 shadow-sm">
                  <p className="font-semibold text-deep text-sm">{e.name}</p>
                  <p className="text-xs text-muted mt-1">{e.event_date ?? 'Date TBA'}</p>
                </div>
              ))}
            </div>
          )}
        </Link>
      </div>
    </div>
  )
}