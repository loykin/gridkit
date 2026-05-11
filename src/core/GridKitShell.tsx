import type React from 'react'
import type { ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { DataGridToolbar } from '@/core/DataGridToolbar'
import type { GridKitHeaderSlot } from '@/types'

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
  headerLeft?: GridKitHeaderSlot<T>
  headerRight?: GridKitHeaderSlot<T>
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
  headerLeft,
  headerRight,
  containerHeight,
  tableHeight,
  containerClassName,
  footer,
  children,
}: GridKitShellProps<T>) {
  const heightStyle = resolveContainerHeight(containerHeight ?? tableHeight)

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
