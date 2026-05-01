import React, { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  type Row,
  type Table,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import { ScrollTable } from '@/core/ScrollTable'
import { CustomScrollbar } from '@/core/CustomScrollbar'
import type { TableViewConfig } from '@/types'
import { useTableScrollSync } from '@/core/hooks/useTableScrollSync'
import { useTableVirtualizer } from '@/core/hooks/useTableVirtualizer'
import { useActionMenu } from '@/core/hooks/useActionMenu'
import { DataGridHeaderRow } from '@/core/table/DataGridHeaderRow'
import { DataGridFilterRow } from '@/core/table/DataGridFilterRow'
import { DataGridBody } from '@/core/table/DataGridBody'

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface DataGridTableViewProps<T extends object> extends TableViewConfig<T> {
  table: Table<T>
  rows: Row<T>[]
  containerRef: React.RefObject<HTMLDivElement | null>
  loadMoreRef?: React.RefObject<HTMLDivElement | null>
  isFetchingNextPage?: boolean
  /**
   * Called after each render so the parent can update column auto-sizing
   * based on newly rendered (possibly virtual) rows.
   */
  onMeasureColumns?: () => void
}

// ── ActionMenuPopup ────────────────────────────────────────────────────────────

interface ActionMenuPopupProps {
  anchor: HTMLElement
  onClose: () => void
  children: React.ReactNode
}

function ActionMenuPopup({ anchor, onClose, children }: ActionMenuPopupProps) {
  const popupRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState<React.CSSProperties>({ visibility: 'hidden' })

  React.useEffect(() => {
    const r = anchor.getBoundingClientRect()
    setPos({
      visibility: 'visible',
      top: r.bottom + 4,
      right: window.innerWidth - r.right,
    })
  }, [anchor])

  React.useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!popupRef.current?.contains(e.target as Node) && !anchor.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handle), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handle)
    }
  }, [anchor, onClose])

  return createPortal(
    <div
      ref={popupRef}
      className="dg-action-menu"
      style={{ position: 'fixed', zIndex: 50, outline: 'none', ...pos }}
    >
      {children}
    </div>,
    document.body,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataGridTableView (main)
// ─────────────────────────────────────────────────────────────────────────────

export function DataGridTableView<T extends object>({
  table,
  rows,
  containerRef,
  isLoading,
  emptyMessage = 'No data',
  emptyContent,
  showHeader = true,
  onRowClick,
  rowCursor,
  enableColumnResizing = true,
  enableColumnFilters = false,
  filterDisplay = 'row',
  tableHeight,
  tableWidthMode = 'spacer',
  rowHeight,
  estimateRowHeight,
  overscan = 10,
  loadMoreRef,
  isFetchingNextPage,
  bordered = false,
  enableColumnReordering = false,
  onMeasureColumns,
  classNames,
}: DataGridTableViewProps<T>) {
  const effectiveEstimate = estimateRowHeight ?? rowHeight ?? 33

  const headerGroups = table.getHeaderGroups()
  const visibleLeafColumns = table.getVisibleLeafColumns()

  const icons = useIcons()

  // ── Action menu ────────────────────────────────────────────────────────────
  const { open: actionMenuOpen, setOpen: setActionMenuOpen, activeRow, anchorRef, trigger: handleActionTrigger } = useActionMenu<T>()

  const actionCol = visibleLeafColumns.find((col) => col.columnDef.meta?.actions != null)
  const actionItems = actionCol && activeRow ? actionCol.columnDef.meta!.actions!(activeRow) : []

  // ── Scroll sync ────────────────────────────────────────────────────────────
  const { headerScrollRef, bodyScrollRef, syncScroll } = useTableScrollSync()

  // ── Virtualizer ────────────────────────────────────────────────────────────
  const { virtual, virtualizer: rowVirtualizer } = useTableVirtualizer({
    rows,
    tableHeight,
    bodyScrollRef,
    estimateSize: effectiveEstimate,
    overscan,
  })

  // ── After each render, trigger column auto-measurement ─────────────────────
  useEffect(() => {
    if (!table.getState().columnSizingInfo.isResizingColumn) {
      onMeasureColumns?.()
    }
  })

  // ── Track vertical scroll visibility to avoid phantom margin on h-scrollbar ──
  const [hasVScroll, setHasVScroll] = useState(false)
  const checkVScroll = useCallback(() => {
    const el = bodyScrollRef.current
    if (!el) return
    setHasVScroll(el.scrollHeight > el.clientHeight)
  }, [bodyScrollRef])

  useEffect(() => {
    const el = bodyScrollRef.current
    if (!el) return
    const ro = new ResizeObserver(checkVScroll)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    checkVScroll()
    return () => ro.disconnect()
  }, [bodyScrollRef, checkVScroll])

  // Body wrapper: fixed height when tableHeight is set so hscroll stays inside
  const bodyWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    ...(tableHeight && tableHeight !== 'auto' ? { height: tableHeight as string | number } : {}),
  }

  // Body scroll element: fills remaining space after hscroll takes its height
  const bodyStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  }

  const innerWidth = table.getTotalSize()

  return (
    <>
      {/*
        Outer wrapper — containerRef:
          - ResizeObserver target for useColumnSizing
          - querySelectorAll('[data-col-id]') finds cells in both header and body
      */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          minWidth: 0,
          isolation: 'isolate',
          // Limit reflow scope to this subtree.
          // 'layout paint' isolates layout and paint without size containment,
          // which is required since the outer div's height is determined by its children.
          contain: 'layout paint',
        }}
        className={cn('dg-container', classNames?.container)}
      >
        {/* Header panel — conditionally rendered, overflow:hidden, scrollLeft mirrors body */}
        {showHeader && (
          <div ref={headerScrollRef} style={{ overflow: 'hidden' }} className={cn('dg-header', classNames?.header)}>
            <div style={{ width: innerWidth, minWidth: '100%' }}>
              {headerGroups.map((headerGroup) => (
                <DataGridHeaderRow
                  key={headerGroup.id}
                  headerGroup={headerGroup}
                  table={table}
                  enableColumnResizing={enableColumnResizing}
                  enableColumnFilters={enableColumnFilters}
                  filterDisplay={filterDisplay}
                  virtual={virtual}
                  bordered={bordered}
                  tableWidthMode={tableWidthMode}
                  enableColumnReordering={enableColumnReordering}
                  classNames={classNames}
                />
              ))}
              {enableColumnFilters && filterDisplay !== 'icon' && (
                <DataGridFilterRow
                  visibleLeafColumns={visibleLeafColumns}
                  table={table}
                  virtual={virtual}
                  bordered={bordered}
                  tableWidthMode={tableWidthMode}
                />
              )}
            </div>
          </div>
        )}

        {/* Body scroll container + scrollbars */}
        <div style={bodyWrapperStyle}>
          <div
            ref={bodyScrollRef}
            style={bodyStyle}
            onScroll={syncScroll}
            className="scrollbar-none"
          >
            <ScrollTable style={{ width: innerWidth, minWidth: '100%' }}>
              <DataGridBody
                rows={rows}
                table={table}
                visibleLeafColumns={visibleLeafColumns}
                rowVirtualizer={virtual ? rowVirtualizer : undefined}
                isLoading={isLoading}
                emptyMessage={emptyMessage}
                emptyContent={emptyContent}
                onRowClick={onRowClick}
                rowCursor={rowCursor}
                bordered={bordered}
                rowHeight={rowHeight}
                onActionTrigger={actionCol ? handleActionTrigger : undefined}
                tableWidthMode={tableWidthMode}
                classNames={classNames}
              />
            </ScrollTable>

            {loadMoreRef && (
              <div ref={loadMoreRef} style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
                {isFetchingNextPage && icons.loading}
              </div>
            )}
          </div>

          {/* Vertical custom scrollbar — overlays body right edge */}
          <CustomScrollbar
            scrollRef={bodyScrollRef}
            direction="vertical"
          />

          {/* Horizontal scrollbar — flex item; margin-right avoids overlap with vertical scrollbar */}
          <CustomScrollbar scrollRef={bodyScrollRef} direction="horizontal" style={{ height: 8, marginRight: hasVScroll ? 8 : 0 }} />
        </div>
      </div>

      {/* Single shared action menu — custom positioned, no base-ui dependency */}
      {actionCol && actionMenuOpen && anchorRef.current && (
        <ActionMenuPopup
          anchor={anchorRef.current}
          onClose={() => setActionMenuOpen(false)}
        >
          {actionItems.map((item, i) => (
            <button
              key={i}
              disabled={item.disabled}
              data-variant={item.variant ?? 'default'}
              onClick={() => {
                item.onClick(activeRow!)
                setActionMenuOpen(false)
              }}
              className="dg-action-item"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </ActionMenuPopup>
      )}
    </>
  )
}
