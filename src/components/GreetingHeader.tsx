import { getGreetingWord } from '../lib/time'

export default function GreetingHeader({ displayName }: { displayName: string }) {
  return (
    <div>
      <p className="text-xs tracking-[0.25em] text-muted uppercase mb-1">✦ ⋆ ✧</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-deep leading-tight">
        {getGreetingWord()},
        <br />
        <span className="text-primary">{displayName} ✦</span>
      </h1>
    </div>
  )
}