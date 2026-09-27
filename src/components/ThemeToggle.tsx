import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { resolvedTheme, setPreference } = useTheme()

  const isDark = resolvedTheme === 'dark'

  function toggleTheme() {
    setPreference(isDark ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative h-10 w-10 overflow-hidden rounded-full border border-lavender/70 bg-white/80 text-primary shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-glow dark:border-violet-400/20 dark:bg-[#251b32] dark:text-violet-200"
    >
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
          isDark
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
      >
        <Moon size={19} strokeWidth={2} />
      </span>

      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
          isDark
            ? 'rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100'
        }`}
      >
        <Sun size={19} strokeWidth={2} />
      </span>
    </button>
  )
}