import { Outlet, useLocation } from 'react-router-dom'
import DesktopSidebar from './DesktopSidebar'
import MobileBottomNav from './MobileBottomNav'

export default function AppShell() {
  const location = useLocation()

  const isHome = location.pathname === '/'
  const isChat = location.pathname === '/chat'

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      <div className="flex min-h-screen">
        <DesktopSidebar />

        <main
          className={`relative flex-1 min-w-0 ${
            isChat ? '' : 'pb-24 md:pb-0'
          }`}
        >
          {/* Desktop logo — always visible */}
          <div className="pointer-events-none fixed top-5 right-6 z-[60] hidden md:block">
            <img
              src="/logo.jpeg"
              alt="Student Well-being Initiative"
              className="pointer-events-auto h-12 w-auto max-w-[160px] rounded-xl object-contain shadow-soft"
            />
          </div>

          {/* Mobile logo — Home page only */}
          {isHome ? (
            <div className="pointer-events-none fixed top-3 right-3 z-[60] md:hidden">
              <img
                src="/logo.jpeg"
                alt="Student Well-being Initiative"
                className="pointer-events-auto h-10 w-auto max-w-[130px] rounded-xl object-contain shadow-soft"
              />
            </div>
          ) : null}

          <Outlet />
        </main>

        <MobileBottomNav />
      </div>
    </div>
  )
}