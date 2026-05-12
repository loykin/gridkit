import type React from 'react'
import { flexRender, type Header, type HeaderGroup, type Table } from '@tanstack/react-table'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import { colStyle, isPinnedEdge } from './tableUtils'
import { HeaderFilterPopover } from '@/core/filters/HeaderFilterPopover'
import { ColumnPinPopover } from './ColumnPinPopover'

interface DataGridHeaderRowProps<T extends object>
  extends Pick<
    TableViewConfig<T>,
    | 'enableColumnResizing'
    | 'bordered'
    | 'enableColumnFilters'
    | 'filterDisplay'
    | 'enableColumnReordering'
    | 'enableColumnPinning'
    | 'customFilterComponents'
  > {
  headerGroup: HeaderGroup<T>
  table: Table<T>
  virtual: boolean
  tableWidthMode?: TableWidthMode
  classNames?: DataGridClassNames
}

// ── Inner content of a header cell (shared between plain and sortable cells) ──

interface HeaderCellContentProps<T extends object> {
  header: Header<T, unknown>
  table: Table<T>
  enableColumnResizing?: boolean
  enableColumnFilters?: boolean
  filterDisplay?: 'row' | 'icon'
  enableColumnPinning?: boolean
  customFilterComponents?: TableViewConfig<T>['customFilterComponents']
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}

function HeaderCellContent<T extends object>({
  header,
  table,
  enableColumnResizing,
  enableColumnFilters,
  filterDisplay = 'row',
  enableColumnPinning,
  customFilterComponents,
  dragHandleProps,
}: HeaderCellContentProps<T>) {
  const icons = useIcons()
  const isLeafHeader = header.subHeaders.length === 0 && !header.isPlaceholder
  const canResize = !header.isPlaceholder && enableColumnResizing && header.column.getCanResize()
  return (
    <>
      <span
        className="dg-header-cell-content"
        data-reorder-handle={dragHandleProps ? 'true' : undefined}
        {...dragHandleProps}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </span>
        {isLeafHeader && header.column.getCanSort() && (
          <span className="dg-sort-icon">
            {header.column.getIsSorted() === 'asc'
              ? icons.sortAsc
              : header.column.getIsSorted() === 'desc'
                ? icons.sortDesc
                : icons.sortNone}
          </span>
        )}
      </span>

      {isLeafHeader && enableColumnFilters && filterDisplay === 'icon' && (
        <HeaderFilterPopover
          col={header.column}
          table={table}
          customFilterComponents={customFilterComponents}
        />
      )}

      {isLeafHeader && enableColumnPinning && (
        <ColumnPinPopover col={header.column} table={table} />
      )}

      {canResize && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation()
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            header.getResizeHandler()(e)
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            header.getResizeHandler()(e)
          }}
          onClick={(e) => e.stopPropagation()}
          className="dg-resize-handle"
        >
          <div
            data-resizing={header.column.getIsResizing() ? 'true' : undefined}
            className="dg-resize-bar"
          />
        </div>
      )}
    </>
  )
}

function getAriaSort<T extends object>(header: Header<T, unknown>) {
  const sorted = header.column.getIsSorted()
  if (sorted === 'asc') return 'ascending'
  if (sorted === 'desc') return 'descending'
  return undefined
}

function getHeaderCellStyle<T extends object>({
  header,
  virtual,
  isFillLast,
  transform,
  transition,
  isDragging,
}: {
  header: Header<T, unknown>
  virtual: boolean
  isFillLast: boolean
  transform?: string
  transition?: string
  isDragging?: boolean
}): React.CSSProperties {
  const motionStyle: React.CSSProperties = {
    ...(transform && { transform }),
    ...(transition && { transition }),
    ...(isDragging !== undefined && { opacity: isDragging ? 0.5 : 1 }),
    ...(isDragging && { zIndex: 2 }),
  }

  if (virtual) {
    return {
      display: 'flex',
      alignItems: 'center',
      width: isFillLast ? undefined : header.getSize(),
      ...(isFillLast && { flex: 1, minWidth: header.getSize() }),
      ...motionStyle,
    }
  }

  return {
    ...colStyle(header.column),
    width: isFillLast ? 'auto' : header.getSize(),
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    ...(isFillLast && { flex: 1, width: 'auto' }),
    ...motionStyle,
  }
}

// ── Draggable header cell ──────────────────────────────────────────────────────

interface SortableHeaderCellProps<T extends object> extends HeaderCellContentProps<T> {
  disabled: boolean
  virtual: boolean
  bordered?: boolean
  tableWidthMode?: TableWidthMode
  isLast: boolean
  edge: 'left-edge' | 'right-edge' | false
  classNames?: DataGridClassNames
  // inherited from HeaderCellContentProps: enableColumnPinning
}

