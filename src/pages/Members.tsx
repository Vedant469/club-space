import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  ShieldCheck,
  ShieldOff,
  Users,
  XCircle,
} from 'lucide-react'
import { supabase, CLUB_ID, friendlyError } from '../lib/supabase'
import { useClub } from '../context/ClubContext'
import type { Role } from '../types'

interface MemberRow {
  id: string
  club_id: string
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  role: Role
  created_at: string
  email_verified: boolean
}

export default function Members() {
  const { isAdmin } = useClub()

  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadMembers() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.rpc('list_club_members', {
      _club_id: CLUB_ID,
    })

    if (error) {
      setError(friendlyError(error))
      setMembers([])
    } else {
      setMembers((data as MemberRow[]) ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadMembers()
  }, [])

  async function changeRole(member: MemberRow) {
    if (!isAdmin) return

    const nextRole: Role =
      member.role === 'admin' ? 'member' : 'admin'

    const action =
      nextRole === 'admin'
        ? `make ${member.display_name} an admin`
        : `remove admin access from ${member.display_name}`

    if (!window.confirm(`Are you sure you want to ${action}?`)) {
      return
    }

    setChanging(member.user_id)
    setError(null)

    const { error } = await supabase.rpc('set_club_member_role', {
      _club_id: CLUB_ID,
      _user_id: member.user_id,
      _role: nextRole,
    })

    setChanging(null)

    if (error) {
      setError(error.message || 'Could not change member role.')
      return
    }

    await loadMembers()
  }

  async function verifyEmail(member: MemberRow) {
    if (!isAdmin || member.email_verified) return

    const confirmed = window.confirm(
      `Verify ${member.display_name}'s email manually?\n\n` +
        `This will mark their email as verified in Club Space.`
    )

    if (!confirmed) return

    setVerifying(member.user_id)
    setError(null)

    try {
      const { data, error } = await supabase.functions.invoke(
        'admin-verify-member',
        {
          body: {
            club_id: CLUB_ID,
            user_id: member.user_id,
          },
        }
      )

      if (error || !data?.verified) {
        setError(
          data?.error || 'Could not verify this member.'
        )
        return
      }

      await loadMembers()
    } catch {
      setError('Could not verify this member.')
    } finally {
      setVerifying(null)
    }
  }

  return (
    <div className="px-5 sm:px-8 py-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={24} />

          <h1 className="text-2xl font-extrabold text-deep">
            Club Members
          </h1>
        </div>

        <p className="text-sm text-muted mt-1">
          Everyone in your creative space
        </p>
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* Loading */}
      {loading ? (
        <div className="rounded-card bg-white/70 border border-lavender/60 p-6 text-sm text-muted">
          Loading members…
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-card bg-white/70 border border-lavender/60 p-4 sm:p-5"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-12 w-12 shrink-0 rounded-full bg-lavender flex items-center justify-center text-primary font-bold overflow-hidden">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    member.display_name
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>

                {/* Member info */}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-deep truncate">
                    {member.display_name}
                  </p>

                  <p className="text-sm text-muted truncate">
                    @{member.username}
                  </p>

                  {/* Role */}
                  <span
                    className={[
                      'inline-flex items-center gap-1 mt-2 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                      member.role === 'admin'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-lavender/50 text-muted',
                    ].join(' ')}
                  >
                    {member.role === 'admin' ? (
                      <ShieldCheck size={12} />
                    ) : null}

                    {member.role}
                  </span>

                  {/* Email verification */}
                  <div className="mt-2">
                    {member.email_verified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 size={13} />
                        Email verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <XCircle size={13} />
                        Email not verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin controls */}
                {isAdmin ? (
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {/* Verify email */}
                    {!member.email_verified ? (
                      <button
                        onClick={() =>
                          void verifyEmail(member)
                        }
                        disabled={
                          verifying === member.user_id
                        }
                        className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {verifying === member.user_id
                          ? 'Verifying…'
                          : 'Verify Email'}
                      </button>
                    ) : null}

                    {/* Role */}
                    <button
                      onClick={() =>
                        void changeRole(member)
                      }
                      disabled={
                        changing === member.user_id
                      }
                      className="rounded-xl border border-lavender px-3 py-2 text-xs font-semibold text-primary hover:bg-lavender/30 disabled:opacity-50"
                    >
                      {changing === member.user_id
                        ? 'Updating…'
                        : member.role === 'admin'
                          ? 'Remove Admin'
                          : 'Make Admin'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {members.length === 0 ? (
            <div className="rounded-card bg-white/70 border border-lavender/60 p-8 text-center text-sm text-muted">
              No members found.
            </div>
          ) : null}
        </div>
      )}

      {/* Admin note */}
      {isAdmin ? (
        <p className="text-xs text-muted flex items-center gap-1">
          <ShieldOff size={13} />
          Admin controls are protected by the database.
        </p>
      ) : null}
    </div>
  )
}