import React, { useEffect, useState, useCallback, useLayoutEffect, useMemo } from 'react'
import {
  type Row,
  type Table,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import { useGridKitLabels } from '@/core/LabelsContext'
import { ScrollTable } from '@/core/table/ScrollTable'
import type { DataGridStyles, TableViewConfig } from '@/types'
import { useTableScrollSync } from '@/core/hooks/useTableScrollSync'
import { useTableVirtualizer } from '@/core/hooks/useTableVirtualizer'
import { useActionMenu } from '@/core/hooks/useActionMenu'
import { useGridKeyboardNavigation } from '@/core/hooks/useGridKeyboardNavigation'
import { DataGridBody } from '@/core/table/DataGridBody'
import { buildTableLayoutModel } from '@/core/table/layout/buildTableLayoutModel'
import type { ColumnRegionModel } from '@/core/table/layout/tableLayoutTypes'
import { DetailRowContext } from '@/features/expanding/DetailRowContext'
import { EditingCellContext } from '@/features/editing/EditingCellContext'
import { ActionMenuPopup } from './table/ActionMenuPopup'
import { TableHeaderRegions } from './table/TableHeaderRegions'
import { TableScrollbars } from './table/TableScrollbars'

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
  styles?: DataGridStyles
}

// ─────────────────────────────────────────────────────────────────────────────
// DataGridTableView (main)
// ─────────────────────────────────────────────────────────────────────────────

