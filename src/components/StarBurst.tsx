interface StarBurstProps {
  show: boolean
}

export default function StarBurst({ show }: StarBurstProps) {
  if (!show) return null
  const particles = [
    { tx: '-24px', ty: '-18px', delay: '0s' },
    { tx: '22px', ty: '-20px', delay: '0.05s' },
    { tx: '-10px', ty: '24px', delay: '0.1s' },
    { tx: '18px', ty: '18px', delay: '0.03s' },
    { tx: '0px', ty: '-28px', delay: '0.08s' },
  ]
  return (
    <span className="relative inline-block w-0 h-0">
      {particles.map((p, i) => (
        <span
          key={i}
          className="star-burst-particle text-primary text-xs"
          style={{ ['--tx' as string]: p.tx, ['--ty' as string]: p.ty, animationDelay: p.delay }}
        >
          ✦
        </span>
      ))}
    </span>
  )
}