import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (
    identifier: string,
    password: string
  ) => Promise<{ error: string | null }>
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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        setProfile(null)
        return
      }

      setProfile((data as Profile | null) ?? null)
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          setSession(null)
          setProfile(null)
          setLoading(false)
          return
        }

        setSession(data.session)

        if (data.session) {
          await loadProfile(data.session.user.id)
        } else {
          setProfile(null)
        }
      } catch {
        if (mounted) {
          setSession(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return

      setSession(newSession)

      if (newSession) {
        // Keep profile loading out of the auth callback.
        window.setTimeout(() => {
          if (mounted) {
            void loadProfile(newSession.user.id)
          }
        }, 0)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(
    identifier: string,
    password: string
  ): Promise<{ error: string | null }> {
    try {
      const cleanIdentifier = identifier.trim().toLowerCase()

      if (!cleanIdentifier || !password) {
        return {
          error: 'Enter your username/email and password.',
        }
      }

      /*
       * Username login:
       * username + password
       *        ↓
       * sign-in-with-username Edge Function
       *        ↓
       * authenticated Supabase session
       */
      if (!cleanIdentifier.includes('@')) {
        const { data, error } = await supabase.functions.invoke(
          'sign-in-with-username',
          {
            body: {
              username: cleanIdentifier,
              password,
            },
          }
        )

        if (error || !data?.session) {
          return {
            error: data?.error ?? 'Incorrect username or password.',
          }
        }

        const { error: sessionError } =
          await supabase.auth.setSession(data.session)

        if (sessionError) {
          return {
            error: 'Incorrect username or password.',
          }
        }

        return { error: null }
      }

      /*
       * Email login stays with Supabase Auth directly.
       */
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanIdentifier,
        password,
      })

      if (error) {
        return {
          error: 'Incorrect username/email or password.',
        }
      }

      return { error: null }
    } catch {
      return {
        error: "We couldn't sign you in right now. Please try again.",
      }
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
        return {
          error: 'Please complete all fields.',
        }
      }

      if (!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)) {
        return {
          error:
            'Username must be 3–32 characters and use letters, numbers, dots, underscores or hyphens.',
        }
      }

      if (cleanDisplayName.length > 80) {
        return {
          error: 'Display name must be 80 characters or fewer.',
        }
      }

      if (password.length < 12) {
        return {
          error: 'Password must be at least 12 characters.',
        }
      }

      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanDisplayName,
          },
        },
      })

      if (error) {
        const message = error.message.toLowerCase()

        if (
          message.includes('already') ||
          message.includes('registered')
        ) {
          return {
            error:
              'That email or username may already be registered.',
          }
        }

        if (
          message.includes('password') ||
          message.includes('weak') ||
          message.includes('pwned')
        ) {
          return {
            error: 'Please choose a stronger password.',
          }
        }

        return {
          error: 'We could not create your account.',
        }
      }

      return { error: null }
    } catch {
      return {
        error: "We couldn't create your account right now. Please try again.",
      }
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } finally {
      setSession(null)
      setProfile(null)
    }
  }

  async function refreshProfile() {
    if (!session) return

    await loadProfile(session.user.id)
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

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}