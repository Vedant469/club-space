import { NavLink } from 'react-router-dom'
import StarIcon from './StarIcon'
import ThemeToggle from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/', glyph: '✦', label: 'Home' },
  { to: '/tasks', glyph: '✧', label: 'Tasks' },
  { to: '/club-tasks', glyph: '✦', label: 'Club' },
  { to: '/chat', glyph: '✧', label: 'Chat' },
  { to: '/members', glyph: '✦', label: 'Members' },
]

export default function MobileBottomNav() {
  return (
    <>
      {/* Mobile logo */}
      <div className="md:hidden fixed top-3 right-3 z-[60]">
        <div className="flex items-center rounded-full border border-lavender/60 bg-white/80 px-2 py-1.5 shadow-soft backdrop-blur-md dark:bg-[#1b1627]/90">
          <img
            src="/logo.jpeg"
            alt="Student Well-being Initiative"
            className="h-9 w-auto max-w-[135px] object-contain"
          />
        </div>
      </div>

      {/* Mobile theme switcher */}
      <div className="md:hidden fixed left-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50">
        <ThemeToggle />
      </div>

      {/* Bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[4.5rem] border-t border-lavender/60 bg-white/90 backdrop-blur-sm transition-colors duration-500"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <ul className="flex h-full justify-between px-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex h-full flex-col items-center justify-center gap-1',
                    'min-h-[44px] py-2 text-[10px] font-medium transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <StarIcon
                      glyph={item.glyph}
                      active={isActive}
                      size={18}
                      onClick={() => undefined}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}