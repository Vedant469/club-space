import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, CLUB_ID } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Club, ClubMember, Profile, Role } from '../types'

interface ClubContextValue {
  club: Club | null
  role: Role | null
  members: (ClubMember & { profile?: Profile })[]
  isAdmin: boolean
  loading: boolean
}

const ClubContext = createContext<ClubContextValue | undefined>(undefined)

export function ClubProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [club, setClub] = useState<Club | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [members, setMembers] = useState<(ClubMember & { profile?: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setClub(null)
      setRole(null)
      setMembers([])
      setLoading(false)
      return
    }

    let active = true

    async function load() {
      setLoading(true)
      const [{ data: clubData }, { data: memberRows }] = await Promise.all([
        supabase.from('clubs').select('*').eq('id', CLUB_ID).single(),
        supabase.from('club_members').select('*, profile:profiles(*)').eq('club_id', CLUB_ID),
      ])
      if (!active) return
      setClub((clubData as Club) ?? null)
      const rows = (memberRows as (ClubMember & { profile?: Profile })[]) ?? []
      setMembers(rows)
      const mine = user ? rows.find((r) => r.user_id === user.id) : undefined
      setRole(mine?.role ?? null)
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [user?.id])

  return (
    <ClubContext.Provider value={{ club, role, members, isAdmin: role === 'admin', loading }}>
      {children}
    </ClubContext.Provider>
  )
}

export function useClub(): ClubContextValue {
  const ctx = useContext(ClubContext)
  if (!ctx) throw new Error('useClub must be used within ClubProvider')
  return ctx
}