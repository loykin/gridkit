import type React from 'react'
import type { ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { DataGridToolbar } from '@/core/controls/DataGridToolbar'
import type { GridKitHeaderSlot } from '@/types'

export function resolveContainerHeight(
  height: string | number | 'auto' | undefined,
  maxHeight?: string | number,
  minHeight?: string | number,
): React.CSSProperties {
  const toCSS = (v: string | number) => (typeof v === 'number' ? `${v}px` : v)
  const min = minHeight != null ? { minHeight: toCSS(minHeight) } : {}

  if (height != null && height !== 'auto') {
    return { height: toCSS(height), overflow: 'auto', ...min }
  }
  if (maxHeight != null) {
    return { maxHeight: toCSS(maxHeight), overflow: 'auto', ...min }
  }
  return { ...min }
}

interface GridKitShellProps<T extends object> {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  containerRef?: React.RefObject<HTMLDivElement | null>
  table: Table<T>
  headerLeft?: GridKitHeaderSlot<T>
  headerRight?: GridKitHeaderSlot<T>
  containerHeight?: string | number | 'auto'
  tableHeight?: string | number | 'auto'
  maxTableHeight?: string | number
  minTableHeight?: string | number
  containerClassName?: string
  footer?: ReactNode
  children: ReactNode
}

export function GridKitShell<T extends object>({
  wrapperRef,
  containerRef,
  table,
  headerLeft,
  headerRight,
  containerHeight,
  tableHeight,
  maxTableHeight,
  minTableHeight,
  containerClassName,
  footer,
  children,
}: GridKitShellProps<T>) {
  const heightStyle = resolveContainerHeight(containerHeight ?? tableHeight, maxTableHeight, minTableHeight)

  return (
    <div ref={wrapperRef} className="dg-shell">
      <DataGridToolbar table={table} headerLeft={headerLeft} headerRight={headerRight} />

      <div ref={containerRef} className={containerClassName} style={heightStyle}>
        {children}
      </div>

      {footer}
    </div>
  )
}
