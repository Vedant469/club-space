import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../lib/time'

interface SplashScreenProps {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion()) {
      onFinish()
    }
  }, [onFinish])

  const handleVideoEnd = () => {
    setFading(true)

    setTimeout(() => {
      onFinish()
    }, 700)
  }

  const handleVideoError = () => {
    onFinish()
  }

  if (prefersReducedMotion()) {
    return null
  }

  return (
  <div
  className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#fefee8] transition-opacity duration-700 ${
    fading ? 'opacity-0' : 'opacity-100'
  }`}
>
      <video
  className="h-full w-full object-contain"
  src="/intro-video-final.mp4"
  autoPlay
  muted
  playsInline
  preload="auto"
  onEnded={handleVideoEnd}
  onError={handleVideoError}
/>
    </div>
  )
}