import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      setProfile(null)
      return
    }
    setProfile((data as Profile | null) ?? null)
  }

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      if (mounted) setLoading(false)
    }

    void bootstrap()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        // Defer the profile query so it never blocks Supabase's auth callback.
        window.setTimeout(() => void loadProfile(newSession.user.id), 0)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signIn(identifier: string, password: string): Promise<{ error: string | null }> {
    try {
      let email = identifier.trim().toLowerCase()
      if (!email) return { error: 'Enter your username or email.' }

      if (!email.includes('@')) {
        const { data, error } = await supabase.rpc('get_email_for_username', {
          _username: email,
        })
        if (error || !data) return { error: 'We could not find that account.' }
        email = String(data)
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: 'Incorrect username/email or password.' }
      return { error: null }
    } catch {
      return { error: "We couldn't sign you in right now. Please try again." }
    }
  }

  async function signUp(
    email: string,
    password: string,
    username: string,
    displayName: string
  ): Promise<{ error: string | null }> {
    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanUsername = username.trim().toLowerCase()
      const cleanDisplayName = displayName.trim()

      if (!cleanEmail || !cleanUsername || !cleanDisplayName) {
        return { error: 'Please complete all fields.' }
      }
      if (!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)) {
        return { error: 'Username must be 3–32 characters and use letters, numbers, dots, underscores or hyphens.' }
      }

      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { username: cleanUsername, display_name: cleanDisplayName } },
      })
      if (error) {
        if (error.message.toLowerCase().includes('already')) return { error: 'That email or username is already registered.' }
        if (error.message.toLowerCase().includes('password')) return { error: 'Please choose a stronger password.' }
        return { error: 'We could not create your account.' }
      }
      return { error: null }
    } catch {
      return { error: "We couldn't create your account right now. Please try again." }
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
