import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase, friendlyError } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TaskItem from '../components/TaskItem'
import TaskFormModal, { type TaskFormValues } from '../components/TaskFormModal'
import ConfirmationToast from '../components/ConfirmationToast'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import type { PersonalTask } from '../types'

type Filter = 'all' | 'active' | 'completed'

export default function MyTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<PersonalTask[] | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PersonalTask | null>(null)
  const [toast, setToast] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!user) return
    const { data, error } = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })
    if (error) {
      setError(friendlyError(error))
      return
    }
    setTasks((data as PersonalTask[]) ?? [])
  }

  useEffect(() => {
    load()
  }, [user])

  const visible = useMemo(() => {
    if (!tasks) return []
    return tasks
      .filter((t) => (filter === 'active' ? t.status === 'pending' : filter === 'completed' ? t.status === 'completed' : true))
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
  }, [tasks, filter, search])

  async function handleCreateOrUpdate(values: TaskFormValues) {
    if (!user) return
    setError(null)
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      due_date: values.due_date || null,
      priority: values.priority || null,
    }
    const { error } = editing
      ? await supabase.from('personal_tasks').update(payload).eq('id', editing.id)
      : await supabase.from('personal_tasks').insert({ ...payload, user_id: user.id, status: 'pending' })
    if (error) {
      setError(friendlyError(error))
      return
    }
    setModalOpen(false)
    setEditing(null)
    load()
  }

  async function handleToggle(task: PersonalTask) {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    setTasks((prev) => prev?.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)) ?? null)
    if (nextStatus === 'completed') {
      setToast(true)
      setTimeout(() => setToast(false), 1800)
    }
    const { error } = await supabase.from('personal_tasks').update({ status: nextStatus }).eq('id', task.id)
    if (error) {
      setError(friendlyError(error))
      load()
    }
  }

  async function handleDelete(id: string) {
  const task = tasks?.find((t) => t.id === id)

  const confirmed = window.confirm(
    `Delete "${task?.title ?? 'this task'}"?\n\nThis action cannot be undone.`
  )

  if (!confirmed) return

  setTasks((prev) => prev?.filter((t) => t.id !== id) ?? null)

  const { error } = await supabase
    .from('personal_tasks')
    .delete()
    .eq('id', id)

  if (error) {
    setError(friendlyError(error))
    load()
  }
}

  return (
    <div className="px-5 sm:px-8 py-8 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-deep">✧ My Tasks</h1>
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
            placeholder="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-lavender pl-9 pr-3 py-2 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="rounded-xl border border-lavender px-3 py-2 text-sm text-deep outline-none"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {tasks === null ? (
        <LoadingSkeleton count={4} />
      ) : visible.length === 0 ? (
        <EmptyState glyph="✦" title="Nothing waiting for you" subtitle="Your space is clear." />
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
        title={editing ? 'Edit task' : 'New task'}
        initial={
          editing
            ? {
                title: editing.title,
                description: editing.description ?? '',
                due_date: editing.due_date ?? '',
                priority: editing.priority ?? '',
              }
            : {}
        }
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleCreateOrUpdate}
      />

      <ConfirmationToast show={toast} />
    </div>
  )
}