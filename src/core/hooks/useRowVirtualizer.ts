import { useVirtualizer } from '@tanstack/react-virtual'

interface UseRowVirtualizerOptions {
  count: number
  containerRef: React.RefObject<HTMLElement | null>
  containerHeight: string | number | 'auto' | undefined
  estimateSize: number
  overscan?: number
  enabled?: boolean
  fillMode?: boolean
}

export function useRowVirtualizer({
  count,
  containerRef,
  containerHeight,
  estimateSize,
  overscan = 10,
  enabled = false,
  fillMode = false,
}: UseRowVirtualizerOptions) {
  const hasFixedHeight = fillMode || (containerHeight != null && containerHeight !== 'auto')
  const virtual = enabled && hasFixedHeight && count > 0
  const initialHeight = typeof containerHeight === 'number'
    ? containerHeight
    : containerRef.current?.clientHeight ?? 0

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateSize,
    overscan,
    initialRect: { width: 0, height: initialHeight },
    enabled: virtual,
  })

  return { virtual, virtualizer }
}
