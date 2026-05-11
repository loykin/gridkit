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

    // mount 시 즉시 updateAtBottom()을 호출하면 scrollTop=0 상태에서 atBottomRef=false로
    // 설정되어, 뒤이어 실행되는 stick effect가 skip되는 레이스 컨디션이 생긴다.
    // 초기 atBottomRef=true(useState 기본값)를 그대로 유지하고, 첫 scroll 이벤트에서 갱신한다.
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
