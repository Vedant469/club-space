import { Outlet } from 'react-router-dom'
import DesktopSidebar from './DesktopSidebar'
import MobileBottomNav from './MobileBottomNav'

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar />
      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  )
}
