import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Paperclip, Send, X } from 'lucide-react'
import { supabase, CLUB_ID, friendlyError } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useClub } from '../context/ClubContext'
import ChatMessageBubble from '../components/ChatMessageBubble'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import type { ChatMessage, Profile } from '../types'

type Row = ChatMessage & { profile?: Profile; attachmentUrl?: string | null }

export default function ClubChat() {
  const { user } = useAuth()
  const { members } = useClub()
  const [messages, setMessages] = useState<Row[] | null>(null)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<Row | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, profile:profiles(*)')
      .eq('club_id', CLUB_ID)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) {
      setError(friendlyError(error))
      return
    }
    const rows = (data as Row[]) ?? []
    const hydrated = await Promise.all(
      rows.map(async (row) => {
        if (!row.attachment_path) return { ...row, attachmentUrl: null }
        const { data: signed } = await supabase.storage.from('club-chat').createSignedUrl(row.attachment_path, 3600)
        return { ...row, attachmentUrl: signed?.signedUrl ?? null }
      })
    )
    setMessages(hydrated)
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel(`chat-${CLUB_ID}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `club_id=eq.${CLUB_ID}` },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!user || !text.trim()) return
    setError(null)

    if (editingId) {
      const { error } = await supabase
        .from('chat_messages')
        .update({ message: text.trim(), updated_at: new Date().toISOString() })
        .eq('id', editingId)
      if (error) setError(friendlyError(error))
      setEditingId(null)
      setText('')
      return
    }

    const { error } = await supabase.from('chat_messages').insert({
      club_id: CLUB_ID,
      sender_id: user.id,
      message: text.trim(),
      reply_to: replyTo?.id ?? null,
    })
    if (error) setError(friendlyError(error))
    setText('')
    setReplyTo(null)
  }

  async function handleAttach(files: FileList | null) {
    if (!files || !files[0] || !user) return
    const file = files[0]
    const path = `${CLUB_ID}/chat/${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('club-chat').upload(path, file)
    if (uploadError) {
      setError(friendlyError(uploadError))
      return
    }
    await supabase.from('chat_messages').insert({
      club_id: CLUB_ID,
      sender_id: user.id,
      message: null,
      attachment_path: path,
      attachment_type: file.type || null,
    })
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('chat_messages').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) setError(friendlyError(error))
  }

  return (
    <div className="flex flex-col h-screen md:h-screen">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-lavender/60 bg-white/70">
        <button className="md:hidden text-muted hover:text-deep" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-bold text-deep">✦ Club Chat</h1>
          <p className="text-xs text-muted">{members.length} members</p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-500 px-5 pt-2">{error}</p> : null}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages === null ? (
          <LoadingSkeleton count={4} />
        ) : messages.length === 0 ? (
          <EmptyState glyph="⋆" title="Quiet for now" subtitle="Someone should say hello." />
        ) : (
          messages.map((m) => (
            <ChatMessageBubble
              key={m.id}
              message={m.message}
              senderName={m.profile?.display_name ?? 'Member'}
              avatarUrl={m.profile?.avatar_url ?? null}
              createdAt={m.created_at}
              isOwn={m.sender_id === user?.id}
              edited={m.updated_at !== m.created_at}
              replyToText={m.reply_to ? messages.find((x) => x.id === m.reply_to)?.message ?? null : null}
              attachmentUrl={m.attachmentUrl ?? null}
              attachmentType={m.attachment_type}
              onEdit={() => {
                setEditingId(m.id)
                setText(m.message ?? '')
              }}
              onDelete={() => handleDelete(m.id)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {replyTo ? (
        <div className="flex items-center justify-between px-5 py-2 bg-lavender/30 text-xs text-deep">
          <span className="truncate">Replying to: {replyTo.message}</span>
          <button onClick={() => setReplyTo(null)} aria-label="Cancel reply">
            <X size={14} />
          </button>
        </div>
      ) : null}

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-lavender/60 bg-white/80"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
          className="p-2.5 min-h-[44px] min-w-[44px] rounded-full text-muted hover:text-primary hover:bg-lavender/40"
        >
          <Paperclip size={18} />
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleAttach(e.target.files)} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(e)
            }
          }}
          placeholder={editingId ? 'Edit your message…' : 'Say something...'}
          className="flex-1 rounded-full border border-lavender px-4 py-2.5 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="p-2.5 min-h-[44px] min-w-[44px] rounded-full bg-primary text-white hover:bg-primary/90 active:scale-95 transition-transform"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}