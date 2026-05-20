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
import { getColumnsWidth, splitVisibleColumnsByPin, type ColumnRegion } from '@/core/table/tableUtils'
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
  // Region widths are JS-owned: all header/body regions share the same values,
  // so header-body column alignment is guaranteed without CSS involvement.
  const columnRegions = splitVisibleColumnsByPin(visibleLeafColumns)
  const regionWidths = {
    left: getColumnsWidth(columnRegions.left),
    center: getColumnsWidth(columnRegions.center),
    right: getColumnsWidth(columnRegions.right),
  }
  const hasLeftRegion = regionWidths.left > 0
  const hasRightRegion = regionWidths.right > 0

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
  const leftBodyScrollRef = React.useRef<HTMLDivElement | null>(null)
  const rightBodyScrollRef = React.useRef<HTMLDivElement | null>(null)
  const { headerScrollRef, bodyScrollRef, syncScroll } = useTableScrollSync([
    leftBodyScrollRef,
    rightBodyScrollRef,
  ])
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

  const centerWidth = regionWidths.center
  const gridTemplateColumns = `${regionWidths.left}px minmax(0, 1fr) ${regionWidths.right}px`
  const renderHeaderRegion = (region: ColumnRegion) => {
    const columns = columnRegions[region]
    if (columns.length === 0) return null

    return (
      <DataGridHeaderLayout
        headerGroups={headerGroups}
        table={table}
        visibleLeafColumns={columns}
        enableColumnResizing={enableColumnResizing}
        enableColumnFilters={enableColumnFilters}
        customFilterComponents={customFilterComponents}
        filterDisplay={filterDisplay}
        virtual={virtual}
        bordered={bordered}
        tableWidthMode={region === 'center' ? tableWidthMode : 'independent'}
        headerGroupLayout={headerGroupLayout}
        enableColumnReordering={enableColumnReordering && region === 'center'}
        enableColumnPinning={enableColumnPinning}
        enableColumnMenu={enableColumnMenu}
        renderColumnMenu={renderColumnMenu}
        classNames={classNames}
      />
    )
  }

  const renderFilterRegion = (region: ColumnRegion) => {
    const columns = columnRegions[region]
    if (columns.length === 0) return null

    return (
      <DataGridFilterRow
        visibleLeafColumns={columns}
        table={table}
        virtual={virtual}
        bordered={bordered}
        tableWidthMode={region === 'center' ? tableWidthMode : 'independent'}
        pinning={false}
        customFilterComponents={customFilterComponents}
      />
    )
  }

  const renderBodyRegion = ({
    region,
    scrollRef,
    measureRows,
  }: {
    region: ColumnRegion
    scrollRef?: React.RefObject<HTMLDivElement | null>
    measureRows: boolean
  }) => {
    const columns = columnRegions[region]
    if (columns.length === 0) return null

    return (
      <div
        ref={scrollRef}
        className={cn('dg-body-scroll', 'scrollbar-none', region !== 'center' && 'dg-body-scroll--pinned')}
        style={region === 'center' ? bodyStyle : { overflow: 'hidden', minHeight: 0 }}
        onScroll={region === 'center' ? syncScroll : undefined}
      >
        <ScrollTable style={{ width: regionWidths[region], minWidth: region === 'center' ? '100%' : undefined }}>
          <DetailRowContext value={detailRowCtx}>
            <EditingCellContext value={editingCtx}>
              <DataGridBody
                rows={rows}
                table={table}
                visibleLeafColumns={columns}
                rowVirtualizer={virtual ? rowVirtualizer : undefined}
                isLoading={isLoading}
                emptyMessage={emptyMessage}
                emptyContent={emptyContent}
                onRowClick={onRowClick}
                rowCursor={rowCursor}
                bordered={bordered}
                rowHeight={rowHeight}
                onActionTrigger={actionCol ? handleActionTrigger : undefined}
                tableWidthMode={region === 'center' ? tableWidthMode : 'independent'}
                pinning={false}
                measureRows={measureRows}
                renderDetailRow={renderDetailRow}
                renderGroupRow={renderGroupRow}
                classNames={classNames}
              />
            </EditingCellContext>
          </DetailRowContext>
        </ScrollTable>
        {region === 'center' && loadMoreRef && (
          <div ref={loadMoreRef} className={cn('dg-table-load-more', classNames?.loadMore)}>
            {isFetchingNextPage && icons.loading}
          </div>
        )}
      </div>
    )
  }

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
        {/* Header panel — split into pinned and horizontally scrollable regions. */}
        {showHeader && (
          <div className={cn('dg-header', classNames?.header)}>
            <div className="dg-region-grid" style={{ gridTemplateColumns }}>
              {hasLeftRegion && (
                <div className="dg-region dg-region--left" style={{ width: regionWidths.left }}>
                  {renderHeaderRegion('left')}
                  {enableColumnFilters && filterDisplay !== 'icon' && !enableColumnMenu && renderFilterRegion('left')}
                </div>
              )}
              <div ref={headerScrollRef} className="dg-region dg-region--center" style={{ overflow: 'hidden' }}>
                <div style={{ width: centerWidth, minWidth: '100%' }}>
                  {renderHeaderRegion('center')}
                  {enableColumnFilters && filterDisplay !== 'icon' && !enableColumnMenu && renderFilterRegion('center')}
                </div>
              </div>
              {hasRightRegion && (
                <div className="dg-region dg-region--right" style={{ width: regionWidths.right }}>
                  {renderHeaderRegion('right')}
                  {enableColumnFilters && filterDisplay !== 'icon' && !enableColumnMenu && renderFilterRegion('right')}
                </div>
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
          <div className="dg-region-grid dg-body-regions" style={{ gridTemplateColumns, flex: 1, minHeight: 0 }}>
            {hasLeftRegion && (
              <div className="dg-region dg-region--left" style={{ width: regionWidths.left, minHeight: 0 }}>
                {renderBodyRegion({ region: 'left', scrollRef: leftBodyScrollRef, measureRows: false })}
              </div>
            )}
            <div className="dg-region dg-region--center" style={{ minHeight: 0, minWidth: 0 }}>
              {renderBodyRegion({ region: 'center', scrollRef: bodyScrollRef, measureRows: true })}
            </div>
            {hasRightRegion && (
              <div className="dg-region dg-region--right" style={{ width: regionWidths.right, minHeight: 0 }}>
                {renderBodyRegion({ region: 'right', scrollRef: rightBodyScrollRef, measureRows: false })}
              </div>
            )}
          </div>

          {/* Horizontal scrollbar — margin-left/right avoids pinned regions and vertical scrollbar */}
          <CustomScrollbar
            scrollRef={bodyScrollRef}
            direction="horizontal"
            style={{
              height: 8,
              marginLeft: regionWidths.left,
              marginRight: regionWidths.right + (hasVScroll ? 8 : 0),
            }}
          />

          {/* Vertical scrollbar — absolutely positioned at far-right edge of body wrapper */}
          <CustomScrollbar scrollRef={bodyScrollRef} direction="vertical" />
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
