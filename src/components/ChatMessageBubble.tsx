import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Pencil,
  Trash2,
  Paperclip,
  Reply,
  MoreVertical,
} from 'lucide-react'
import { formatTime } from '../lib/time'

interface ChatMessageBubbleProps {
  message: string | null
  senderName: string
  avatarUrl?: string | null
  createdAt: string
  isOwn: boolean
  edited?: boolean
  replyToText?: string | null
  attachmentUrl?: string | null
  attachmentType?: string | null
  onReply?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function ChatMessageBubble({
  message,
  senderName,
  avatarUrl,
  createdAt,
  isOwn,
  edited,
  replyToText,
  attachmentUrl,
  attachmentType,
  onReply,
  onEdit,
  onDelete,
}: ChatMessageBubbleProps) {
  const isImage =
    attachmentType?.startsWith('image/')

  const wrapperRef =
    useRef<HTMLDivElement>(null)

  const longPressTimer =
    useRef<number | null>(null)

  const startX =
    useRef(0)

  const startY =
    useRef(0)

  const [swipeX, setSwipeX] =
    useState(0)

  const [menuOpen, setMenuOpen] =
    useState(false)

  const [isDragging, setIsDragging] =
    useState(false)

  const [swipeTriggered, setSwipeTriggered] =
    useState(false)

  function clearLongPress() {
    if (
      longPressTimer.current !== null
    ) {
      window.clearTimeout(
        longPressTimer.current
      )

      longPressTimer.current = null
    }
  }

  function triggerReply() {
    setSwipeX(0)
    setIsDragging(false)
    setSwipeTriggered(true)

    onReply?.()

    window.setTimeout(() => {
      setSwipeTriggered(false)
    }, 150)
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    // Mouse uses hover/click controls.
    if (event.pointerType === 'mouse') {
      return
    }

    startX.current = event.clientX
    startY.current = event.clientY

    setIsDragging(false)
    setSwipeTriggered(false)

    longPressTimer.current =
      window.setTimeout(() => {
        if (!isDragging) {
          setMenuOpen(true)

          if (
            'vibrate' in navigator
          ) {
            navigator.vibrate?.(10)
          }
        }
      }, 500)

    event.currentTarget.setPointerCapture(
      event.pointerId
    )
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (
      event.pointerType === 'mouse'
    ) {
      return
    }

    const dx =
      event.clientX - startX.current

    const dy =
      event.clientY - startY.current

    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    /*
     * Once the user clearly moves,
     * cancel long press.
     */
    if (
      absX > 8 ||
      absY > 8
    ) {
      clearLongPress()
    }

    /*
     * Vertical movement belongs to
     * the normal page/chat scroll.
     */
    if (absY > absX) {
      return
    }

    if (absX < 8) {
      return
    }

    setIsDragging(true)

    /*
     * Other people's messages:
     * swipe RIGHT to reply.
     *
     * Your messages:
     * swipe LEFT to reply.
     */
    const direction = isOwn
      ? -1
      : 1

    const distance =
      dx * direction

    if (distance <= 0) {
      setSwipeX(0)
      return
    }

    const clamped =
      Math.min(distance, 88)

    setSwipeX(
      clamped * direction
    )

    if (
      distance >= 64 &&
      !swipeTriggered
    ) {
      setSwipeTriggered(true)
    }
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (
      event.pointerType === 'mouse'
    ) {
      return
    }

    clearLongPress()

    const thresholdReached =
      Math.abs(swipeX) >= 64

    if (
      thresholdReached &&
      isDragging
    ) {
      triggerReply()
    } else {
      setSwipeX(0)
      setIsDragging(false)
      setSwipeTriggered(false)
    }

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      )
    } catch {
      // Pointer capture may already be released.
    }
  }

  function handlePointerCancel() {
    clearLongPress()
    setSwipeX(0)
    setIsDragging(false)
    setSwipeTriggered(false)
  }

  function handleContextMenu(
    event: React.MouseEvent
  ) {
    /*
     * Prevent browser context menu on
     * long-press capable devices.
     */
    if (
      'ontouchstart' in window
    ) {
      event.preventDefault()
    }
  }

  useEffect(() => {
    function handleOutsideClick(
      event: PointerEvent
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      handleOutsideClick
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsideClick
      )

      clearLongPress()
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={[
        'relative flex gap-2.5 animate-fade-in-up',
        isOwn
          ? 'flex-row-reverse'
          : 'flex-row',
      ].join(' ')}
    >
      {/* Swipe reply indicator */}
      <div
        className={[
          'pointer-events-none absolute top-1/2 z-0 -translate-y-1/2',
          isOwn
            ? 'right-0'
            : 'left-0',
        ].join(' ')}
        style={{
          opacity: Math.min(
            Math.abs(swipeX) / 64,
            1
          ),
          transform: `translateY(-50%) scale(${
            0.7 +
            Math.min(
              Math.abs(swipeX) / 64,
              1
            ) *
              0.3
          })`,
        }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lavender text-primary shadow-sm">
          <Reply
            size={17}
          />
        </div>
      </div>

      {!isOwn ? (
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-lavender flex items-center justify-center text-xs font-semibold text-primary">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={senderName}
              className="h-full w-full object-cover"
            />
          ) : (
            senderName.charAt(0)
          )}
        </div>
      ) : null}

      <div
        className={[
          'relative z-10 flex flex-col',
          'group max-w-[75%] min-w-0',
          isOwn
            ? 'items-end'
            : 'items-start',
        ].join(' ')}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 180ms ease-out',
          touchAction: 'pan-y',
        }}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerCancel
        }
        onContextMenu={
          handleContextMenu
        }
      >
        {!isOwn ? (
          <p className="mb-0.5 text-xs font-semibold text-primary">
            {senderName}
          </p>
        ) : null}

        {/* Existing reply reference */}
        {replyToText ? (
          <div className="mb-1 max-w-full truncate border-l-2 border-lavender pl-2 text-xs text-muted">
            {replyToText}
          </div>
        ) : null}

        {/* Message bubble */}
        <div
          className={[
            'relative rounded-2xl px-3.5 py-2 text-sm',
            'select-none',
            isOwn
              ? 'rounded-br-md bg-primary text-white'
              : 'rounded-bl-md bg-lavender/50 text-deep',
          ].join(' ')}
        >
          {attachmentUrl ? (
            isImage ? (
              <img
                src={attachmentUrl}
                alt="Attachment"
                className="mb-1.5 max-h-56 rounded-lg object-cover"
              />
            ) : (
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className={[
                  'mb-1.5 flex items-center gap-1.5 text-xs underline',
                  isOwn
                    ? 'text-white'
                    : 'text-primary',
                ].join(' ')}
              >
                <Paperclip size={12} />
                Attachment
              </a>
            )
          ) : null}

          {message ? (
            <p className="whitespace-pre-wrap break-words">
              {message}
            </p>
          ) : null}
        </div>

        {/* Desktop controls */}
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[10px] text-muted">
            {formatTime(createdAt)}
            {edited
              ? ' · edited'
              : ''}
          </span>

          <div className="hidden items-center gap-1 md:flex md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
            <button
              type="button"
              onClick={onReply}
              aria-label="Reply to message"
              className="rounded-full p-1 text-muted transition-colors hover:bg-lavender/40 hover:text-primary"
            >
              <Reply
                size={14}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                setMenuOpen(
                  (value) =>
                    !value
                )
              }
              aria-label="More options"
              className="rounded-full p-1 text-muted transition-colors hover:bg-lavender/40 hover:text-deep"
            >
              <MoreVertical
                size={14}
              />
            </button>
          </div>
        </div>

        {/* Desktop / long-press menu */}
        {menuOpen ? (
          <div
            className={[
              'absolute z-50 w-36 overflow-hidden rounded-xl',
              'border border-lavender/60',
              'bg-white shadow-soft',
              'dark:bg-[#251b32]',
              isOwn
                ? 'right-0'
                : 'left-0',
              'top-full mt-2',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onReply?.()
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-deep transition-colors hover:bg-lavender/30"
            >
              <Reply
                size={14}
              />
              Reply
            </button>

            {isOwn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit?.()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-deep transition-colors hover:bg-lavender/30"
                >
                  <Pencil
                    size={14}
                  />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete?.()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <Trash2
                    size={14}
                  />
                  Delete
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}