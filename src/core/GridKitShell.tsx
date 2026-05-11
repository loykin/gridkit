import type React from 'react'
import type { ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { DataGridToolbar } from '@/core/DataGridToolbar'

export function resolveContainerHeight(
  height: string | number | 'auto' | undefined,
): React.CSSProperties {
  if (height == null || height === 'auto') return {}
  return {
    height: typeof height === 'number' ? `${height}px` : height,
    overflow: 'auto',
  }
}

interface GridKitShellProps<T extends object> {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  table: Table<T>
  leftFilters?: (table: Table<T>) => ReactNode
  rightFilters?: (table: Table<T>) => ReactNode
  headerLeft?: ReactNode
  headerRight?: ReactNode
  containerHeight?: string | number | 'auto'
  tableHeight?: string | number | 'auto'
  containerClassName?: string
  footer?: ReactNode
  children: ReactNode
}

export function GridKitShell<T extends object>({
  wrapperRef,
  containerRef,
  table,
  leftFilters,
  rightFilters,
  headerLeft,
  headerRight,
  containerHeight,
  tableHeight,
  containerClassName,
  footer,
  children,
}: GridKitShellProps<T>) {
  const heightStyle = resolveContainerHeight(containerHeight ?? tableHeight)

  const toolbarLeft =
    leftFilters || headerLeft
      ? (currentTable: Table<T>) => (
          <>
            {headerLeft}
            {leftFilters?.(currentTable)}
          </>
        )
      : undefined

  const toolbarRight =
    rightFilters || headerRight
      ? (currentTable: Table<T>) => (
          <>
            {rightFilters?.(currentTable)}
            {headerRight}
          </>
        )
      : undefined

  return (
    <div ref={wrapperRef} className="dg-shell">
      <DataGridToolbar table={table} leftFilters={toolbarLeft} rightFilters={toolbarRight} />

      <div ref={containerRef} className={containerClassName} style={heightStyle}>
        {children}
      </div>

      {footer}
    </div>
  )
}
