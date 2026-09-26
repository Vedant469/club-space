import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Pencil } from 'lucide-react'
import { supabase, friendlyError } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useClub } from '../context/ClubContext'

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { club, role } = useClub()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  async function handleSaveName() {
    if (!user || !displayName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      setError(friendlyError(error))
      return
    }
    refreshProfile()
  }

  async function handleAvatarUpload(files: FileList | null) {
    if (!files?.[0] || !user) return
    const file = files[0]
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) {
      setError(friendlyError(uploadError))
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
    if (error) {
      setError(friendlyError(error))
      return
    }
    refreshProfile()
  }

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="px-5 sm:px-8 py-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-deep">✦ Profile</h1>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="rounded-card bg-white/70 border border-lavender/60 p-6 flex items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-lavender flex items-center justify-center text-xl font-semibold text-primary overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
            ) : (
              profile?.display_name?.charAt(0) ?? '✦'
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change avatar"
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-white shadow-soft"
          >
            <Pencil size={11} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files)} />
        </div>
        <div>
          <p className="font-bold text-deep text-lg">{profile?.display_name}</p>
          <p className="text-sm text-muted">@{profile?.username}</p>
        </div>
      </div>

      <div className="rounded-card bg-white/70 border border-lavender/60 p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Display name</label>
          <div className="flex gap-2 mt-1.5">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 rounded-xl border border-lavender px-3 py-2 text-sm text-deep outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={handleSaveName}
              disabled={saving}
              className="rounded-xl bg-primary text-white text-sm font-medium px-4 hover:bg-primary/90 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Email</label>
          <p className="text-sm text-deep mt-1">{user?.email}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Club membership</label>
          <p className="text-sm text-deep mt-1">
            {club?.name ?? '—'} {role ? <span className="text-xs text-primary ml-1 uppercase">{role}</span> : null}
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 justify-center w-full rounded-xl border border-lavender text-deep font-medium py-3 hover:bg-lavender/30 transition-colors"
      >
        <LogOut size={16} /> Log out
      </button>
    </div>
  )
}