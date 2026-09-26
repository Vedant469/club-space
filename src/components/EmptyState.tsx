interface EmptyStateProps {
  glyph?: string
  title: string
  subtitle: string
}

export default function EmptyState({ glyph = '✦', title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <span className="text-3xl text-primary/70 mb-3">{glyph}</span>
      <p className="font-semibold text-deep">{title}</p>
      <p className="text-sm text-muted mt-1">{subtitle}</p>
    </div>
  )
}