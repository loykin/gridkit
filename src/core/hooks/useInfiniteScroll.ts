import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  rootMargin?: string
  enabled?: boolean
}

/**
 * Attach an IntersectionObserver to a sentinel element.
 * When the sentinel enters the viewport, triggers fetchNextPage.
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = '100px',
  enabled = true,
}: UseInfiniteScrollOptions) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || !loadMoreRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage?.()
        }
      },
      { rootMargin },
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin, enabled])

  return { loadMoreRef }
}
