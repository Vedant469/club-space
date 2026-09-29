import { Outlet, useLocation } from 'react-router-dom'
import DesktopSidebar from './DesktopSidebar'
import MobileBottomNav from './MobileBottomNav'

export default function AppShell() {
  const location = useLocation()
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
          {/* Global logo */}
          <div className="pointer-events-none fixed top-3 right-3 sm:top-4 sm:right-5 md:top-5 md:right-6 z-[60]">
            <div className="pointer-events-auto flex items-center rounded-full border border-lavender/60 bg-white/80 px-2 py-1.5 shadow-soft backdrop-blur-md dark:bg-[#1b1627]/90">
              <img
                src="/logo.jpeg"
                alt="Student Well-being Initiative"
                className="h-9 w-auto max-w-[150px] object-contain sm:h-11 sm:max-w-[175px]"
              />
            </div>
          </div>

          <Outlet />
        </main>

        <MobileBottomNav />
      </div>
    </div>
  )
}