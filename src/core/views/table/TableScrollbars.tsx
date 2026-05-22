import React from 'react'
import { CustomScrollbar } from '@/core/table/CustomScrollbar'

interface TableScrollbarsProps {
  bodyScrollRef: React.RefObject<HTMLDivElement | null>
  horizontalStyle: React.CSSProperties
}

export function TableScrollbars({
  bodyScrollRef,
  horizontalStyle,
}: TableScrollbarsProps) {
  return (
    <>
      <CustomScrollbar
        scrollRef={bodyScrollRef}
        direction="horizontal"
        style={horizontalStyle}
      />
      <CustomScrollbar scrollRef={bodyScrollRef} direction="vertical" />
    </>
  )
}
