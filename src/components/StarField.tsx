import { useMemo } from 'react'
import { prefersReducedMotion } from '../lib/time'

interface StarFieldProps {
  count?: number
  className?: string
}

export default function StarField({ count = 40, className = '' }: StarFieldProps) {
  const reduced = prefersReducedMotion()

  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 3,
        glyph: ['✦', '✧', '⋆'][i % 3],
      })),
    [count]
  )

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className={reduced ? 'absolute opacity-60' : 'absolute animate-twinkle'}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            fontSize: `${s.size * 4}px`,
            animationDelay: `${s.delay}s`,
            color: 'currentColor',
          }}
        >
          {s.glyph}
        </span>
      ))}
    </div>
  )
}