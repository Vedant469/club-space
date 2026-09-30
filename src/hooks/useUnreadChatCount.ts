import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase, CLUB_ID } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export async function markClubChatRead(userId: string) {
  const now = new Date().toISOString()

  await supabase
    .from('chat_read_status')
    .upsert(
      {
        club_id: CLUB_ID,
        user_id: userId,
        last_read_at: now,
        updated_at: now,
      },
      {
        onConflict: 'club_id,user_id',
      }
    )
}

export function useUnreadChatCount() {
  const { user } = useAuth()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user || location.pathname === '/chat') {
      setUnreadCount(0)
      return
    }

    const userId = user.id
    let active = true

    async function loadUnreadCount() {
      const { data: readStatus } = await supabase
        .from('chat_read_status')
        .select('last_read_at')
        .eq('club_id', CLUB_ID)
        .eq('user_id', userId)
        .maybeSingle()

      if (!active) return

      let lastReadAt =
        (readStatus as { last_read_at: string } | null)
          ?.last_read_at

      // First time using chat:
      // don't show the entire old chat history as unread.
      if (!lastReadAt) {
        lastReadAt = new Date().toISOString()

        await supabase
          .from('chat_read_status')
          .upsert(
            {
              club_id: CLUB_ID,
              user_id: userId,
              last_read_at: lastReadAt,
              updated_at: lastReadAt,
            },
            {
              onConflict: 'club_id,user_id',
            }
          )

        if (active) {
          setUnreadCount(0)
        }

        return
      }

      const { count, error } = await supabase
        .from('chat_messages')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('club_id', CLUB_ID)
        .neq('sender_id', userId)
        .is('deleted_at', null)
        .gt('created_at', lastReadAt)

      if (!active) return

      setUnreadCount(error ? 0 : count ?? 0)
    }

    void loadUnreadCount()

    const channel = supabase
      .channel(`chat-unread-${CLUB_ID}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `club_id=eq.${CLUB_ID}`,
        },
        (payload) => {
          const row = payload.new as {
            sender_id: string
            deleted_at: string | null
          }

          if (
            row.sender_id === userId ||
            row.deleted_at
          ) {
            return
          }

          setUnreadCount((current) => current + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_read_status',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadCount(0)
        }
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [user?.id, location.pathname])

  return unreadCount
}