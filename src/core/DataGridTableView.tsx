import React, { useEffect } from 'react'
import {
  type Row,
  type Table,
} from '@tanstack/react-table'
import { Loader2 } from 'lucide-react'
import { Menu as ActionMenu } from '@base-ui/react/menu'
import { cn } from '@/lib/utils'
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
  onMeasureColumns,
  classNames,
}: DataGridTableViewProps<T>) {
  const effectiveEstimate = estimateRowHeight ?? rowHeight ?? 33

  const headerGroups = table.getHeaderGroups()
  const visibleLeafColumns = table.getVisibleLeafColumns()

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
    height: '100%',
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
        className={cn('rounded-md border border-border', classNames?.container)}
      >
        {/* Header panel — conditionally rendered, overflow:hidden, scrollLeft mirrors body */}
        {showHeader && (
          <div ref={headerScrollRef} style={{ overflow: 'hidden' }} className={cn('bg-muted', classNames?.header)}>
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
            className="scrollbar-none bg-background"
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
              <div ref={loadMoreRef} className="py-2 flex justify-center">
                {isFetchingNextPage && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          {/* Vertical custom scrollbar — overlays body right edge */}
          <CustomScrollbar
            scrollRef={bodyScrollRef}
            direction="vertical"
            className="absolute right-0 top-0 bottom-0"
            style={{ width: 8 }}
          />

          {/* Horizontal scrollbar — flex item, pushes rows up from inside */}
          <CustomScrollbar scrollRef={bodyScrollRef} direction="horizontal" style={{ height: 8 }} />
        </div>
      </div>

      {/* Single shared action menu — anchored to the clicked trigger button */}
      {actionCol && (
        <ActionMenu.Root open={actionMenuOpen} onOpenChange={setActionMenuOpen}>
          <ActionMenu.Portal>
            <ActionMenu.Positioner
              anchor={anchorRef.current}
              side="bottom"
              align="end"
              sideOffset={4}
              className="isolate z-50 outline-none"
            >
              <ActionMenu.Popup className="min-w-32 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
                {actionItems.map((item, i) => (
                  <ActionMenu.Item
                    key={i}
                    disabled={item.disabled}
                    data-variant={item.variant ?? 'default'}
                    onClick={() => {
                      item.onClick(activeRow!)
                      setActionMenuOpen(false)
                    }}
                    className="relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  >
                    {item.icon}
                    {item.label}
                  </ActionMenu.Item>
                ))}
              </ActionMenu.Popup>
            </ActionMenu.Positioner>
          </ActionMenu.Portal>
        </ActionMenu.Root>
      )}
    </>
  )
}
