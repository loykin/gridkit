import React, { useCallback, useRef } from 'react'

export function useTableScrollSync() {
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)

  const syncScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }, [])

  return { headerScrollRef, bodyScrollRef, syncScroll }
}
