import { NavLink } from 'react-router-dom'
import StarIcon from './StarIcon'
import ThemeToggle from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/', glyph: '✦', label: 'Home' },
  { to: '/tasks', glyph: '✧', label: 'Tasks' },
  { to: '/club-tasks', glyph: '✦', label: 'Club' },
  { to: '/chat', glyph: '✧', label: 'Chat' },
  { to: '/members', glyph: '✦', label: 'Members' },
  { to: '/profile', glyph: '✧', label: 'Profile' },
]

interface MobileBottomNavProps {
  chatUnreadCount: number
}

export default function MobileBottomNav({
  chatUnreadCount,
}: MobileBottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[calc(4.5rem+env(safe-area-inset-bottom))] border-t border-lavender/60 bg-white/90 backdrop-blur-sm transition-colors duration-500 dark:bg-[#1d1525]/95"
      style={{
        paddingBottom:
          'env(safe-area-inset-bottom)',
      }}
    >
      <div className="relative h-full">
        {/* Theme switcher */}
        <div className="absolute left-2 top-1/2 z-10 -translate-y-1/2">
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <ul className="flex h-full pl-14 pr-1">
          {NAV_ITEMS.map((item) => (
            <li
              key={item.to}
              className="flex-1"
            >
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex h-full flex-col items-center justify-center gap-1',
                    'min-h-[44px] py-2 text-[10px] font-medium',
                    'transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <StarIcon
                        glyph={item.glyph}
                        active={isActive}
                        size={18}
                        onClick={() => undefined}
                      />

                      {item.to === '/chat' &&
                      chatUnreadCount > 0 ? (
                        <span className="absolute -right-3 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                          {chatUnreadCount > 9
                            ? '9+'
                            : chatUnreadCount}
                        </span>
                      ) : null}
                    </span>

                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}