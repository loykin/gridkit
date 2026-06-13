import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { DataGridToolbar } from '@/core/controls/DataGridToolbar'
import { CustomScrollbar } from '@/core/table/CustomScrollbar'
import type { GridKitClassNames, GridKitHeaderSlot, GridKitScrollbarConfig, GridKitStyles } from '@/types'

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
  /** data-view attribute on the frame element — used for view-specific fill CSS */
  frameView?: 'table' | 'card' | 'list' | 'chat'
  /** Hides the frame before column measurement completes (table view only) */
  frameHidden?: boolean
  /** Additional class applied to the frame (e.g. gridkit-agent-chat-frame) */
  frameExtra?: string
  scrollbar?: GridKitScrollbarConfig
  footer?: ReactNode
  classNames?: GridKitClassNames
  styles?: GridKitStyles
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
  frameView = 'table',
  frameHidden,
  frameExtra,
  scrollbar,
  footer,
  classNames,
  styles,
  children,
}: GridKitShellProps<T>) {
  useEffect(() => {
    if (fillParent && fillContainer) {
      console.warn('[GridKit] fillParent and fillContainer were both provided. fillParent takes precedence.')
    }
  }, [fillContainer, fillParent])

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
      const childCount = 1 + (toolbarFrameRef.current ? 1 : 0)
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
        '--gridkit-fill-table-max-height': `${fillTableMaxHeight}px`,
        maxHeight: `${fillTableMaxHeight}px`,
      } as React.CSSProperties)
    : undefined

  // Internal styles first, user styles override (escape hatch — see docs/api-v0.2-styling.md)
  const frameStyle = effectiveFillContainer
    ? { ...heightStyle, ...fillStyle, ...styles?.frame }
    : { ...heightStyle, ...styles?.frame }

  const scrollbarMode = scrollbar?.mode ?? 'native'
  const scrollContainer = (
    <div
      ref={(node) => {
        tableWrapperRef.current = node
        if (containerRef) {
          ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      }}
      className={cn(
        'gridkit-frame',
        'gridkit-scroll-container',
        frameExtra,
        classNames?.frame,
        effectiveFillContainer && 'gridkit-frame--fill',
        frameHidden && 'gridkit-frame--hidden',
      )}
      data-view={frameView}
      data-scrollbar={scrollbarMode === 'native' ? undefined : scrollbarMode}
      style={frameStyle}
    >
      {children}
    </div>
  )

  return (
    <div
      ref={wrapperRef}
      className={cn('gridkit-shell', effectiveFillContainer && 'gridkit-shell--fill', classNames?.root)}
      data-fill-parent={fillParent ? 'true' : undefined}
      style={styles?.root}
    >
      {hasToolbar && (
        <div ref={toolbarFrameRef} className={cn('gridkit-toolbar-frame', classNames?.toolbar)} style={styles?.toolbar}>
          <DataGridToolbar table={table} headerLeft={headerLeft} headerRight={headerRight} />
        </div>
      )}

      <div className="gridkit-table-stack">
        {scrollbarMode === 'custom' ? (
          <div className={cn('gridkit-scroll-frame', effectiveFillContainer && 'gridkit-scroll-frame--fill')}>
            {scrollContainer}
            <CustomScrollbar
              scrollRef={tableWrapperRef}
              direction="vertical"
              size={scrollbar?.size}
              trackClassName={scrollbar?.trackClassName}
              thumbClassName={scrollbar?.thumbClassName}
              style={scrollbar?.trackStyle}
              thumbStyle={scrollbar?.thumbStyle}
            />
          </div>
        ) : scrollContainer}

        {footer && (
          <div ref={footerFrameRef} className={cn('gridkit-footer', classNames?.footer)} style={styles?.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
