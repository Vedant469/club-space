interface LoadingSkeletonProps {
  count?: number
  className?: string
}

export default function LoadingSkeleton({ count = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-card bg-gradient-to-r from-lavender/40 via-pink/30 to-lavender/40 animate-pulse"
        />
      ))}
    </div>
  )
}