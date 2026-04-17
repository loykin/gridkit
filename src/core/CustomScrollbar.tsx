import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface CustomScrollbarProps {
  scrollRef: React.RefObject<HTMLDivElement | null>
  direction: 'vertical' | 'horizontal'
  className?: string
  style?: React.CSSProperties
}

export function CustomScrollbar({ scrollRef, direction, className, style }: CustomScrollbarProps) {
  const isV = direction === 'vertical'
  const trackRef = useRef<HTMLDivElement>(null)

  // Refs for drag calculations (avoid stale closures)
  const scrollSizeRef = useRef(0)
  const clientSizeRef = useRef(0)

  // thumbStart/thumbEnd are fractions of track (0..1)
  const [thumbStart, setThumbStart] = useState(0)
  const [thumbEnd, setThumbEnd] = useState(1)

  const sync = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const scrollPos = isV ? el.scrollTop : el.scrollLeft
    const scrollSize = isV ? el.scrollHeight : el.scrollWidth
    const clientSize = isV ? el.clientHeight : el.clientWidth

    scrollSizeRef.current = scrollSize
    clientSizeRef.current = clientSize

    if (scrollSize <= clientSize) {
      setThumbStart(0)
      setThumbEnd(1)
      return
    }

    setThumbStart(scrollPos / scrollSize)
    setThumbEnd((scrollPos + clientSize) / scrollSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef, isV])

  // Sync immediately on mount (layout effect avoids flash)
  useLayoutEffect(() => {
    sync()
  }, [sync])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    el.addEventListener('scroll', sync, { passive: true })

    const ro = new ResizeObserver(sync)
    ro.observe(el)
    // Also observe first child so virtualizer total-height changes are detected
    if (el.firstElementChild) ro.observe(el.firstElementChild)

    return () => {
      el.removeEventListener('scroll', sync)
      ro.disconnect()
    }
  }, [scrollRef, sync])

  const thumbFrac = thumbEnd - thumbStart
  const visible = thumbFrac < 0.9999

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const el = scrollRef.current
    if (!el) return

    const startMouse = isV ? e.clientY : e.clientX
    const startScroll = isV ? el.scrollTop : el.scrollLeft

    const onMove = (e: MouseEvent) => {
      const el = scrollRef.current
      const track = trackRef.current
      if (!el || !track) return

      const trackPx = isV ? track.clientHeight : track.clientWidth
      const thumbPx = trackPx * thumbFrac
      const delta = (isV ? e.clientY : e.clientX) - startMouse
      const maxScroll = scrollSizeRef.current - clientSizeRef.current
      const scrollDelta = (delta / (trackPx - thumbPx)) * maxScroll

      if (isV) el.scrollTop = startScroll + scrollDelta
      else el.scrollLeft = startScroll + scrollDelta
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleTrackClick = (e: React.MouseEvent) => {
    const track = trackRef.current
    const el = scrollRef.current
    if (!track || !el) return

    const rect = track.getBoundingClientRect()
    const clickFrac = isV
      ? (e.clientY - rect.top) / rect.height
      : (e.clientX - rect.left) / rect.width

    const targetFrac = Math.max(0, Math.min(1, (clickFrac - thumbFrac / 2) / (1 - thumbFrac)))
    const maxScroll = scrollSizeRef.current - clientSizeRef.current

    if (isV) el.scrollTop = targetFrac * maxScroll
    else el.scrollLeft = targetFrac * maxScroll
  }

  return (
    <div
      ref={trackRef}
      onClick={handleTrackClick}
      className={cn('dg-scrollbar-track', 'relative', !visible && 'hidden', className)}
      style={style}
    >
      <div
        className={cn(
          'dg-scrollbar-thumb',
          'absolute cursor-pointer rounded-full bg-foreground/20 hover:bg-foreground/35 transition-colors',
        )}
        onMouseDown={handleThumbMouseDown}
        onClick={(e) => e.stopPropagation()}
        style={
          isV
            ? { top: `${thumbStart * 100}%`, bottom: `${(1 - thumbEnd) * 100}%`, left: 2, right: 2 }
            : { left: `${thumbStart * 100}%`, right: `${(1 - thumbEnd) * 100}%`, top: 2, bottom: 2 }
        }
      />
    </div>
  )
}
