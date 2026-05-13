import type React from 'react'
import { flexRender, type Header, type Table } from '@tanstack/react-table'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import { SortIndicator } from '@/features/sorting/SortIndicator'
import { HeaderFilterControl } from '@/features/filters/HeaderFilterControl'
import { ColumnPinControl } from '@/features/pinning/ColumnPinControl'
import { ColumnResizeHandle } from '@/features/resizing/ColumnResizeHandle'
import { colStyle } from './tableUtils'

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
        <SortIndicator header={header} />
      </span>

      <HeaderFilterControl
        header={header}
        table={table}
        enabled={enableColumnFilters}
        filterDisplay={filterDisplay}
        customFilterComponents={customFilterComponents}
      />
      <ColumnPinControl header={header} enabled={enableColumnPinning} />
      <ColumnResizeHandle header={header} enabled={enableColumnResizing} />
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

interface HeaderCellFrameProps<T extends object> extends HeaderCellContentProps<T> {
  virtual: boolean
  bordered?: boolean
  tableWidthMode?: TableWidthMode
  isLast: boolean
  edge: 'left-edge' | 'right-edge' | false
  classNames?: DataGridClassNames
  setNodeRef?: (node: HTMLElement | null) => void
  transform?: string
  transition?: string
  isDragging?: boolean
}

function HeaderCellFrame<T extends object>({
  header,
  table,
  virtual,
  bordered,
  tableWidthMode = 'spacer',
  isLast,
  edge,
  classNames,
  setNodeRef,
  transform,
  transition,
  isDragging,
  enableColumnResizing,
  enableColumnFilters,
  filterDisplay,
  enableColumnPinning,
  customFilterComponents,
  dragHandleProps,
}: HeaderCellFrameProps<T>) {
  const isFillLast = tableWidthMode === 'fill-last' && isLast
  const isLeafHeader = header.subHeaders.length === 0 && !header.isPlaceholder
  const canSort = isLeafHeader && header.column.getCanSort()

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
      style={getHeaderCellStyle({
        header,
        virtual,
        isFillLast,
        transform,
        transition,
        isDragging,
      })}
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
        dragHandleProps={dragHandleProps}
      />
    </div>
  )
}

interface DataGridHeaderCellProps<T extends object> extends HeaderCellContentProps<T> {
  virtual: boolean
  bordered?: boolean
  tableWidthMode?: TableWidthMode
  isLast: boolean
  edge: 'left-edge' | 'right-edge' | false
  classNames?: DataGridClassNames
}

export function DataGridHeaderCell<T extends object>(props: DataGridHeaderCellProps<T>) {
  return <HeaderCellFrame {...props} />
}

interface SortableDataGridHeaderCellProps<T extends object> extends DataGridHeaderCellProps<T> {
  disabled: boolean
}

export function SortableDataGridHeaderCell<T extends object>({
  disabled,
  ...props
}: SortableDataGridHeaderCellProps<T>) {
  const isResizing = !!props.table.getState().columnSizingInfo.isResizingColumn
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.header.column.id,
    disabled: disabled || isResizing,
  })

  return (
    <HeaderCellFrame
      {...props}
      setNodeRef={setNodeRef}
      transform={CSS.Transform.toString(transform)}
      transition={transition}
      isDragging={isDragging}
      dragHandleProps={!disabled ? { ...attributes, ...listeners } : undefined}
    />
  )
}
