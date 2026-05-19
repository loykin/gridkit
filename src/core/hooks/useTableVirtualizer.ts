import { useVirtualizer } from '@tanstack/react-virtual'
import { VIRTUAL_THRESHOLD } from '@/core/hooks/useColumnSizing'

interface UseTableVirtualizerOptions<T> {
  rows: T[]
  enabledByLayout: boolean
  bodyScrollRef: React.RefObject<HTMLDivElement | null>
  estimateSize: number
  overscan?: number
}

export function useTableVirtualizer<T>({
  rows,
  enabledByLayout,
  bodyScrollRef,
  estimateSize,
  overscan = 10,
}: UseTableVirtualizerOptions<T>) {
  const virtual = enabledByLayout && rows.length >= VIRTUAL_THRESHOLD

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => bodyScrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
    enabled: virtual,
  })

  return { virtual, virtualizer }
}