export function DataGridTableView<T extends object>({
  table,
  rows,
  containerRef,
  isLoading,
  emptyMessage,
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
  enableKeyboardNavigation = true,
  classNames,
  styles,
}: DataGridTableViewProps<T>) {
  const effectiveEstimate = estimateRowHeight ?? rowHeight ?? 33
  const labels = useGridKitLabels()
  const effectiveEmptyMessage = emptyMessage ?? labels.noData

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
  const leftBodyScrollRef = React.useRef<HTMLDivElement | null>(null)
  const rightBodyScrollRef = React.useRef<HTMLDivElement | null>(null)
  const { headerScrollRef, bodyScrollRef, syncScroll } = useTableScrollSync([
    leftBodyScrollRef,
    rightBodyScrollRef,
  ])
  const bodyWrapperRef = React.useRef<HTMLDivElement | null>(null)
  const [fillBodyMaxHeight, setFillBodyMaxHeight] = useState<number | undefined>()
  const hasFixedTableHeight = tableHeight != null && tableHeight !== 'auto'
  const hasFixedScrollContainer = hasFixedTableHeight || fillParent === true || fillContainer === true

  // ── Virtualizer ────────────────────────────────────────────────────────────
  const { virtual, virtualizer: rowVirtualizer } = useTableVirtualizer({
    rows,
    enabledByLayout: hasFixedScrollContainer,
    bodyScrollRef,
    estimateSize: effectiveEstimate,
    overscan,
  })
  const keyboard = useGridKeyboardNavigation({
    enabled: enableKeyboardNavigation,
    rows,
    table,
    containerRef,
    rowVirtualizer: virtual ? rowVirtualizer : undefined,
    editingCellId,
    startEdit: editingCtx.startEdit,
    stopEdit: editingCtx.stopEdit,
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

  const layout = buildTableLayoutModel({
    visibleLeafColumns,
    tableWidthMode,
    enableColumnReordering,
    hasVScroll,
  })

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
        getComputedStyle(tableWrapper).getPropertyValue('--gridkit-fill-table-max-height'),
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

  const handleHeaderWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const el = bodyScrollRef.current
    if (!el) return

    const horizontalDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) || event.shiftKey
      ? event.deltaX || event.deltaY
      : 0
    if (horizontalDelta === 0) return

    event.preventDefault()
    el.scrollLeft += horizontalDelta
  }, [bodyScrollRef])

  const renderBodyRegion = ({
    region,
    scrollRef,
  }: {
    region: ColumnRegionModel<T>
    scrollRef?: React.RefObject<HTMLDivElement | null>
  }) => {
    if (region.columns.length === 0) return null

    return (
      <div
        ref={scrollRef}
        className={cn('gridkit-body-scroll', 'scrollbar-none', region.id !== 'center' && 'gridkit-body-scroll--pinned')}
        style={region.id === 'center' ? bodyStyle : { overflow: 'hidden', minHeight: 0 }}
        onScroll={region.id === 'center' ? syncScroll : undefined}
      >
        <ScrollTable style={{ width: region.width, minWidth: region.id === 'center' ? '100%' : undefined }}>
          <DetailRowContext value={detailRowCtx}>
            <EditingCellContext value={editingCtx}>
              <DataGridBody
                rows={rows}
                table={table}
                visibleLeafColumns={region.columns}
                rowVirtualizer={virtual ? rowVirtualizer : undefined}
                isLoading={isLoading}
                emptyMessage={effectiveEmptyMessage}
                emptyContent={emptyContent}
                onRowClick={onRowClick}
                rowCursor={rowCursor}
                bordered={bordered}
                rowHeight={rowHeight}
                onActionTrigger={actionCol ? handleActionTrigger : undefined}
                tableWidthMode={region.tableWidthMode}
                pinning={false}
                measureRows={region.measureRows}
                renderDetailRow={renderDetailRow}
                renderGroupRow={renderGroupRow}
                classNames={classNames}
                styles={styles}
                focusedCell={keyboard.focusedCell}
                activeFocusedCell={keyboard.activeFocusedCell}
                columnIndexById={keyboard.columnIndexById}
                onCellKeyDown={keyboard.handleCellKeyDown}
                onCellFocus={keyboard.handleCellFocus}
              />
            </EditingCellContext>
          </DetailRowContext>
        </ScrollTable>
        {region.id === 'center' && loadMoreRef && (
          <div ref={loadMoreRef} className={cn('gridkit-table-load-more', classNames?.loadMore)} style={styles?.loadMore}>
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
          contain: 'layout paint',
          ...styles?.content,
        }}
        className={cn('gridkit-container', fillContainer && !fillParent && 'gridkit-container--fill', classNames?.content)}
        role="grid"
        aria-label={labels.grid}
        aria-rowcount={rows.length}
        aria-colcount={visibleLeafColumns.length}
      >
        {/* Header panel — split into pinned and horizontally scrollable regions. */}
        <TableHeaderRegions
          layout={layout}
          headerGroups={headerGroups}
          table={table}
          showHeader={showHeader}
          enableColumnResizing={enableColumnResizing}
          enableColumnFilters={enableColumnFilters}
          customFilterComponents={customFilterComponents}
          filterDisplay={filterDisplay}
          bordered={bordered}
          virtual={virtual}
          headerGroupLayout={headerGroupLayout}
          enableColumnPinning={enableColumnPinning}
          enableColumnMenu={enableColumnMenu}
          renderColumnMenu={renderColumnMenu}
          classNames={classNames}
          styles={styles}
          headerScrollRef={headerScrollRef}
          onCenterWheel={handleHeaderWheel}
        />

        {/* Body scroll container + scrollbars */}
        <div
          ref={bodyWrapperRef}
          className={cn('gridkit-body-wrapper', fillContainer && !fillParent && 'gridkit-body-wrapper--fill', classNames?.body)}
          style={{ ...bodyWrapperStyle, ...styles?.body }}
        >
          <div className="gridkit-region-grid gridkit-body-regions" style={{ gridTemplateColumns: layout.gridTemplateColumns, flex: 1, minHeight: 0 }}>
            {layout.hasLeftRegion && (
              <div className="gridkit-region gridkit-region--left" style={{ width: layout.regions.left.width, minHeight: 0 }}>
                {renderBodyRegion({ region: layout.regions.left, scrollRef: leftBodyScrollRef })}
              </div>
            )}
            <div className="gridkit-region gridkit-region--center" style={{ minHeight: 0, minWidth: 0 }}>
              {renderBodyRegion({ region: layout.regions.center, scrollRef: bodyScrollRef })}
            </div>
            {layout.hasRightRegion && (
              <div className="gridkit-region gridkit-region--right" style={{ width: layout.regions.right.width, minHeight: 0 }}>
                {renderBodyRegion({ region: layout.regions.right, scrollRef: rightBodyScrollRef })}
              </div>
            )}
          </div>

          <TableScrollbars
            bodyScrollRef={bodyScrollRef}
            horizontalStyle={layout.horizontalScrollbarStyle}
          />
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
              className="gridkit-action-item"
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
