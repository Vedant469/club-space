import { useState } from 'react'

interface StarIconProps {
  glyph?: string
  active?: boolean
  size?: number
  className?: string
  onClick?: () => void
  label?: string
}

export default function StarIcon({
  glyph = '✦',
  active = false,
  size = 20,
  className = '',
  onClick,
  label,
}: StarIconProps) {
  const [spinning, setSpinning] = useState(false)

  function handleClick() {
    if (spinning) return
    setSpinning(true)
    window.setTimeout(() => setSpinning(false), 650)
    onClick?.()
  }

  return (
    <span
      onClick={onClick ? handleClick : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={label}
      style={{ fontSize: size, lineHeight: 1 }}
      className={[
        'inline-flex items-center justify-center select-none transition-[color,filter] duration-200 hover:rotate-[15deg]',
        spinning ? 'animate-star-spin' : '',
        active ? 'text-primary' : 'text-muted',
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {glyph}
    </span>
  )
}
