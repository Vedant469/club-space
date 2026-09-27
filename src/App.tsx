import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import { ClubProvider } from './context/ClubContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import MyTasks from './pages/MyTasks'
import ClubTasks from './pages/ClubTasks'
import Documents from './pages/Documents'
import Memories from './pages/Memories'
import EventGallery from './pages/EventGallery'
import ClubChat from './pages/ClubChat'
import Profile from './pages/Profile'
import Members from './pages/Members'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ClubProvider>
              <AppShell />
            </ClubProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="club-tasks" element={<ClubTasks />} />
        <Route path="documents" element={<Documents />} />
        <Route path="memories" element={<Memories />} />
        <Route path="memories/:eventId" element={<EventGallery />} />
        <Route path="chat" element={<ClubChat />} />
        <Route path="members" element={<Members />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}