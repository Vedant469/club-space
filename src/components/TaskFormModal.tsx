import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'

export interface TaskFormValues {
  title: string
  description: string
  due_date: string
  priority: '' | 'low' | 'medium' | 'high'
  assigned_to?: string
  event_id?: string
  status?: string
}

interface Option {
  value: string
  label: string
}

interface TaskFormModalProps {
  open: boolean
  initial?: Partial<TaskFormValues>
  assigneeOptions?: Option[]
  eventOptions?: Option[]
  statusOptions?: Option[]
  title: string
  onClose: () => void
  onSubmit: (values: TaskFormValues) => void
}

const EMPTY: TaskFormValues = { title: '', description: '', due_date: '', priority: '', assigned_to: '', event_id: '', status: '' }

export default function TaskFormModal({
  open,
  initial,
  assigneeOptions,
  eventOptions,
  statusOptions,
  title,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const [values, setValues] = useState<TaskFormValues>({ ...EMPTY, ...initial })

  useEffect(() => {
    if (open) setValues({ ...EMPTY, ...initial })
  }, [open, initial])

  if (!open) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!values.title.trim()) return
    onSubmit(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-card bg-white p-6 shadow-soft animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-deep">{title} ✦</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-deep">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            required
            placeholder="Task title"
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            className="w-full rounded-xl border border-lavender px-3 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
          />
          <textarea
            placeholder="Description (optional)"
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            rows={2}
            className="w-full rounded-xl border border-lavender px-3 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={values.due_date}
              onChange={(e) => setValues((v) => ({ ...v, due_date: e.target.value }))}
              className="rounded-xl border border-lavender px-3 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
            />
            <select
              value={values.priority}
              onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value as TaskFormValues['priority'] }))}
              className="rounded-xl border border-lavender px-3 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">No priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {assigneeOptions ? (
            <select
              value={values.assigned_to}
              onChange={(e) => setValues((v) => ({ ...v, assigned_to: e.target.value }))}
              className="w-full rounded-xl border border-lavender px-3 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : null}

          {eventOptions ? (
            <select
              value={values.event_id}
              onChange={(e) => setValues((v) => ({ ...v, event_id: e.target.value }))}
              className="w-full rounded-xl border border-lavender px-3 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">No event</option>
              {eventOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : null}

          {statusOptions ? (
            <select
              value={values.status}
              onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
              className="w-full rounded-xl border border-lavender px-3 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-primary text-white font-semibold py-2.5 mt-2 transition-transform active:scale-[0.98] hover:bg-primary/90"
          >
            Save ✦
          </button>
        </form>
      </div>
    </div>
  )
}