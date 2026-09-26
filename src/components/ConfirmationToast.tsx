interface ConfirmationToastProps {
  show: boolean
  message?: string
}

export default function ConfirmationToast({ show, message = '✦ ALL CLEAR — LOOK AT YOU GO ✦' }: ConfirmationToastProps) {
  if (!show) return null
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="rounded-full bg-deep text-white text-sm font-medium px-5 py-2.5 shadow-soft tracking-wide">
        {message}
      </div>
    </div>
  )
}