import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase, CLUB_ID, friendlyError } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useClub } from '../context/ClubContext'
import TaskItem from '../components/TaskItem'
import TaskFormModal, { type TaskFormValues } from '../components/TaskFormModal'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import type { ClubEvent, ClubTask } from '../types'

export default function ClubTasks() {
  const { user } = useAuth()
  const { members } = useClub()
  const [tasks, setTasks] = useState<ClubTask[] | null>(null)
  const [events, setEvents] = useState<ClubEvent[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClubTask | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data, error } = await supabase
      .from('club_tasks')
      .select('*')
      .eq('club_id', CLUB_ID)
      .order('due_date', { ascending: true, nullsFirst: false })
    if (error) {
      setError(friendlyError(error))
      return
    }
    setTasks((data as ClubTask[]) ?? [])
  }

  useEffect(() => {
    load()
    supabase
      .from('events')
      .select('*')
      .eq('club_id', CLUB_ID)
      .then(({ data }) => setEvents((data as ClubEvent[]) ?? []))
  }, [])

  const memberByUserId = useMemo(() => {
    const map = new Map<string, string>()
    members.forEach((m) => {
      if (m.profile) map.set(m.user_id, m.profile.display_name)
    })
    return map
  }, [members])

  const visible = useMemo(() => {
    if (!tasks) return []
    return tasks
      .filter((t) => (statusFilter === 'all' ? true : t.status === statusFilter))
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
  }, [tasks, statusFilter, search])

  async function handleCreateOrUpdate(values: TaskFormValues) {
    if (!user) return
    setError(null)
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      due_date: values.due_date || null,
      priority: values.priority || null,
      assigned_to: values.assigned_to || null,
      event_id: values.event_id || null,
      status: values.status || 'todo',
    }
    const { error } = editing
      ? await supabase.from('club_tasks').update(payload).eq('id', editing.id)
      : await supabase.from('club_tasks').insert({ ...payload, club_id: CLUB_ID, created_by: user.id })
    if (error) {
      setError(friendlyError(error))
      return
    }
    setModalOpen(false)
    setEditing(null)
    load()
  }

  async function handleToggle(task: ClubTask) {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed'
    setTasks((prev) => prev?.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)) ?? null)
    const { error } = await supabase.from('club_tasks').update({ status: nextStatus }).eq('id', task.id)
    if (error) {
      setError(friendlyError(error))
      load()
    }
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev?.filter((t) => t.id !== id) ?? null)
    const { error } = await supabase.from('club_tasks').delete().eq('id', id)
    if (error) {
      setError(friendlyError(error))
      load()
    }
  }

  const assigneeOptions = members.filter((m) => m.profile).map((m) => ({ value: m.user_id, label: m.profile!.display_name }))
  const eventOptions = events.map((e) => ({ value: e.id, label: e.name }))

  return (
    <div className="px-5 sm:px-8 py-8 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-deep">✦ Club Tasks</h1>
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="flex items-center gap-1.5 rounded-full bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary/90 active:scale-95 transition-transform"
        >
          <Plus size={16} /> Add task
        </button>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            placeholder="Search club tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-lavender pl-9 pr-3 py-2 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-lavender px-3 py-2 text-sm text-deep outline-none"
        >
          <option value="all">All</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {tasks === null ? (
        <LoadingSkeleton count={4} />
      ) : visible.length === 0 ? (
        <EmptyState glyph="✧" title="Nothing waiting for you" subtitle="Your space is clear." />
      ) : (
        <div className="space-y-2.5">
          {visible.map((t) => (
            <TaskItem
              key={t.id}
              title={t.title}
              description={t.description}
              dueDate={t.due_date}
              priority={t.priority}
              completed={t.status === 'completed'}
              assigneeName={t.assigned_to ? memberByUserId.get(t.assigned_to) ?? null : null}
              onToggle={() => handleToggle(t)}
              onEdit={() => {
                setEditing(t)
                setModalOpen(true)
              }}
              onDelete={() => handleDelete(t.id)}
            />
          ))}
        </div>
      )}

      <TaskFormModal
        open={modalOpen}
        title={editing ? 'Edit club task' : 'New club task'}
        assigneeOptions={assigneeOptions}
        eventOptions={eventOptions}
        statusOptions={[
          { value: 'todo', label: 'To do' },
          { value: 'in_progress', label: 'In progress' },
          { value: 'completed', label: 'Completed' },
        ]}
        initial={
          editing
            ? {
                title: editing.title,
                description: editing.description ?? '',
                due_date: editing.due_date ?? '',
                priority: editing.priority ?? '',
                assigned_to: editing.assigned_to ?? '',
                event_id: editing.event_id ?? '',
                status: editing.status,
              }
            : { status: 'todo' }
        }
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  )
}