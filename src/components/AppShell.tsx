import { Outlet, useLocation } from 'react-router-dom'
import DesktopSidebar from './DesktopSidebar'
import MobileBottomNav from './MobileBottomNav'
import NotificationBell from './NotificationBell'
import { useUnreadChatCount } from '../hooks/useUnreadChatCount'

export default function AppShell() {
  const location = useLocation()

  const isHome = location.pathname === '/'
  const isChat = location.pathname === '/chat'

  const chatUnreadCount = useUnreadChatCount()

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      <div className="flex min-h-screen">
        <DesktopSidebar
          chatUnreadCount={chatUnreadCount}
        />

        <main
          className={`relative flex-1 min-w-0 ${
            isChat ? '' : 'pb-24 md:pb-0'
          }`}
        >
          {isHome ? <NotificationBell /> : null}

          <Outlet />
        </main>

        <MobileBottomNav
          chatUnreadCount={chatUnreadCount}
        />
      </div>
    </div>
  )
}