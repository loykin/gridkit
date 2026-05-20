import React, { useCallback, useRef } from 'react'

export function useTableScrollSync(
  verticalFollowers: Array<React.RefObject<HTMLDivElement | null>> = [],
) {
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)

  const syncScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollTop } = e.currentTarget
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft
    }
    verticalFollowers.forEach((ref) => {
      if (ref.current) ref.current.scrollTop = scrollTop
    })
  }, [verticalFollowers])

  return { headerScrollRef, bodyScrollRef, syncScroll }
}
