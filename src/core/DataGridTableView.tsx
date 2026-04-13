import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  flexRender,
  type Row,
  type Table,
  type Column,
  type HeaderGroup,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, Loader2, MoreHorizontal, SlidersHorizontal, X } from 'lucide-react'
import type { Virtualizer } from '@tanstack/react-virtual'
import { Menu as ActionMenu } from '@base-ui/react/menu'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollTable } from '@/core/ScrollTable'
import { CustomScrollbar } from '@/core/CustomScrollbar'
import { RowWrapperContext } from '@/features/reordering/RowWrapperContext'
import type { TableViewConfig, TableWidthMode } from '@/types'
import { VIRTUAL_THRESHOLD } from '@/core/hooks/useColumnSizing'

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
// Utility
// ─────────────────────────────────────────────────────────────────────────────

function colStyle<T extends object>(col: Column<T>): React.CSSProperties {
  const pinned = col.getIsPinned()
  return {
    width: col.getSize(),
    flexShrink: 0,
    ...(pinned === 'left' && {
      position: 'sticky',
      left: col.getStart('left'),
      zIndex: 1,
    }),
    ...(pinned === 'right' && {
      position: 'sticky',
      right: col.getAfter('right'),
      zIndex: 1,
    }),
  }
}

function isPinnedEdge<T extends object>(col: Column<T>, table: Table<T>): 'left-edge' | 'right-edge' | false {
  const pinned = col.getIsPinned()
  if (pinned === 'left') {
    const leftCols = table.getLeftLeafColumns()
    return leftCols[leftCols.length - 1]?.id === col.id ? 'left-edge' : false
  }
  if (pinned === 'right') {
    const rightCols = table.getRightLeafColumns()
    return rightCols[0]?.id === col.id ? 'right-edge' : false
  }
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// DataGridHeaderRow
// ─────────────────────────────────────────────────────────────────────────────

interface DataGridHeaderRowProps<T extends object>
  extends Pick<TableViewConfig<T>, 'enableColumnResizing' | 'bordered' | 'enableColumnFilters' | 'filterDisplay'> {
  headerGroup: HeaderGroup<T>
  table: Table<T>
  virtual: boolean
  tableWidthMode?: TableWidthMode
}

function DataGridHeaderRow<T extends object>({
  headerGroup,
  table,
  enableColumnResizing,
  virtual,
  bordered,
  tableWidthMode = 'spacer',
  enableColumnFilters,
  filterDisplay = 'row',
}: DataGridHeaderRowProps<T>) {
  const headers = headerGroup.headers
  return (
    <div
      role="row"
      className="border-b border-border"
      style={{ display: 'flex', width: '100%', height: '36px' }}
    >
      {headers.map((header, idx) => {
        const edge = isPinnedEdge(header.column, table)
        const isLast = idx === headers.length - 1
        const isFillLast = tableWidthMode === 'fill-last' && isLast
        return (
          <div
            role="columnheader"
            key={header.id}
            data-col-id={header.column.id}
            className={cn(
              'relative px-3 text-xs font-medium h-full bg-muted',
              'text-muted-foreground whitespace-normal',
              'select-none group',
              header.column.getCanSort() && 'cursor-pointer',
              bordered && 'border-r border-border',
              edge === 'left-edge' && 'shadow-[1px_0_0_0_hsl(var(--border))]',
              edge === 'right-edge' && 'shadow-[-1px_0_0_0_hsl(var(--border))]',
            )}
            style={
              virtual
                ? { display: 'flex', alignItems: 'center', width: isFillLast ? undefined : header.getSize(), ...(isFillLast && { flex: 1, minWidth: header.getSize() }) }
                : { ...colStyle(header.column), display: 'flex', alignItems: 'center', overflow: 'hidden', ...(isFillLast && { flex: 1, width: 'auto' }) }
            }
            onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
          >
            <span className="flex items-center gap-1 min-w-0 overflow-hidden flex-1">
              <span className="truncate">
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </span>
              {header.column.getCanSort() && (
                <span className="ml-1 shrink-0">
                  {header.column.getIsSorted() === 'asc' ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : header.column.getIsSorted() === 'desc' ? (
                    <ArrowDown className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                  )}
                </span>
              )}
            </span>

            {enableColumnFilters && filterDisplay === 'icon' && (
              <HeaderFilterPopover col={header.column} table={table} />
            )}

            {enableColumnResizing && header.column.getCanResize() && (
              <div
                onMouseDown={(e) => { e.stopPropagation(); header.getResizeHandler()(e) }}
                onTouchStart={(e) => { e.stopPropagation(); header.getResizeHandler()(e) }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-0 h-full w-3 cursor-col-resize select-none touch-none"
              >
                <div className={cn(
                  'absolute right-1.5 top-2 bottom-2 w-px rounded-full transition-colors',
                  'opacity-0 group-hover:opacity-100',
                  header.column.getIsResizing()
                    ? 'opacity-100 bg-primary'
                    : 'bg-border hover:bg-primary',
                )} />
              </div>
            )}
          </div>
        )
      })}
      {!virtual && tableWidthMode === 'spacer' && (
        <div role="columnheader" style={{ flex: 1, minWidth: 0, padding: 0 }} className="bg-muted" />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HeaderFilterPopover — icon mode filter trigger inside header cell
// ─────────────────────────────────────────────────────────────────────────────

function HeaderFilterPopover<T extends object>({ col, table }: { col: Column<T>; table: Table<T> }) {
  const [open, setOpen] = useState(false)
  const ft = col.columnDef.meta?.filterType
  if (ft === false || ft === undefined) return null

  const hasFilter = col.getIsFiltered()
  const filterValue = (col.getFilterValue() ?? '') as string
  const numFilter = col.getFilterValue() as [string, string] | undefined
  const min = numFilter?.[0] ?? ''
  const max = numFilter?.[1] ?? ''

  return (
    <div onClick={(e) => e.stopPropagation()}>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={(props) => (
        <Button
          {...props}
          variant="ghost"
          size="icon-xs"
          className={cn(
            'h-5 w-5 shrink-0',
            hasFilter ? 'text-primary opacity-100' : 'opacity-0 group-hover:opacity-60',
          )}
        >
          <Filter className="h-3 w-3" />
        </Button>
      )} />
      <PopoverContent
        side="bottom"
        align="start"
        className="w-52"
      >
        {ft === 'select' ? (
          <SelectFilterCell
            col={col}
            table={table}
            onSelect={() => setOpen(false)}
          />
        ) : ft === 'number' ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Min</span>
              <Input
                type="number"
                placeholder="Min"
                value={min}
                onChange={(e) =>
                  col.setFilterValue((old: [string, string] = ['', '']) => [e.target.value, old[1]])
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Max</span>
              <Input
                type="number"
                placeholder="Max"
                value={max}
                onChange={(e) =>
                  col.setFilterValue((old: [string, string] = ['', '']) => [old[0], e.target.value])
                }
                className="h-7 text-xs"
              />
            </div>
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => col.setFilterValue(undefined)}
              >
                Clear
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            <Input
              type="text"
              placeholder="Filter…"
              value={filterValue}
              onChange={(e) => col.setFilterValue(e.target.value || undefined)}
              className="h-7 text-xs pr-6"
              autoFocus
            />
            {filterValue && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => col.setFilterValue(undefined)}
                className="absolute right-0.5 top-1/2 -translate-y-1/2"
              >
                <X />
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NumberFilterPopover
// ─────────────────────────────────────────────────────────────────────────────

function NumberFilterPopover<T extends object>({ col }: { col: Column<T> }) {
  const numFilter = col.getFilterValue() as [string, string] | undefined
  const min = numFilter?.[0] ?? ''
  const max = numFilter?.[1] ?? ''
  const hasFilter = min !== '' || max !== ''

  const label = hasFilter
    ? [min && `≥${min}`, max && `≤${max}`].filter(Boolean).join(' ')
    : 'Filter…'

  return (
    <Popover>
      <PopoverTrigger render={(props) => (
        <Button
          {...props}
          variant={hasFilter ? 'outline' : 'ghost'}
          size="sm"
          className="h-7 w-full justify-start text-xs font-normal"
        >
          <SlidersHorizontal className="h-3 w-3 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      )} />
      <PopoverContent side="bottom" align="start" className="w-48">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Min</span>
            <Input
              type="number"
              placeholder="Min"
              value={min}
              onChange={(e) =>
                col.setFilterValue((old: [string, string] = ['', '']) => [e.target.value, old[1]])
              }
              className="h-7 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Max</span>
            <Input
              type="number"
              placeholder="Max"
              value={max}
              onChange={(e) =>
                col.setFilterValue((old: [string, string] = ['', '']) => [old[0], e.target.value])
              }
              className="h-7 text-xs"
            />
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => col.setFilterValue(undefined)}
            >
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SelectFilterCell — lazily scans rows on first open
// ─────────────────────────────────────────────────────────────────────────────

function SelectFilterCell<T extends object>({
  col,
  table,
  onSelect,
}: {
  col: Column<T>
  table: Table<T>
  onSelect?: () => void
}) {
  const [options, setOptions] = useState<{ label: string; value: string | null }[] | null>(null)
  const filterValue = (col.getFilterValue() ?? '') as string

  const handleOpenChange = (open: boolean) => {
    if (open && options === null) {
      const vals = new Set<string>()
      table.getCoreRowModel().rows.forEach((row) => {
        const v = row.getValue(col.id)
        if (v != null) vals.add(String(v))
      })
      const sorted = Array.from(vals).sort()
      setOptions([{ label: 'All', value: null }, ...sorted.map((v) => ({ label: v, value: v }))])
    }
  }

  const items = options ?? []

  return (
    <Select
      items={items}
      value={filterValue || null}
      onValueChange={(val) => {
        col.setFilterValue(val ?? undefined)
        onSelect?.()
      }}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger size="sm" className="h-7 w-full text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value ?? '__all__'} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataGridFilterRow
// ─────────────────────────────────────────────────────────────────────────────

interface DataGridFilterRowProps<T extends object>
  extends Pick<TableViewConfig<T>, 'bordered'> {
  visibleLeafColumns: Column<T>[]
  table: Table<T>
  virtual: boolean
  tableWidthMode?: TableWidthMode
}

function DataGridFilterRow<T extends object>({
  visibleLeafColumns,
  table,
  virtual,
  bordered,
  tableWidthMode = 'spacer',
}: DataGridFilterRowProps<T>) {
  return (
    <div
      role="row"
      className="border-b border-border bg-muted"
      style={{ display: 'flex', width: '100%', height: '36px' }}
    >
      {visibleLeafColumns.map((col) => {
        const ft = col.columnDef.meta?.filterType
        const filterValue = (col.getFilterValue() ?? '') as string
        const cellStyle: React.CSSProperties = virtual
          ? { display: 'flex', alignItems: 'center', width: col.getSize() }
          : { ...colStyle(col), display: 'flex', alignItems: 'center' }

        if (ft === false) {
          return (
            <div
              role="columnheader"
              key={col.id}
              className={cn('px-2 py-1', bordered && 'border-r border-border')}
              style={cellStyle}
            />
          )
        }

        return (
          <div
            role="columnheader"
            key={col.id}
            className={cn('px-2 py-1 font-normal', bordered && 'border-r border-border')}
            style={cellStyle}
          >
            {ft === 'select' ? (
              <SelectFilterCell col={col} table={table} />
            ) : ft === 'number' ? (
              <NumberFilterPopover col={col} />
            ) : (
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Filter…"
                  value={filterValue}
                  onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                  className="h-7 text-xs pr-6"
                />
                {filterValue && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => col.setFilterValue(undefined)}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2"
                  >
                    <X />
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      })}
      {!virtual && tableWidthMode === 'spacer' && (
        <div role="columnheader" style={{ flex: 1, minWidth: 0, padding: 0 }} className="bg-muted" />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataGridBodyRow
// ─────────────────────────────────────────────────────────────────────────────

interface DataGridBodyRowProps<T extends object>
  extends Pick<TableViewConfig<T>, 'onRowClick' | 'rowCursor' | 'bordered'> {
  row: Row<T>
  table: Table<T>
  style?: React.CSSProperties
  dataIndex?: number
  measureRef?: (node: Element | null) => void
  showSpacer?: boolean
  fillLast?: boolean
  rowHeight?: number
  onActionTrigger?: (row: T, el: HTMLElement) => void
}

function DataGridBodyRow<T extends object>({
  row,
  table,
  onRowClick,
  rowCursor,
  style,
  dataIndex,
  measureRef,
  showSpacer = false,
  fillLast = false,
  bordered = false,
  rowHeight,
  onActionTrigger,
}: DataGridBodyRowProps<T>) {
  const visibleCells = row.getVisibleCells()
  return (
    <div
      role="row"
      data-index={dataIndex}
      ref={measureRef}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      className={cn(
        'flex w-full border-b border-border transition-colors',
        onRowClick || rowCursor ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/30',
      )}
      style={{ minHeight: rowHeight, ...style }}
    >
      {visibleCells.map((cell, idx) => {
        const meta = cell.column.columnDef.meta
        const edge = isPinnedEdge(cell.column, table)
        const isLast = idx === visibleCells.length - 1
        const isFillCell = fillLast && isLast
        return (
          <div
            role="gridcell"
            key={cell.id}
            data-col-id={cell.column.id}
            className={cn(
              'flex items-center px-3 py-1 overflow-hidden bg-background',
              meta?.align === 'right' && 'justify-end',
              meta?.align === 'center' && 'justify-center',
              meta?.wrap && 'items-start whitespace-normal',
              bordered && 'border-r border-border',
              edge === 'left-edge' && 'shadow-[1px_0_0_0_hsl(var(--border))]',
              edge === 'right-edge' && 'shadow-[-1px_0_0_0_hsl(var(--border))]',
            )}
            style={{ ...colStyle(cell.column), ...(isFillCell && { flex: 1, width: 'auto' }) }}
          >
            {meta?.actions != null ? (
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onActionTrigger?.(row.original, e.currentTarget as HTMLElement)
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            ) : (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            )}
          </div>
        )
      })}
      {showSpacer && (
        <div role="gridcell" style={{ flex: 1, minWidth: 0, padding: 0 }} className="bg-background" />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataGridVirtualBody
// ─────────────────────────────────────────────────────────────────────────────

interface DataGridVirtualBodyProps<T extends object>
  extends Pick<TableViewConfig<T>, 'onRowClick' | 'rowCursor' | 'bordered' | 'rowHeight'> {
  rows: Row<T>[]
  table: Table<T>
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  onActionTrigger?: (row: T, el: HTMLElement) => void
  tableWidthMode?: TableWidthMode
}

function DataGridVirtualBody<T extends object>({
  rows,
  table,
  rowVirtualizer,
  onRowClick,
  rowCursor,
  bordered,
  rowHeight,
  onActionTrigger,
  tableWidthMode = 'spacer',
}: DataGridVirtualBodyProps<T>) {
  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  return (
    <div role="rowgroup" style={{ display: 'block', height: totalSize, position: 'relative' }}>
      {virtualItems.map((virtualRow) => {
        const row = rows[virtualRow.index]!
        return (
          <DataGridBodyRow
            key={row.id}
            row={row}
            table={table}
            onRowClick={onRowClick}
            rowCursor={rowCursor}
            bordered={bordered}
            rowHeight={rowHeight}
            dataIndex={virtualRow.index}
            measureRef={rowVirtualizer.measureElement}
            style={{ position: 'absolute', width: '100%', transform: `translateY(${virtualRow.start}px)` }}
            onActionTrigger={onActionTrigger}
            fillLast={tableWidthMode === 'fill-last'}
          />
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataGridFlexBody
// ─────────────────────────────────────────────────────────────────────────────

interface DataGridFlexBodyProps<T extends object>
  extends Pick<TableViewConfig<T>, 'isLoading' | 'emptyMessage' | 'onRowClick' | 'rowCursor' | 'bordered' | 'rowHeight'> {
  rows: Row<T>[]
  table: Table<T>
  visibleLeafColumns: Column<T>[]
  onActionTrigger?: (row: T, el: HTMLElement) => void
  tableWidthMode?: TableWidthMode
}

function DataGridFlexBody<T extends object>({
  rows,
  table,
  visibleLeafColumns,
  isLoading,
  emptyMessage,
  onRowClick,
  rowCursor,
  bordered,
  rowHeight,
  onActionTrigger,
  tableWidthMode = 'spacer',
}: DataGridFlexBodyProps<T>) {
  const showSpacer = tableWidthMode === 'spacer'
  const fillLast = tableWidthMode === 'fill-last'
  const RowWrapper = useContext(RowWrapperContext)

  if (isLoading) {
    return (
      <div role="rowgroup" style={{ display: 'block' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            role="row"
            key={i}
            className="flex w-full border-b border-border"
            style={{ minHeight: rowHeight }}
          >
            {visibleLeafColumns.map((col, colIdx) => {
              const isLast = colIdx === visibleLeafColumns.length - 1
              return (
                <div
                  role="gridcell"
                  key={col.id}
                  data-col-id={col.id}
                  className={cn('flex items-center px-3 py-1', bordered && 'border-r border-border')}
                  style={{ ...colStyle(col), ...(fillLast && isLast && { flex: 1, width: 'auto' }) }}
                >
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                </div>
              )
            })}
            {showSpacer && <div role="gridcell" style={{ flex: 1, minWidth: 0, padding: 0 }} />}
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div role="rowgroup" style={{ display: 'block' }}>
        <div role="row" className="flex w-full">
          <div role="gridcell" className="flex-1 py-12 text-center text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div role="rowgroup" style={{ display: 'block' }}>
      {rows.map((row) => {
        const bodyRow = (
          <DataGridBodyRow
            row={row}
            table={table}
            onRowClick={onRowClick}
            rowCursor={rowCursor}
            bordered={bordered}
            rowHeight={rowHeight}
            showSpacer={showSpacer}
            fillLast={fillLast}
            onActionTrigger={onActionTrigger}
          />
        )
        if (RowWrapper) {
          return <RowWrapper key={row.id} row={row}>{bodyRow}</RowWrapper>
        }
        return <React.Fragment key={row.id}>{bodyRow}</React.Fragment>
      })}
    </div>
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
}: DataGridTableViewProps<T>) {
  const effectiveEstimate = estimateRowHeight ?? rowHeight ?? 33

  // ── Action menu state ──────────────────────────────────────────────────────
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [activeRow, setActiveRow] = useState<T | null>(null)
  const anchorRef = useRef<{ getBoundingClientRect: () => DOMRect } | null>(null)

  const handleActionTrigger = useCallback((row: T, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    anchorRef.current = { getBoundingClientRect: () => rect }
    setActiveRow(row)
    setActionMenuOpen(true)
  }, [])

  const headerGroups = table.getHeaderGroups()
  const visibleLeafColumns = table.getVisibleLeafColumns()

  const actionCol = visibleLeafColumns.find((col) => col.columnDef.meta?.actions != null)
  const actionItems = actionCol && activeRow ? actionCol.columnDef.meta!.actions!(activeRow) : []

  const hasFixedHeight = tableHeight != null && tableHeight !== 'auto'
  const virtual = hasFixedHeight && rows.length >= VIRTUAL_THRESHOLD

  // ── After each render, trigger column auto-measurement ─────────────────────
  useEffect(() => {
    if (!table.getState().columnSizingInfo.isResizingColumn) {
      onMeasureColumns?.()
    }
  })


  // ── Separated header/body scroll refs ──────────────────────────────────────
  // headerScrollRef: overflow:hidden panel — scrollLeft is synced from body
  // bodyScrollRef:   actual scroll container — drives virtualizer + scroll events
  // containerRef:    outer wrapper — used by useColumnSizing (clientWidth + DOM query)
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)

  const syncScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }, [])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => bodyScrollRef.current,
    estimateSize: () => effectiveEstimate,
    overscan,
    enabled: virtual,
  })

  // Body wrapper: fixed height when tableHeight is set so hscroll stays inside
  const bodyWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    ...(tableHeight && tableHeight !== 'auto'
      ? { height: tableHeight as string | number }
      : {}),
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
        style={{ position: 'relative', width: '100%', minWidth: 0, isolation: 'isolate' }}
        className="rounded-md border border-border"
      >
        {/* Header panel — overflow:hidden, scrollLeft mirrors body */}
        <div ref={headerScrollRef} style={{ overflow: 'hidden' }} className="bg-muted">
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

        {/* Body scroll container + scrollbars */}
        <div style={bodyWrapperStyle}>
          <div ref={bodyScrollRef} style={bodyStyle} onScroll={syncScroll} className="scrollbar-none">
            <ScrollTable style={{ width: innerWidth, minWidth: '100%' }}>
              {virtual ? (
                <DataGridVirtualBody
                  rows={rows}
                  table={table}
                  rowVirtualizer={rowVirtualizer}
                  onRowClick={onRowClick}
                  rowCursor={rowCursor}
                  bordered={bordered}
                  rowHeight={rowHeight}
                  onActionTrigger={actionCol ? handleActionTrigger : undefined}
                  tableWidthMode={tableWidthMode}
                />
              ) : (
                <DataGridFlexBody
                  rows={rows}
                  table={table}
                  visibleLeafColumns={visibleLeafColumns}
                  isLoading={isLoading}
                  emptyMessage={emptyMessage}
                  onRowClick={onRowClick}
                  rowCursor={rowCursor}
                  bordered={bordered}
                  rowHeight={rowHeight}
                  onActionTrigger={actionCol ? handleActionTrigger : undefined}
                  tableWidthMode={tableWidthMode}
                />
              )}
            </ScrollTable>

            {loadMoreRef && (
              <div ref={loadMoreRef} className="py-2 flex justify-center">
                {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
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
          <CustomScrollbar
            scrollRef={bodyScrollRef}
            direction="horizontal"
            style={{ height: 8 }}
          />
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
