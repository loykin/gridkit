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

interface DataGridHeaderRowProps<T extends object>
  extends Pick<
    TableViewConfig<T>,
    | 'enableColumnResizing'
    | 'bordered'
    | 'enableColumnFilters'
    | 'filterDisplay'
    | 'enableColumnReordering'
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
}

function HeaderCellContent<T extends object>({
  header,
  table,
  enableColumnResizing,
  enableColumnFilters,
  filterDisplay = 'row',
}: HeaderCellContentProps<T>) {
  const icons = useIcons()
  return (
    <>
      <span className="dg-header-cell-content">
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </span>
        {header.column.getCanSort() && (
          <span className="dg-sort-icon">
            {header.column.getIsSorted() === 'asc'
              ? icons.sortAsc
              : header.column.getIsSorted() === 'desc'
                ? icons.sortDesc
                : icons.sortNone}
          </span>
        )}
      </span>

      {enableColumnFilters && filterDisplay === 'icon' && (
        <HeaderFilterPopover col={header.column} table={table} />
      )}

      {enableColumnResizing && header.column.getCanResize() && (
        <div
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

// ── Draggable header cell ──────────────────────────────────────────────────────

interface SortableHeaderCellProps<T extends object> extends HeaderCellContentProps<T> {
  disabled: boolean
  virtual: boolean
  bordered?: boolean
  tableWidthMode?: TableWidthMode
  isLast: boolean
  edge: 'left-edge' | 'right-edge' | false
  classNames?: DataGridClassNames
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
}: SortableHeaderCellProps<T>) {
  const isFillLast = tableWidthMode === 'fill-last' && isLast
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.column.id,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      role="columnheader"
      data-col-id={header.column.id}
      data-sortable={header.column.getCanSort() ? 'true' : undefined}
      data-pinned={edge === 'left-edge' ? 'left' : edge === 'right-edge' ? 'right' : undefined}
      data-bordered={bordered ? 'true' : undefined}
      className={cn('dg-header-cell', classNames?.headerCell)}
      style={
        virtual
          ? {
              display: 'flex',
              alignItems: 'center',
              width: isFillLast ? undefined : header.getSize(),
              ...(isFillLast && { flex: 1, minWidth: header.getSize() }),
              transform: CSS.Transform.toString(transform),
              transition,
              opacity: isDragging ? 0.5 : 1,
              cursor: disabled ? undefined : 'grab',
              zIndex: isDragging ? 1 : undefined,
            }
          : {
              ...colStyle(header.column),
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              ...(isFillLast && { flex: 1, width: 'auto' }),
              transform: CSS.Transform.toString(transform),
              transition,
              opacity: isDragging ? 0.5 : 1,
              cursor: disabled ? undefined : 'grab',
              zIndex: isDragging ? 2 : undefined,
            }
      }
      onClick={
        header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined
      }
      {...(!disabled ? listeners : {})}
      {...(!disabled ? attributes : {})}
    >
      <HeaderCellContent
        header={header}
        table={table}
        enableColumnResizing={enableColumnResizing}
        enableColumnFilters={enableColumnFilters}
        filterDisplay={filterDisplay}
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
  classNames,
}: DataGridHeaderRowProps<T>) {
  const headers = headerGroup.headers

  // ── Drag sensors: pointer with 5px activation to preserve sort-clicks ────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const allColIds = table.getAllLeafColumns().map((col) => col.id)
    const oldIndex = allColIds.indexOf(String(active.id))
    const newIndex = allColIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    table.setColumnOrder(arrayMove(allColIds, oldIndex, newIndex))
  }

  const columnIds = headers.map((h) => h.column.id)

  if (enableColumnReordering) {
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
        return (
          <div
            role="columnheader"
            key={header.id}
            data-col-id={header.column.id}
            data-sortable={header.column.getCanSort() ? 'true' : undefined}
            data-pinned={edge === 'left-edge' ? 'left' : edge === 'right-edge' ? 'right' : undefined}
            data-bordered={bordered ? 'true' : undefined}
            className={cn(
              'dg-header-cell',
              classNames?.headerCell,
            )}
            style={
              virtual
                ? {
                    display: 'flex',
                    alignItems: 'center',
                    width: isFillLast ? undefined : header.getSize(),
                    ...(isFillLast && { flex: 1, minWidth: header.getSize() }),
                  }
                : {
                    ...colStyle(header.column),
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    ...(isFillLast && { flex: 1, width: 'auto' }),
                  }
            }
            onClick={
              header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined
            }
          >
            <HeaderCellContent
              header={header}
              table={table}
              enableColumnResizing={enableColumnResizing}
              enableColumnFilters={enableColumnFilters}
              filterDisplay={filterDisplay}
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
