import React, { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
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
  fillContainer?: boolean
  fillParent?: boolean
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
  fillContainer,
  fillParent,
  containerClassName,
  footer,
  children,
}: GridKitShellProps<T>) {
  const toolbarFrameRef = useRef<HTMLDivElement | null>(null)
  const tableWrapperRef = useRef<HTMLDivElement | null>(null)
  const footerFrameRef = useRef<HTMLDivElement | null>(null)
  const [fillTableMaxHeight, setFillTableMaxHeight] = useState<number | undefined>()
  const heightStyle = resolveContainerHeight(containerHeight ?? tableHeight, maxTableHeight, minTableHeight)
  const hasToolbar = headerLeft != null || headerRight != null
  const effectiveFillContainer = fillContainer && !fillParent

  useLayoutEffect(() => {
    if (!effectiveFillContainer) {
      setFillTableMaxHeight(undefined)
      return
    }

    const shell = wrapperRef.current
    const tableWrapper = tableWrapperRef.current
    if (!shell || !tableWrapper || typeof ResizeObserver === 'undefined') return

    const measure = () => {
      const shellHeight = shell.clientHeight
      if (shellHeight <= 0) return

      const toolbarHeight = toolbarFrameRef.current?.getBoundingClientRect().height ?? 0
      const footerHeight = footerFrameRef.current?.getBoundingClientRect().height ?? 0
      const childCount = 1 + (toolbarFrameRef.current ? 1 : 0) + (footerFrameRef.current ? 1 : 0)
      const style = getComputedStyle(shell)
      const gap = Number.parseFloat(style.rowGap || style.gap || '0') || 0
      const totalGap = Math.max(0, childCount - 1) * gap
      const next = Math.floor(shellHeight - toolbarHeight - footerHeight - totalGap)

      setFillTableMaxHeight((current) => {
        if (next <= 0) return current
        return current === next ? current : next
      })
    }

    const observer = new ResizeObserver(measure)
    observer.observe(shell)
    if (shell.parentElement) observer.observe(shell.parentElement)
    if (toolbarFrameRef.current) observer.observe(toolbarFrameRef.current)
    observer.observe(tableWrapper)
    if (footerFrameRef.current) observer.observe(footerFrameRef.current)
    measure()

    return () => observer.disconnect()
  }, [effectiveFillContainer, footer, headerLeft, headerRight, wrapperRef])

  const fillStyle = effectiveFillContainer && fillTableMaxHeight != null
    ? ({
        '--dg-fill-table-max-height': `${fillTableMaxHeight}px`,
        maxHeight: `${fillTableMaxHeight}px`,
      } as React.CSSProperties)
    : undefined
  const containerStyle = effectiveFillContainer ? { ...heightStyle, ...fillStyle } : heightStyle

  return (
    <div
      ref={wrapperRef}
      className={cn('dg-shell', effectiveFillContainer && 'dg-shell--fill')}
      data-fill-parent={fillParent ? 'true' : undefined}
    >
      {hasToolbar && (
        <div ref={toolbarFrameRef} className="dg-toolbar-frame">
          <DataGridToolbar table={table} headerLeft={headerLeft} headerRight={headerRight} />
        </div>
      )}

      <div
        ref={(node) => {
          tableWrapperRef.current = node
          if (containerRef) {
            ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          }
        }}
        className={cn(containerClassName, effectiveFillContainer && 'dg-table-wrapper--fill')}
        style={containerStyle}
      >
        {children}
      </div>

      {footer && (
        <div ref={footerFrameRef} className="dg-footer">
          {footer}
        </div>
      )}
    </div>
  )
}
