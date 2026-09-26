interface QuotePlaceholderProps {
  quote?: string | null
}

export default function QuotePlaceholder({ quote }: QuotePlaceholderProps) {
  return (
    <div className="rounded-card border border-dashed border-lavender bg-white/50 px-5 py-4 text-center">
      {quote ? (
        <p className="font-accent text-xl text-deep">"{quote}"</p>
      ) : (
        <p className="font-accent text-lg text-muted">a little inspiration will live here ✧</p>
      )}
    </div>
  )
}