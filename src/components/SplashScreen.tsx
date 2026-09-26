import { useEffect, useState } from 'react'
import StarField from './StarField'
import { prefersReducedMotion } from '../lib/time'

interface SplashScreenProps {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const duration = prefersReducedMotion() ? 400 : 1800
    const fadeTimer = setTimeout(() => setFading(true), duration)
    const doneTimer = setTimeout(onFinish, duration + 400)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onFinish])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#1b1030] via-[#2a1a45] to-[#1b1030] text-lavender transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <StarField count={60} className="text-lavender" />
      <div className="relative z-10 text-center animate-fade-in">
        <p className="text-2xl mb-2 tracking-widest">✦ ⋆ ✧</p>
        <h1 className="text-4xl font-extrabold tracking-[0.2em] text-white">CLUB SPACE</h1>
        <p className="mt-3 text-sm font-accent text-2xl text-lavender/80">a little space to create</p>
        <p className="mt-6 text-lg tracking-widest text-lavender/60">⋆ ✦ ⋆</p>
      </div>
    </div>
  )
}