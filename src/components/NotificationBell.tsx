import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type AppNotification = {
  id: string
  recipient_id: string
  actor_id: string | null
  club_id: string
  type:
    | 'chat_message'
    | 'task_assigned'
    | 'event_created'
    | 'document_added'
  title: string
  body: string
  link: string | null
  entity_id: string | null
  read_at: string | null
  created_at: string
}

function relativeTime(value: string): string {
  const seconds = Math.max(
    1,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  )

  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(value).toLocaleDateString()
}

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    const userID = user.id
    let active = true

    async function load() {
      setLoading(true)

      const [listResult, countResult] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', userID)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', userID)
          .is('read_at', null),
      ])

      if (!active) return

      if (!listResult.error) {
        setNotifications(
          (listResult.data as AppNotification[]) ?? []
        )
      }

      setUnreadCount(
        countResult.error ? 0 : countResult.count ?? 0
      )
      setLoading(false)
    }

    void load()

    const channel = supabase
      .channel(`notifications-${userID}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userID}`,
        },
        (payload) => {
          const notification =
            payload.new as AppNotification

          setNotifications((current) =>
            [notification, ...current].slice(0, 30)
          )
          setUnreadCount((current) => current + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userID}`,
        },
        (payload) => {
          const notification =
            payload.new as AppNotification

          setNotifications((current) =>
            current.map((item) =>
              item.id === notification.id
                ? notification
                : item
            )
          )
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )
    }
  }, [])

  async function markRead(
    notification: AppNotification
  ) {
    if (!user || notification.read_at) return

    const readAt = new Date().toISOString()

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('id', notification.id)
      .eq('recipient_id', user.id)

    if (error) return

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, read_at: readAt }
          : item
      )
    )

    setUnreadCount((current) =>
      Math.max(0, current - 1)
    )
  }

  async function markAllRead() {
    if (!user || unreadCount === 0) return

    const readAt = new Date().toISOString()

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('recipient_id', user.id)
      .is('read_at', null)

    if (error) return

    setNotifications((current) =>
      current.map((item) =>
        item.read_at
          ? item
          : { ...item, read_at: readAt }
      )
    )
    setUnreadCount(0)
  }

  async function handleOpen(
    notification: AppNotification
  ) {
    await markRead(notification)
    setOpen(false)

    if (notification.link) {
      navigate(notification.link)
    }
  }

  if (!user) return null

  return (
    <div
      ref={wrapperRef}
      className="fixed right-4 top-4 z-[50] md:right-6 md:top-5"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : 'Notifications'
        }
        className="relative h-10 w-10 rounded-full border border-lavender/70 bg-white/90 text-primary shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-glow dark:bg-[#251b32]"
      >
        <Bell size={18} className="mx-auto" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-lotus px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-lavender/60 bg-white shadow-soft dark:bg-[#1d1525]">
          <div className="flex items-center justify-between border-b border-lavender/60 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-deep">
                Notifications
              </h2>

              <p className="text-[11px] text-muted">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void markAllRead()}
                disabled={unreadCount === 0}
                aria-label="Mark all notifications as read"
                className="rounded-full p-2 text-muted transition hover:bg-lavender/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                <CheckCheck size={16} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="rounded-full p-2 text-muted transition hover:bg-lavender/40 hover:text-deep"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[70dvh] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                Loading notifications…
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell
                  size={24}
                  className="mx-auto mb-2 text-muted"
                />

                <p className="text-sm font-medium text-deep">
                  No notifications yet
                </p>

                <p className="mt-1 text-xs text-muted">
                  Task assignments, new events, and documents
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-lavender/50">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      void handleOpen(notification)
                    }
                    className={`block w-full px-4 py-3 text-left transition ${
                      notification.read_at
                        ? 'bg-transparent hover:bg-lavender/20'
                        : 'bg-lavender/20 hover:bg-lavender/30'
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          notification.read_at
                            ? 'bg-muted/30'
                            : 'bg-primary'
                        }`}
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-deep">
                          {notification.title}
                        </p>

                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                          {notification.body}
                        </p>

                        <p className="mt-1 text-[10px] text-muted">
                          {relativeTime(
                            notification.created_at
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
