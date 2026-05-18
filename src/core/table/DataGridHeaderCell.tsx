import type React from 'react'
import { flexRender, type Header, type Table } from '@tanstack/react-table'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import type { HeaderLayoutCell } from './buildHeaderLayoutPlan'
import { SortIndicator } from '@/features/sorting/SortIndicator'
import { HeaderFilterControl } from '@/features/filters/components/HeaderFilterControl'
import { ColumnPinControl } from '@/features/pinning/ColumnPinControl'
import { ColumnMenuButton } from '@/features/menu/ColumnMenuButton'
import { ColumnResizeHandle } from '@/features/resizing/ColumnResizeHandle'
import { colStyle } from './tableUtils'

interface HeaderCellContentProps<T extends object> {
  header: Header<T, unknown>
  table: Table<T>
  enableColumnResizing?: boolean
  enableColumnFilters?: boolean
  filterDisplay?: 'row' | 'icon'
  enableColumnPinning?: boolean
  enableColumnMenu?: boolean
  renderColumnMenu?: TableViewConfig<T>['renderColumnMenu']
  customFilterComponents?: TableViewConfig<T>['customFilterComponents']
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}

export function DataGridHeaderCellContent<T extends object>({
  header,
  table,
  enableColumnResizing,
  enableColumnFilters,
  filterDisplay = 'row',
  enableColumnPinning,
  enableColumnMenu,
  renderColumnMenu,
  customFilterComponents,
  dragHandleProps,
}: HeaderCellContentProps<T>) {
  const isLeafHeader = header.subHeaders.length === 0 && !header.isPlaceholder
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

      {enableColumnMenu && isLeafHeader ? (
        <ColumnMenuButton
          col={header.column}
          table={table}
          enableColumnFilters={enableColumnFilters}
          enableColumnPinning={enableColumnPinning}
          customFilterComponents={customFilterComponents}
          renderColumnMenu={renderColumnMenu}
        />
      ) : (
        <>
          <HeaderFilterControl
            header={header}
            table={table}
            enabled={enableColumnFilters}
            filterDisplay={filterDisplay}
            customFilterComponents={customFilterComponents}
          />
          <ColumnPinControl header={header} enabled={enableColumnPinning} />
        </>
      )}
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
  layoutCell,
  virtual,
  isFillLast,
  transform,
  transition,
  isDragging,
}: {
  header: Header<T, unknown>
  layoutCell?: HeaderLayoutCell<T>
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

  if (layoutCell) {
    return {
      position: 'absolute',
      top: layoutCell.top,
      left: layoutCell.pin === 'right' ? undefined : layoutCell.left,
      right: layoutCell.pin === 'right' ? layoutCell.right : undefined,
      width: layoutCell.width,
      height: layoutCell.height,
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      zIndex: layoutCell.zIndex,
      ...motionStyle,
    }
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

export interface HeaderCellFrameProps<T extends object> extends HeaderCellContentProps<T> {
  virtual: boolean
  layoutCell?: HeaderLayoutCell<T>
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


export function DataGridHeaderCellFrame<T extends object>({
  header,
  table,
  virtual,
  layoutCell,
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
  enableColumnMenu,
  renderColumnMenu,
  customFilterComponents,
  dragHandleProps,
}: HeaderCellFrameProps<T>) {
  const isFillLast = tableWidthMode === 'fill-last' && isLast
  const isLeafHeader = layoutCell?.isLeafHeader ?? (header.subHeaders.length === 0 && !header.isPlaceholder)
  const canSort = isLeafHeader && header.column.getCanSort()
  const colSpan = layoutCell?.colSpan ?? header.colSpan
  const rowSpan = layoutCell?.rowSpan ?? 1
  const isPlaceholder = layoutCell?.isPlaceholder ?? header.isPlaceholder
  const pin = layoutCell?.pin ?? (edge === 'left-edge' ? 'left' : edge === 'right-edge' ? 'right' : false)

  return (
    <div
      ref={setNodeRef}
      role="columnheader"
      aria-colspan={colSpan > 1 ? colSpan : undefined}
      aria-rowspan={rowSpan > 1 ? rowSpan : undefined}
      aria-sort={canSort ? getAriaSort(header) : undefined}
      aria-hidden={isPlaceholder ? 'true' : undefined}
      data-col-id={isLeafHeader ? header.column.id : undefined}
      data-header-id={header.id}
      data-sortable={canSort && !enableColumnMenu ? 'true' : undefined}
      data-header-group={isLeafHeader ? undefined : 'true'}
      data-placeholder={isPlaceholder ? 'true' : undefined}
      data-pinned={pin || undefined}
      data-bordered={bordered ? 'true' : undefined}
      className={cn('dg-header-cell', classNames?.headerCell)}
      style={getHeaderCellStyle({
        header,
        layoutCell,
        virtual,
        isFillLast,
        transform,
        transition,
        isDragging,
      })}
      onClick={canSort && !enableColumnMenu ? header.column.getToggleSortingHandler() : undefined}
    >
      <DataGridHeaderCellContent
        header={header}
        table={table}
        enableColumnResizing={enableColumnResizing}
        enableColumnFilters={enableColumnFilters}
        filterDisplay={filterDisplay}
        enableColumnPinning={enableColumnPinning}
        enableColumnMenu={enableColumnMenu}
        renderColumnMenu={renderColumnMenu}
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
  return <DataGridHeaderCellFrame {...props} />
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
    <DataGridHeaderCellFrame
      {...props}
      setNodeRef={setNodeRef}
      transform={CSS.Transform.toString(transform)}
      transition={transition}
      isDragging={isDragging}
      dragHandleProps={!disabled ? { ...attributes, ...listeners } : undefined}
    />
  )
}
