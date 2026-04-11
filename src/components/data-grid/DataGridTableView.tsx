import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  type Row,
  type Table,
  type Column,
  type HeaderGroup,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, MoreHorizontal, SlidersHorizontal, X } from 'lucide-react'
import type { Virtualizer } from '@tanstack/react-virtual'
import { Menu as ActionMenu } from '@base-ui/react/menu'
import { cn } from '@/lib/utils'
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ScrollTable } from './ScrollTable'
import type { TableViewConfig, TableWidthMode } from './types'
import { VIRTUAL_THRESHOLD } from './hooks/useColumnSizing'

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
  extends Pick<TableViewConfig<T>, 'enableColumnResizing' | 'bordered'> {
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
}: DataGridHeaderRowProps<T>) {
  const headers = headerGroup.headers
  return (
    <TableRow
      className="hover:bg-transparent"
      style={{ display: 'flex', width: '100%', height: '36px' }}
    >
      {headers.map((header, idx) => {
        const edge = isPinnedEdge(header.column, table)
        const isLast = idx === headers.length - 1
        const isFillLast = tableWidthMode === 'fill-last' && isLast
        return (
        <TableHead
          key={header.id}
          colSpan={header.colSpan}
          // data-col-id: used by useColumnSizing DOM measurement
          data-col-id={header.column.id}
          className={cn(
            'relative px-3 text-xs font-medium h-9 bg-muted',
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
          <span className="flex items-center gap-1 min-w-0 overflow-hidden">
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
        </TableHead>
        )
      })}
      {!virtual && tableWidthMode === 'spacer' && <TableHead style={{ flex: 1, minWidth: 0, padding: 0 }} className="bg-muted" />}
    </TableRow>
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
// DataGridFilterRow
// ─────────────────────────────────────────────────────────────────────────────

interface DataGridFilterRowProps<T extends object>
  extends Pick<TableViewConfig<T>, 'bordered'> {
  visibleLeafColumns: Column<T>[]
  selectOptions: Record<string, string[]>
  virtual: boolean
  tableWidthMode?: TableWidthMode
}

function DataGridFilterRow<T extends object>({
  visibleLeafColumns,
  selectOptions,
  virtual,
  bordered,
  tableWidthMode = 'spacer',
}: DataGridFilterRowProps<T>) {
  return (
    <TableRow
      className="border-b bg-muted hover:bg-muted"
      style={{ display: 'flex', width: '100%', height: '36px' }}
    >
      {visibleLeafColumns.map((col) => {
        const ft = col.columnDef.meta?.filterType
        const filterValue = (col.getFilterValue() ?? '') as string
        const thStyle: React.CSSProperties = virtual
          ? { display: 'flex', alignItems: 'center', width: col.getSize() }
          : { ...colStyle(col), display: 'flex', alignItems: 'center' }

        const selectItems = ft === 'select'
          ? [{ label: 'All', value: null }, ...(selectOptions[col.id] ?? []).map((v) => ({ label: v, value: v }))]
          : []

        if (ft === false) {
          return <TableHead key={col.id} className={cn('px-2 py-1 h-auto', bordered && 'border-r border-border')} style={thStyle} />
        }

        return (
          <TableHead key={col.id} className={cn('px-2 py-1 h-auto font-normal', bordered && 'border-r border-border')} style={thStyle}>
            {ft === 'select' ? (
              <Select
                items={selectItems}
                value={filterValue || null}
                onValueChange={(val) => col.setFilterValue(val ?? undefined)}
              >
                <SelectTrigger size="sm" className="h-7 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectItems.map((item) => (
                    <SelectItem key={item.value ?? '__all__'} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : ft === 'number' ? (
              <NumberFilterPopover col={col} />
            ) : (
              <div className="relative">
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
          </TableHead>
        )
      })}
      {!virtual && tableWidthMode === 'spacer' && <TableHead style={{ flex: 1, minWidth: 0, padding: 0 }} />}
    </TableRow>
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
  bordered?: boolean
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
  onActionTrigger,
}: DataGridBodyRowProps<T>) {
  const visibleCells = row.getVisibleCells()
  return (
    <TableRow
      data-index={dataIndex}
      ref={measureRef}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      className={cn(
        'flex w-full',
        onRowClick || rowCursor ? 'cursor-pointer' : 'hover:bg-muted/30',
      )}
      style={style}
    >
      {visibleCells.map((cell, idx) => {
        const meta = cell.column.columnDef.meta
        const edge = isPinnedEdge(cell.column, table)
        const isLast = idx === visibleCells.length - 1
        const isFillCell = fillLast && isLast
        return (
          <TableCell
            key={cell.id}
            // data-col-id: used by useColumnSizing DOM measurement
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
          </TableCell>
        )
      })}
      {showSpacer && <TableCell style={{ flex: 1, minWidth: 0, padding: 0 }} className="bg-background" />}
    </TableRow>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataGridVirtualBody
// ─────────────────────────────────────────────────────────────────────────────

interface DataGridVirtualBodyProps<T extends object>
  extends Pick<TableViewConfig<T>, 'onRowClick' | 'rowCursor' | 'bordered'> {
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
  onActionTrigger,
  tableWidthMode = 'spacer',
}: DataGridVirtualBodyProps<T>) {
  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  return (
    <TableBody style={{ display: 'grid', height: totalSize, position: 'relative' }}>
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
            dataIndex={virtualRow.index}
            measureRef={rowVirtualizer.measureElement}
            style={{ position: 'absolute', width: '100%', transform: `translateY(${virtualRow.start}px)` }}
            onActionTrigger={onActionTrigger}
            fillLast={tableWidthMode === 'fill-last'}
          />
        )
      })}
    </TableBody>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataGridFlexBody
// ─────────────────────────────────────────────────────────────────────────────

interface DataGridFlexBodyProps<T extends object>
  extends Pick<TableViewConfig<T>, 'isLoading' | 'emptyMessage' | 'onRowClick' | 'rowCursor' | 'bordered'> {
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
  onActionTrigger,
  tableWidthMode = 'spacer',
}: DataGridFlexBodyProps<T>) {
  const showSpacer = tableWidthMode === 'spacer'
  const fillLast = tableWidthMode === 'fill-last'

  if (isLoading) {
    return (
      <TableBody style={{ display: 'block' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i} className="flex w-full">
            {visibleLeafColumns.map((col, colIdx) => {
              const isLast = colIdx === visibleLeafColumns.length - 1
              return (
                <TableCell key={col.id} data-col-id={col.id} className={cn('flex items-center px-3 py-1', bordered && 'border-r border-border')} style={{ ...colStyle(col), ...(fillLast && isLast && { flex: 1, width: 'auto' }) }}>
                  <div className="h-4 animate-pulse rounded bg-muted" />
                </TableCell>
              )
            })}
            {showSpacer && <TableCell style={{ flex: 1, minWidth: 0, padding: 0 }} />}
          </TableRow>
        ))}
      </TableBody>
    )
  }

  if (rows.length === 0) {
    return (
      <TableBody style={{ display: 'block' }}>
        <TableRow className="flex w-full hover:bg-transparent">
          <TableCell className="flex-1 py-12 text-center text-muted-foreground">
            {emptyMessage}
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  return (
    <TableBody style={{ display: 'block' }}>
      {rows.map((row) => (
        <DataGridBodyRow
          key={row.id}
          row={row}
          table={table}
          onRowClick={onRowClick}
          rowCursor={rowCursor}
          bordered={bordered}
          showSpacer={showSpacer}
          fillLast={fillLast}
          onActionTrigger={onActionTrigger}
        />
      ))}
    </TableBody>
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
  tableHeight,
  tableWidthMode = 'spacer',
  estimateRowHeight = 33,
  overscan = 10,
  loadMoreRef,
  isFetchingNextPage,
  bordered = false,
  onMeasureColumns,
}: DataGridTableViewProps<T>) {
  // ── Action menu state — ONE menu at table level, anchored to the clicked trigger ─
  // Snapshot rect at click time (VirtualElement) so the anchor remains valid even
  // after the virtualizer unmounts the trigger row's DOM node.
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

  // Find the column that has meta.actions (if any) — used to build the shared action menu
  const actionCol = visibleLeafColumns.find((col) => col.columnDef.meta?.actions != null)
  const actionItems = actionCol && activeRow ? actionCol.columnDef.meta!.actions!(activeRow) : []

  const hasFixedHeight = tableHeight != null && tableHeight !== 'auto'

  // Virtualizer auto-enables when the table has a fixed height and rows exceed
  // the threshold. This is an internal optimization — callers don't control it.
  const virtual = hasFixedHeight && rows.length >= VIRTUAL_THRESHOLD

  // ── After each render, trigger column auto-measurement ─────────────────
  // Skip while a column is being resized: forced layout reads (scrollWidth)
  // during pointer drag cause jank. Measurement resumes on the next render
  // after the drag ends.
  useEffect(() => {
    if (!table.getState().columnSizingInfo.isResizingColumn) {
      onMeasureColumns?.()
    }
  })

  const selectOptions = useMemo(() => {
    if (!enableColumnFilters) return {}
    const map: Record<string, string[]> = {}
    for (const col of visibleLeafColumns) {
      if (col.columnDef.meta?.filterType !== 'select') continue
      const vals = new Set<string>()
      table.getCoreRowModel().rows.forEach((row) => {
        const v = row.getValue(col.id)
        if (v != null) vals.add(String(v))
      })
      map[col.id] = Array.from(vals).sort()
    }
    return map
  }, [enableColumnFilters, visibleLeafColumns, table])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
    enabled: virtual,
  })

  const containerStyle: React.CSSProperties = {
    overflow: 'auto',
    position: 'relative',
    width: '100%',
    minWidth: 0,
    isolation: 'isolate',
    ...(virtual
      ? { height: tableHeight as string | number }
      : tableHeight && tableHeight !== 'auto'
      ? { maxHeight: tableHeight }
      : {}),
  }

  return (
    <>
      <div ref={containerRef} style={containerStyle} className="dg-scroll rounded-md">
        <ScrollTable
          style={
            virtual
              ? { display: 'grid', width: table.getTotalSize(), minWidth: '100%' }
              : { display: 'block', width: table.getTotalSize(), minWidth: '100%' }
          }
        >
          <TableHeader
            className="sticky top-0 z-10 bg-muted [&_tr]:border-b"
            style={{ display: 'block', transform: 'translateZ(0)', willChange: 'transform' }}
          >
            {headerGroups.map((headerGroup) => (
              <DataGridHeaderRow
                key={headerGroup.id}
                headerGroup={headerGroup}
                table={table}
                enableColumnResizing={enableColumnResizing}
                virtual={virtual}
                bordered={bordered}
                tableWidthMode={tableWidthMode}
              />
            ))}
            {enableColumnFilters && (
              <DataGridFilterRow
                visibleLeafColumns={visibleLeafColumns}
                selectOptions={selectOptions}
                virtual={virtual}
                bordered={bordered}
                tableWidthMode={tableWidthMode}
              />
            )}
          </TableHeader>

          {virtual ? (
            <DataGridVirtualBody
              rows={rows}
              table={table}
              rowVirtualizer={rowVirtualizer}
              onRowClick={onRowClick}
              rowCursor={rowCursor}
              bordered={bordered}
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
