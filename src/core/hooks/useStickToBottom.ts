import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'

interface UseStickToBottomOptions {
  containerRef: React.RefObject<HTMLElement | null>
  enabled?: boolean
  threshold?: number
  dependency?: unknown
  onAtBottomChange?: (atBottom: boolean) => void
}

function isNearBottom(element: HTMLElement, threshold: number) {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
}

export function useStickToBottom({
  containerRef,
  enabled = true,
  threshold = 48,
  dependency,
  onAtBottomChange,
}: UseStickToBottomOptions) {
  const [atBottom, setAtBottom] = useState(true)
  const atBottomRef = useRef(true)

  const updateAtBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const next = isNearBottom(container, threshold)
    if (next !== atBottomRef.current) {
      atBottomRef.current = next
      setAtBottom(next)
      onAtBottomChange?.(next)
    }
  }, [containerRef, threshold, onAtBottomChange])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Calling updateAtBottom() immediately on mount would set atBottomRef=false while scrollTop=0,
    // causing the subsequent stick effect to be skipped (race condition).
    // Leave the initial atBottomRef=true (useState default) and update it on the first scroll event.
    container.addEventListener('scroll', updateAtBottom, { passive: true })
    return () => container.removeEventListener('scroll', updateAtBottom)
  }, [containerRef, updateAtBottom])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled || !atBottomRef.current) return
    container.scrollTop = container.scrollHeight
  }, [containerRef, enabled, dependency])

  return { atBottom }
}
