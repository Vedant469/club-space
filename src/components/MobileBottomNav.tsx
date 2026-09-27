import { NavLink } from 'react-router-dom'
import StarIcon from './StarIcon'

const NAV_ITEMS = [
  { to: '/', glyph: '✦', label: 'Home' },
  { to: '/tasks', glyph: '✧', label: 'Tasks' },
  { to: '/club-tasks', glyph: '✦', label: 'Club' },
  { to: '/chat', glyph: '✧', label: 'Chat' },
  { to: '/members', glyph: '✦', label: 'Members' },
]

export default function MobileBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-lavender/60 bg-white/90 backdrop-blur-sm transition-colors duration-500"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex justify-between px-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 py-2.5 min-h-[44px] justify-center text-[10px] font-medium',
                  isActive ? 'text-primary' : 'text-muted',
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
  )
}