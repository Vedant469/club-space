import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import StarBurst from './StarBurst'
import { formatDueDate } from '../lib/time'

interface TaskItemProps {
  title: string
  description?: string | null
  dueDate?: string | null
  priority?: 'low' | 'medium' | 'high' | null
  completed: boolean
  assigneeName?: string | null
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-lavender/60 text-primary',
  medium: 'bg-pink/70 text-deep',
  high: 'bg-primary/15 text-primary',
}

export default function TaskItem({
  title,
  description,
  dueDate,
  priority,
  completed,
  assigneeName,
  onToggle,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const [bursting, setBursting] = useState(false)

  function handleToggle() {
    if (!completed) {
      setBursting(true)
      setTimeout(() => setBursting(false), 700)
    }
    onToggle()
  }

  return (
    <div className="group flex items-start gap-3 rounded-card border border-lavender/60 bg-white/70 px-4 py-3.5 transition-shadow hover:shadow-soft">
      <button
        onClick={handleToggle}
        aria-label={completed ? 'Mark task as not done' : 'Mark task as done'}
        className={[
          'relative mt-0.5 flex h-6 w-6 min-w-[24px] items-center justify-center rounded-full border-2 transition-colors',
          completed ? 'border-primary bg-primary text-white' : 'border-lavender text-transparent hover:border-primary',
        ].join(' ')}
      >
        {completed ? '✓' : ''}
        <span className="absolute left-1/2 top-1/2">
          <StarBurst show={bursting} />
        </span>
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${completed ? 'text-muted line-through' : 'text-deep'}`}>{title}</p>
        {description ? <p className="text-xs text-muted mt-0.5 line-clamp-2">{description}</p> : null}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {dueDate ? <span className="text-xs text-muted">{formatDueDate(dueDate)}</span> : null}
          {priority ? (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[priority]}`}>
              {priority}
            </span>
          ) : null}
          {assigneeName ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink/60 text-deep font-medium">
              {assigneeName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} aria-label="Edit task" className="p-1.5 rounded-lg text-muted hover:text-deep hover:bg-lavender/40">
          <Pencil size={15} />
        </button>
        <button onClick={onDelete} aria-label="Delete task" className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}