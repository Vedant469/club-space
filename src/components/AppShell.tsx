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
          <Outlet />
        </main>

        <MobileBottomNav />
      </div>
    </div>
  )
}