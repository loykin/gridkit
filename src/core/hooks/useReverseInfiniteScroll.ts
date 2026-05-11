import { useEffect, useRef } from 'react'
import type React from 'react'

interface UseReverseInfiniteScrollOptions {
  containerRef: React.RefObject<HTMLElement | null>
  hasPreviousPage?: boolean
  isFetchingPreviousPage?: boolean
  fetchPreviousPage?: () => void
  rootMargin?: string
  enabled?: boolean
  preserveScrollOffset?: boolean
  dependency?: unknown
}

export function useReverseInfiniteScroll({
  containerRef,
  hasPreviousPage,
  isFetchingPreviousPage,
  fetchPreviousPage,
  rootMargin = '100px',
  enabled = true,
  preserveScrollOffset = true,
  dependency,
}: UseReverseInfiniteScrollOptions) {
  const loadPreviousRef = useRef<HTMLDivElement>(null)
  const previousHeightRef = useRef<number | null>(null)

  // ref로 최신 값을 유지해서 observer를 재생성하지 않고 최신 상태를 참조한다.
  // isFetchingPreviousPage가 deps에 있으면, fetch 완료 후 observer 재생성 시점에
  // sentinel이 viewport 안에 있으면 중복 fetch가 발생할 수 있다.
  const hasPreviousPageRef = useRef(hasPreviousPage)
  const isFetchingRef = useRef(isFetchingPreviousPage)
  const fetchPreviousPageRef = useRef(fetchPreviousPage)

  useEffect(() => {
    hasPreviousPageRef.current = hasPreviousPage
    isFetchingRef.current = isFetchingPreviousPage
    fetchPreviousPageRef.current = fetchPreviousPage
  })

  useEffect(() => {
    if (!enabled || !loadPreviousRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const container = containerRef.current
        if (
          entry?.isIntersecting &&
          container &&
          hasPreviousPageRef.current &&
          !isFetchingRef.current
        ) {
          isFetchingRef.current = true
          previousHeightRef.current = container.scrollHeight
          fetchPreviousPageRef.current?.()
        }
      },
      {
        root: containerRef.current,
        rootMargin,
      },
    )

    observer.observe(loadPreviousRef.current)
    return () => observer.disconnect()
  }, [containerRef, rootMargin, enabled])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !preserveScrollOffset || previousHeightRef.current == null) return

    const delta = container.scrollHeight - previousHeightRef.current
    if (delta > 0) {
      container.scrollTop += delta
    }
    previousHeightRef.current = null
  }, [containerRef, preserveScrollOffset, dependency])

  return { loadPreviousRef }
}