function SortableHeaderCell<T extends object>({
  header,
  table,
  disabled,
  virtual,
  bordered,
  tableWidthMode = 'spacer',
  isLast,
  edge,
  classNames,
  enableColumnResizing,
  enableColumnFilters,
  filterDisplay,
  enableColumnPinning,
  customFilterComponents,
}: SortableHeaderCellProps<T>) {
  const isFillLast = tableWidthMode === 'fill-last' && isLast
  const isLeafHeader = header.subHeaders.length === 0 && !header.isPlaceholder
  const canSort = isLeafHeader && header.column.getCanSort()
  const isResizing = !!table.getState().columnSizingInfo.isResizingColumn
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.column.id,
    disabled: disabled || isResizing,
  })

  return (
    <div
      ref={setNodeRef}
      role="columnheader"
      aria-colspan={header.colSpan > 1 ? header.colSpan : undefined}
      aria-sort={canSort ? getAriaSort(header) : undefined}
      data-col-id={isLeafHeader ? header.column.id : undefined}
      data-header-id={header.id}
      data-sortable={canSort ? 'true' : undefined}
      data-header-group={isLeafHeader ? undefined : 'true'}
      data-placeholder={header.isPlaceholder ? 'true' : undefined}
      data-pinned={edge === 'left-edge' ? 'left' : edge === 'right-edge' ? 'right' : undefined}
      data-bordered={bordered ? 'true' : undefined}
      className={cn('dg-header-cell', classNames?.headerCell)}
      style={{
        ...getHeaderCellStyle({
          header,
          virtual,
          isFillLast,
          transform: CSS.Transform.toString(transform),
          transition,
          isDragging,
        }),
      }}
      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
    >
      <HeaderCellContent
        header={header}
        table={table}
        enableColumnResizing={enableColumnResizing}
        enableColumnFilters={enableColumnFilters}
        filterDisplay={filterDisplay}
        enableColumnPinning={enableColumnPinning}
        customFilterComponents={customFilterComponents}
        dragHandleProps={
          !disabled
            ? {
                ...attributes,
                ...listeners,
              }
            : undefined
        }
      />
    </div>
  )
}

// ── DataGridHeaderRow ─────────────────────────────────────────────────────────

export function DataGridHeaderRow<T extends object>({
  headerGroup,
  table,
  enableColumnResizing,
  virtual,
  bordered,
  tableWidthMode = 'spacer',
  enableColumnFilters,
  filterDisplay = 'row',
  enableColumnReordering = false,
  enableColumnPinning = false,
  customFilterComponents,
  classNames,
}: DataGridHeaderRowProps<T>) {
  const headers = headerGroup.headers
  const isLeafHeaderRow = headers.every((header) => header.subHeaders.length === 0)

  // ── Drag sensors: pointer with 5px activation to preserve sort-clicks ────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    if (table.getState().columnSizingInfo.isResizingColumn) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const allColIds = table.getAllLeafColumns().map((col) => col.id)
    const oldIndex = allColIds.indexOf(String(active.id))
    const newIndex = allColIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    table.setColumnOrder(arrayMove(allColIds, oldIndex, newIndex))
  }

  const columnIds = headers.map((h) => h.column.id)

  if (enableColumnReordering && isLeafHeaderRow) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          <div
            role="row"
            className={cn('dg-header-row')}
            style={{ width: '100%', height: '36px' }}
          >
            {headers.map((header, idx) => {
              const edge = isPinnedEdge(header.column, table)
              const isLast = idx === headers.length - 1
              const isPinned = !!header.column.getIsPinned()
              return (
                <SortableHeaderCell
                  key={header.id}
                  header={header}
                  table={table}
                  disabled={isPinned}
                  virtual={virtual}
                  bordered={bordered}
                  tableWidthMode={tableWidthMode}
                  isLast={isLast}
                  edge={edge}
                  classNames={classNames}
                  enableColumnResizing={enableColumnResizing}
                  enableColumnFilters={enableColumnFilters}
                  filterDisplay={filterDisplay}
                  enableColumnPinning={enableColumnPinning}
                  customFilterComponents={customFilterComponents}
                />
              )
            })}
            {!virtual && tableWidthMode === 'spacer' && (
              <div
                role="columnheader"
                style={{ flex: 1, minWidth: 0, padding: 0 }}
              />
            )}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  // ── Default: no reordering ────────────────────────────────────────────────
  return (
    <div
      role="row"
      className={cn('dg-header-row')}
      style={{ width: '100%', height: '36px' }}
    >
      {headers.map((header, idx) => {
        const edge = isPinnedEdge(header.column, table)
        const isLast = idx === headers.length - 1
        const isFillLast = tableWidthMode === 'fill-last' && isLast
        const isLeafHeader = header.subHeaders.length === 0 && !header.isPlaceholder
        const canSort = isLeafHeader && header.column.getCanSort()
        return (
          <div
            role="columnheader"
            key={header.id}
            aria-colspan={header.colSpan > 1 ? header.colSpan : undefined}
            aria-sort={canSort ? getAriaSort(header) : undefined}
            data-col-id={isLeafHeader ? header.column.id : undefined}
            data-header-id={header.id}
            data-sortable={canSort ? 'true' : undefined}
            data-header-group={isLeafHeader ? undefined : 'true'}
            data-placeholder={header.isPlaceholder ? 'true' : undefined}
            data-pinned={edge === 'left-edge' ? 'left' : edge === 'right-edge' ? 'right' : undefined}
            data-bordered={bordered ? 'true' : undefined}
            className={cn(
              'dg-header-cell',
              classNames?.headerCell,
            )}
            style={getHeaderCellStyle({ header, virtual, isFillLast })}
            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
          >
            <HeaderCellContent
              header={header}
              table={table}
              enableColumnResizing={enableColumnResizing}
              enableColumnFilters={enableColumnFilters}
              filterDisplay={filterDisplay}
              enableColumnPinning={enableColumnPinning}
              customFilterComponents={customFilterComponents}
            />
          </div>
        )
      })}
      {!virtual && tableWidthMode === 'spacer' && (
        <div
          role="columnheader"
          style={{ flex: 1, minWidth: 0, padding: 0 }}
        />
      )}
    </div>
  )
}
