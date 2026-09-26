import { Pencil, Trash2, Paperclip } from 'lucide-react'
import { formatTime } from '../lib/time'

interface ChatMessageBubbleProps {
  message: string | null
  senderName: string
  avatarUrl?: string | null
  createdAt: string
  isOwn: boolean
  edited?: boolean
  replyToText?: string | null
  attachmentUrl?: string | null
  attachmentType?: string | null
  onEdit?: () => void
  onDelete?: () => void
}

export default function ChatMessageBubble({
  message,
  senderName,
  avatarUrl,
  createdAt,
  isOwn,
  edited,
  replyToText,
  attachmentUrl,
  attachmentType,
  onEdit,
  onDelete,
}: ChatMessageBubbleProps) {
  const isImage = attachmentType?.startsWith('image/')

  return (
    <div className={`group flex gap-2.5 animate-fade-in-up ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn ? (
        <div className="h-8 w-8 rounded-full bg-lavender flex items-center justify-center text-xs font-semibold text-primary overflow-hidden shrink-0">
          {avatarUrl ? <img src={avatarUrl} alt={senderName} className="h-full w-full object-cover" /> : senderName.charAt(0)}
        </div>
      ) : null}

      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn ? <p className="text-xs font-semibold text-primary mb-0.5">{senderName}</p> : null}

        {replyToText ? (
          <div className="text-xs text-muted border-l-2 border-lavender pl-2 mb-1 line-clamp-1">{replyToText}</div>
        ) : null}

        <div
          className={[
            'relative rounded-2xl px-3.5 py-2 text-sm',
            isOwn ? 'bg-primary text-white rounded-br-md' : 'bg-lavender/50 text-deep rounded-bl-md',
          ].join(' ')}
        >
          {attachmentUrl ? (
            isImage ? (
              <img src={attachmentUrl} alt="Attachment" className="rounded-lg max-h-56 mb-1.5 object-cover" />
            ) : (
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-1.5 text-xs underline mb-1.5 ${isOwn ? 'text-white' : 'text-primary'}`}
              >
                <Paperclip size={12} /> Attachment
              </a>
            )
          ) : null}
          {message ? <p>{message}</p> : null}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted">
            {formatTime(createdAt)}
            {edited ? ' · edited' : ''}
          </span>
          {isOwn ? (
            <span className="hidden group-hover:inline-flex items-center gap-1">
              <button onClick={onEdit} aria-label="Edit message" className="text-muted hover:text-deep">
                <Pencil size={11} />
              </button>
              <button onClick={onDelete} aria-label="Delete message" className="text-muted hover:text-red-500">
                <Trash2 size={11} />
              </button>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}