import { NavLink } from 'react-router-dom'
import StarIcon from './StarIcon'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', glyph: '✦', label: 'Home' },
  { to: '/tasks', glyph: '✧', label: 'My Tasks' },
  { to: '/club-tasks', glyph: '✦', label: 'Club Tasks' },
  { to: '/documents', glyph: '✧', label: 'Documents' },
  { to: '/memories', glyph: '✦', label: 'Memories' },
  { to: '/chat', glyph: '✧', label: 'Club Chat' },
  { to: '/members', glyph: '✦', label: 'Members' },
  { to: '/profile', glyph: '✧', label: 'Profile' },
]

export default function DesktopSidebar() {
  const { profile } = useAuth()

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-lavender/60 bg-white/60 backdrop-blur-sm px-4 py-6">
      <div className="px-2 mb-8">
        <p className="text-xs tracking-[0.3em] text-muted">✦ ⋆ ✧</p>
        <h1 className="text-xl font-extrabold text-deep tracking-wide">CLUB SPACE</h1>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-lavender/70 text-primary shadow-glow'
                  : 'text-muted hover:bg-lavender/30 hover:text-deep',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <StarIcon glyph={item.glyph} active={isActive} size={16} onClick={() => undefined} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-2 pt-6 text-xs text-muted">
        {profile ? <p>Signed in as {profile.display_name}</p> : null}
      </div>
    </aside>
  )
}