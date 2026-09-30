import { NavLink } from 'react-router-dom'
import StarIcon from './StarIcon'
import ThemeToggle from './ThemeToggle'
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

interface DesktopSidebarProps {
  chatUnreadCount: number
}

export default function DesktopSidebar({
  chatUnreadCount,
}: DesktopSidebarProps) {
  const { profile } = useAuth()

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-lavender/60 bg-white/60 backdrop-blur-sm px-4 py-6 dark:bg-[#1d1525]/90">
      {/* Sidebar heading */}
      <div className="px-2 mb-8">
        <p className="text-xs tracking-[0.3em] text-muted">
          ✦ ⋆ ✧
        </p>

        <h1 className="text-xl font-extrabold text-deep tracking-wide">
          CLUB SPACE
        </h1>
      </div>

      {/* Navigation */}
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
                <StarIcon
                  glyph={item.glyph}
                  active={isActive}
                  size={16}
                  onClick={() => undefined}
                />

                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">
                    {item.label}
                  </span>

                  {item.to === '/chat' &&
                  chatUnreadCount > 0 ? (
                    <span className="min-w-5 shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                      {chatUnreadCount > 9
                        ? '9+'
                        : chatUnreadCount}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom-left controls */}
      <div className="mt-auto px-2 pt-6">
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {profile ? (
            <div className="min-w-0">
              <p className="text-xs text-muted truncate">
                Signed in as
              </p>

              <p className="text-xs font-medium text-deep truncate">
                {profile.display_name}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}