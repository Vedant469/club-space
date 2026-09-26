import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StarField from '../components/StarField'

export default function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(identifier, password)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-lavender/40 to-pink/30 px-4 overflow-hidden">
      <StarField count={24} className="text-primary/30" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-2xl text-primary">✦</p>
          <h1 className="text-2xl font-extrabold tracking-widest text-deep mt-1">CLUB SPACE</h1>
          <p className="text-sm text-muted mt-1">your creative space</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-card bg-white/80 backdrop-blur-sm border border-lavender/70 shadow-soft p-6 space-y-4"
        >
          {error ? <p className="text-sm text-red-500 text-center">{error}</p> : null}

          <input
            required
            placeholder="Username or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-xl border border-lavender px-4 py-3 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-lavender px-4 py-3 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary text-white font-semibold py-3 transition-transform active:scale-[0.98] hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login ✦'}
          </button>

          <p className="text-center text-sm text-muted">
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Create account
            </Link>
          </p>
        </form>

        <p className="text-center text-lg tracking-widest text-primary/40 mt-6">✦ ⋆ ✧</p>
      </div>
    </div>
  )
}