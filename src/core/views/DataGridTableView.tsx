import React, { useEffect, useState, useCallback, useLayoutEffect, useMemo } from 'react'
import {
  type Row,
  type Table,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import { ScrollTable } from '@/core/table/ScrollTable'
import { CustomScrollbar } from '@/core/table/CustomScrollbar'
import type { TableViewConfig } from '@/types'
import { useTableScrollSync } from '@/core/hooks/useTableScrollSync'
import { useTableVirtualizer } from '@/core/hooks/useTableVirtualizer'
import { useActionMenu } from '@/core/hooks/useActionMenu'
import { DataGridHeaderLayout } from '@/core/table/DataGridHeaderLayout'
import { DataGridFilterRow } from '@/core/table/DataGridFilterRow'
import { DataGridBody } from '@/core/table/DataGridBody'
import { DetailRowContext } from '@/features/expanding/DetailRowContext'
import { EditingCellContext } from '@/features/editing/EditingCellContext'
import { ActionMenuPopup } from './table/ActionMenuPopup'

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
  fillParent?: boolean
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
  headerGroupLayout = 'padded',
  onRowClick,
  rowCursor,
  enableColumnResizing = true,
  enableColumnFilters = false,
  customFilterComponents,
  filterDisplay = 'row',
  tableHeight,
  maxTableHeight,
  minTableHeight,
  fillContainer,
  fillParent,
  tableWidthMode = 'spacer',
  rowHeight,
  estimateRowHeight,
  overscan = 10,
  loadMoreRef,
  isFetchingNextPage,
  bordered = false,
  enableColumnReordering = false,
  enableColumnPinning = false,
  enableColumnMenu = false,
  renderColumnMenu,
  renderDetailRow,
  renderGroupRow,
  onCellValueChange,
  onMeasureColumns,
  classNames,
}: DataGridTableViewProps<T>) {
  const effectiveEstimate = estimateRowHeight ?? rowHeight ?? 33

  const headerGroups = table.getHeaderGroups()
  const visibleLeafColumns = table.getVisibleLeafColumns()

  // ── Master-Detail state ─────────────────────────────────────────────────
  const [expandedDetailRows, setExpandedDetailRows] = useState<Set<string>>(new Set())
  const detailRowCtx = useMemo(() => ({
    expandedRows: expandedDetailRows,
    toggleRow: (rowId: string) => setExpandedDetailRows((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      return next
    }),
  }), [expandedDetailRows])

  // ── Inline editing state ────────────────────────────────────────────────
  const [editingCellId, setEditingCellId] = useState<string | null>(null)
  const editingCtx = useMemo(() => ({
    editingCellId,
    startEdit: (cellId: string) => setEditingCellId(cellId),
    stopEdit: () => setEditingCellId(null),
    commitEdit: (rowId: string, columnId: string, value: unknown) => {
      onCellValueChange?.(rowId, columnId, value)
      setEditingCellId(null)
    },
  }), [editingCellId, onCellValueChange])

  const icons = useIcons()

  // ── Action menu ────────────────────────────────────────────────────────────
  const { open: actionMenuOpen, setOpen: setActionMenuOpen, activeRow, anchorRef, trigger: handleActionTrigger } = useActionMenu<T>()

  const actionCol = visibleLeafColumns.find((col) => col.columnDef.meta?.actions != null)
  const actionItems = actionCol && activeRow ? actionCol.columnDef.meta!.actions!(activeRow) : []

  // ── Scroll sync ────────────────────────────────────────────────────────────
  const { headerScrollRef, bodyScrollRef, syncScroll } = useTableScrollSync()
  const bodyWrapperRef = React.useRef<HTMLDivElement | null>(null)
  const [fillBodyMaxHeight, setFillBodyMaxHeight] = useState<number | undefined>()
  const hasFixedTableHeight = tableHeight != null && tableHeight !== 'auto'
  const hasFixedScrollContainer = hasFixedTableHeight || fillParent === true

  // ── Virtualizer ────────────────────────────────────────────────────────────
  const { virtual, virtualizer: rowVirtualizer } = useTableVirtualizer({
    rows,
    enabledByLayout: hasFixedScrollContainer,
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

  useLayoutEffect(() => {
    if (!fillContainer || fillParent || hasFixedTableHeight) {
      setFillBodyMaxHeight(undefined)
      return
    }

    const container = containerRef.current
    const tableWrapper = container?.parentElement
    const shell = tableWrapper?.parentElement
    if (!container || !tableWrapper || typeof ResizeObserver === 'undefined') return

    const measure = () => {
      const tableMaxHeight = Number.parseFloat(
        getComputedStyle(tableWrapper).getPropertyValue('--dg-fill-table-max-height'),
      )
      if (!(tableMaxHeight > 0)) return

      const headerHeight = showHeader
        ? (headerScrollRef.current?.getBoundingClientRect().height ?? 0)
        : 0
      const containerStyle = getComputedStyle(container)
      const borderY =
        (Number.parseFloat(containerStyle.borderTopWidth) || 0) +
        (Number.parseFloat(containerStyle.borderBottomWidth) || 0)
      const next = Math.floor(tableMaxHeight - headerHeight - borderY)

      setFillBodyMaxHeight((current) => {
        if (next <= 0) return current
        return current === next ? current : next
      })
    }

    const observer = new ResizeObserver(measure)
    if (shell) observer.observe(shell)
    observer.observe(tableWrapper)
    observer.observe(container)
    if (headerScrollRef.current) observer.observe(headerScrollRef.current)
    if (bodyWrapperRef.current) observer.observe(bodyWrapperRef.current)
    window.addEventListener('resize', measure)
    measure()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [containerRef, fillContainer, fillParent, hasFixedTableHeight, headerScrollRef, showHeader, tableHeight])

  // Body wrapper: fixed height when tableHeight is set so hscroll stays inside
  const toCSS = (v: string | number) => (typeof v === 'number' ? `${v}px` : v)
  const bodyWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    ...(hasFixedTableHeight
      ? { height: toCSS(tableHeight as string | number) }
      : fillParent
        ? { flex: '1 1 auto', minHeight: 0 }
      : fillContainer
        ? fillBodyMaxHeight != null
          ? { maxHeight: toCSS(fillBodyMaxHeight) }
          : {}
        : maxTableHeight != null
        ? { maxHeight: toCSS(maxTableHeight) }
        : {}),
    ...(minTableHeight != null ? { minHeight: toCSS(minTableHeight) } : {}),
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
        className={cn('dg-container', fillContainer && !fillParent && 'dg-container--fill', classNames?.container)}
      >
        {/* Header panel — conditionally rendered, overflow:hidden, scrollLeft mirrors body */}
        {showHeader && (
          <div ref={headerScrollRef} style={{ overflow: 'hidden' }} className={cn('dg-header', classNames?.header)}>
            <div style={{ width: innerWidth, minWidth: '100%' }}>
              <DataGridHeaderLayout
                headerGroups={headerGroups}
                table={table}
                enableColumnResizing={enableColumnResizing}
                enableColumnFilters={enableColumnFilters}
                customFilterComponents={customFilterComponents}
                filterDisplay={filterDisplay}
                virtual={virtual}
                bordered={bordered}
                tableWidthMode={tableWidthMode}
                headerGroupLayout={headerGroupLayout}
                enableColumnReordering={enableColumnReordering}
                enableColumnPinning={enableColumnPinning}
                enableColumnMenu={enableColumnMenu}
                renderColumnMenu={renderColumnMenu}
                classNames={classNames}
              />
              {enableColumnFilters && filterDisplay !== 'icon' && !enableColumnMenu && (
                <DataGridFilterRow
                  visibleLeafColumns={visibleLeafColumns}
                  table={table}
                  virtual={virtual}
                  bordered={bordered}
                  tableWidthMode={tableWidthMode}
                  customFilterComponents={customFilterComponents}
                />
              )}
            </div>
          </div>
        )}

        {/* Body scroll container + scrollbars */}
        <div
          ref={bodyWrapperRef}
          className={cn('dg-body-wrapper', fillContainer && !fillParent && 'dg-body-wrapper--fill')}
          style={bodyWrapperStyle}
        >
          <div
            ref={bodyScrollRef}
            style={bodyStyle}
            onScroll={syncScroll}
            className="dg-body-scroll scrollbar-none"
          >
            <ScrollTable style={{ width: innerWidth, minWidth: '100%' }}>
              <DetailRowContext value={detailRowCtx}>
                <EditingCellContext value={editingCtx}>
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
                    renderDetailRow={renderDetailRow}
                    renderGroupRow={renderGroupRow}
                    classNames={classNames}
                  />
                </EditingCellContext>
              </DetailRowContext>
            </ScrollTable>

            {loadMoreRef && (
              <div ref={loadMoreRef} className={cn('dg-table-load-more', classNames?.loadMore)}>
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
              type="button"
              role="menuitem"
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
