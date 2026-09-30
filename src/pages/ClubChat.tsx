import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { ArrowLeft, Paperclip, Send, X } from 'lucide-react'
import {
  supabase,
  CLUB_ID,
  friendlyError,
} from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useClub } from '../context/ClubContext'
import ChatMessageBubble from '../components/ChatMessageBubble'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import {
  markClubChatRead,
} from '../hooks/useUnreadChatCount'
import type { ChatMessage, Profile } from '../types'

type Row = ChatMessage & {
  profile?: Profile
  attachmentUrl?: string | null
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'csv',
  'txt',
  'png',
  'jpg',
  'jpeg',
  'webp',
])

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
])

export default function ClubChat() {
  const { user } = useAuth()
  const { members } = useClub()

  const [messages, setMessages] =
    useState<Row[] | null>(null)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] =
    useState<Row | null>(null)
  const [editingId, setEditingId] =
    useState<string | null>(null)
  const [error, setError] =
    useState<string | null>(null)

  const fileInputRef =
    useRef<HTMLInputElement>(null)
  const bottomRef =
    useRef<HTMLDivElement>(null)

  async function hydrateRealtimeRow(
    row: Row,
    existing?: Row
  ): Promise<Row> {
    let profile = existing?.profile

    if (
      !profile ||
      profile.id !== row.sender_id
    ) {
      const { data: profileData } =
        await supabase
          .from('profiles')
          .select('*')
          .eq('id', row.sender_id)
          .maybeSingle()

      profile =
        (profileData as Profile | null) ??
        undefined
    }

    let attachmentUrl =
      existing?.attachmentUrl ?? null

    if (
      row.attachment_path !==
      existing?.attachment_path
    ) {
      attachmentUrl = null

      if (row.attachment_path) {
        const { data: signed } =
          await supabase.storage
            .from('club-chat')
            .createSignedUrl(
              row.attachment_path,
              3600
            )

        attachmentUrl =
          signed?.signedUrl ?? null
      }
    }

    return {
      ...row,
      profile,
      attachmentUrl,
    }
  }

  async function load() {
    const { data, error } =
      await supabase
        .from('chat_messages')
        .select(
          '*, profile:profiles(*)'
        )
        .eq('club_id', CLUB_ID)
        .is('deleted_at', null)
        .order('created_at', {
          ascending: true,
        })
        .limit(100)

    if (error) {
      setError(friendlyError(error))
      return
    }

    const rows =
      (data as Row[]) ?? []

    const hydrated =
      await Promise.all(
        rows.map((row) =>
          hydrateRealtimeRow(row)
        )
      )

    setMessages(hydrated)
  }

  useEffect(() => {
    void load()

    const channel = supabase
      .channel(`chat-${CLUB_ID}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `club_id=eq.${CLUB_ID}`,
        },
        async (payload) => {
          const row =
            payload.new as Row

          if (row.deleted_at) {
            return
          }

          const hydrated =
            await hydrateRealtimeRow(row)

          setMessages((prev) => {
            if (!prev) {
              return [hydrated]
            }

            if (
              prev.some(
                (message) =>
                  message.id ===
                  hydrated.id
              )
            ) {
              return prev
            }

            return [
              ...prev,
              hydrated,
            ].slice(-100)
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `club_id=eq.${CLUB_ID}`,
        },
        async (payload) => {
          const row =
            payload.new as Row

          if (row.deleted_at) {
            setMessages((prev) => {
              if (!prev) {
                return null
              }

              return prev.filter(
                (message) =>
                  message.id !== row.id
              )
            })

            return
          }

          let existing: Row | undefined

          setMessages((prev) => {
            if (!prev) {
              return prev
            }

            existing = prev.find(
              (message) =>
                message.id === row.id
            )

            if (!existing) {
              return prev
            }

            return prev.map(
              (message) =>
                message.id === row.id
                  ? {
                      ...message,
                      ...row,
                    }
                  : message
            )
          })

          if (existing) {
            const hydrated =
              await hydrateRealtimeRow(
                row,
                existing
              )

            setMessages((prev) => {
              if (!prev) {
                return null
              }

              return prev.map(
                (message) =>
                  message.id === row.id
                    ? hydrated
                    : message
              )
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `club_id=eq.${CLUB_ID}`,
        },
        (payload) => {
          const row =
            payload.old as Row

          setMessages((prev) => {
            if (!prev) {
              return null
            }

            return prev.filter(
              (message) =>
                message.id !== row.id
            )
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(
        channel
      )
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

  useEffect(() => {
    const latestMessageId =
      messages?.[messages.length - 1]?.id ??
      null

    if (!user || !latestMessageId) {
      return
    }

    void markClubChatRead(user.id)
  }, [
    user?.id,
    messages?.[messages?.length - 1]?.id,
  ])

  async function handleSend(
    e: FormEvent
  ) {
    e.preventDefault()

    if (!user || !text.trim()) {
      return
    }

    setError(null)

    if (editingId) {
      const { error } =
        await supabase
          .from('chat_messages')
          .update({
            message: text.trim(),
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', editingId)

      if (error) {
        setError(
          friendlyError(error)
        )
        return
      }

      setEditingId(null)
      setText('')
      return
    }

    const { error } =
      await supabase
        .from('chat_messages')
        .insert({
          club_id: CLUB_ID,
          sender_id: user.id,
          message: text.trim(),
          reply_to:
            replyTo?.id ?? null,
        })

    if (error) {
      setError(
        friendlyError(error)
      )
      return
    }

    setText('')
    setReplyTo(null)
  }

  async function handleAttach(
    files: FileList | null
  ) {
    if (!files?.[0] || !user) {
      return
    }

    setError(null)

    const file = files[0]

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase() ?? ''

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `"${file.name}" is too large. Maximum file size is 10 MB.`
      )
      return
    }

    if (
      !ALLOWED_EXTENSIONS.has(
        extension
      ) ||
      (file.type &&
        !ALLOWED_MIME_TYPES.has(
          file.type
        ))
    ) {
      setError(
        `"${file.name}" is not a supported file type.`
      )
      return
    }

    const path =
      `${CLUB_ID}/chat/${crypto.randomUUID()}-${file.name}`

    const { error: uploadError } =
      await supabase.storage
        .from('club-chat')
        .upload(
          path,
          file
        )

    if (uploadError) {
      setError(
        friendlyError(uploadError)
      )
      return
    }

    const {
      error: insertError,
    } = await supabase
      .from('chat_messages')
      .insert({
        club_id: CLUB_ID,
        sender_id: user.id,
        message: null,
        attachment_path: path,
        attachment_type:
          file.type || null,
      })

    if (insertError) {
      await supabase.storage
        .from('club-chat')
        .remove([path])

      setError(
        friendlyError(insertError)
      )
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleDelete(
    id: string
  ) {
    const message =
      messages?.find(
        (item) =>
          item.id === id
      )

    const confirmed =
      window.confirm(
        `Delete this message?\n\n${
          message?.message
            ? `"${message.message.slice(
                0,
                100
              )}${
                message.message.length >
                100
                  ? '…'
                  : ''
              }"`
            : 'This message contains an attachment.'
        }\n\nThis action cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    const { error } =
      await supabase
        .from('chat_messages')
        .update({
          deleted_at:
            new Date().toISOString(),
        })
        .eq('id', id)

    if (error) {
      setError(
        friendlyError(error)
      )
    }
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col md:h-screen">
      {/* Chat header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-lavender/60 bg-white/70 px-5 py-4 dark:bg-[#1d1525]/90">
        <button
          className="md:hidden text-muted hover:text-deep"
          aria-label="Back"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="font-bold text-deep">
            ✦ Club Chat
          </h1>

          <p className="text-xs text-muted">
            {members.length} members
          </p>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <p className="shrink-0 px-5 pt-2 text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-24 sm:px-5 md:py-4 md:pb-4 space-y-4">
        {messages === null ? (
          <LoadingSkeleton count={4} />
        ) : messages.length === 0 ? (
          <EmptyState
            glyph="⋆"
            title="Quiet for now"
            subtitle="Someone should say hello."
          />
        ) : (
          messages.map((m) => (
            <ChatMessageBubble
              key={m.id}
              message={m.message}
              senderName={
                m.profile
                  ?.display_name ??
                'Member'
              }
              avatarUrl={
                m.profile?.avatar_url ??
                null
              }
              createdAt={
                m.created_at
              }
              isOwn={
                m.sender_id ===
                user?.id
              }
              edited={
                m.updated_at !==
                m.created_at
              }
              replyToText={
                m.reply_to
                  ? messages.find(
                      (item) =>
                        item.id ===
                        m.reply_to
                    )?.message ??
                    null
                  : null
              }
              attachmentUrl={
                m.attachmentUrl ??
                null
              }
              attachmentType={
                m.attachment_type
              }
              onReply={() => {
  setReplyTo(m)
  setEditingId(null)
  setText('')
}}
              onEdit={() => {
                setEditingId(
                  m.id
                )
                setText(
                  m.message ?? ''
                )
              }}
              onDelete={() =>
                handleDelete(
                  m.id
                )
              }
            />
          ))
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo ? (
        <div className="flex shrink-0 items-center justify-between bg-lavender/30 px-5 py-2 text-xs text-deep">
          <span className="truncate">
            Replying to:{' '}
            {replyTo.message}
          </span>

          <button
            type="button"
            onClick={() =>
              setReplyTo(null)
            }
            aria-label="Cancel reply"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 border-t border-lavender/60 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-md sm:px-4 md:static md:z-auto md:shrink-0 dark:bg-[#1d1525]/95"
      >
        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          aria-label="Attach file"
          className="min-h-[44px] min-w-[44px] rounded-full p-2.5 text-muted transition-colors hover:bg-lavender/40 hover:text-primary"
        >
          <Paperclip size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) =>
            handleAttach(
              e.target.files
            )
          }
        />

        <input
          value={text}
          onChange={(e) =>
            setText(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !e.shiftKey
            ) {
              e.preventDefault()
              void handleSend(e)
            }
          }}
          placeholder={
            editingId
              ? 'Edit your message…'
              : 'Say something...'
          }
          className="min-w-0 flex-1 rounded-full border border-lavender bg-white px-4 py-2.5 text-sm text-deep outline-none transition focus:ring-2 focus:ring-primary/40 dark:bg-[#1d1525]"
        />

        <button
          type="submit"
          aria-label="Send message"
          className="min-h-[44px] min-w-[44px] rounded-full bg-primary p-2.5 text-white transition-transform hover:bg-primary/90 active:scale-95"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}