import { type HeaderGroup, type Table } from '@tanstack/react-table'
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
  arrayMove,
} from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import { isPinnedEdge } from './tableUtils'
import { DataGridHeaderCell, SortableDataGridHeaderCell } from './DataGridHeaderCell'

interface DataGridHeaderRowProps<T extends object>
  extends Pick<
    TableViewConfig<T>,
    | 'enableColumnResizing'
    | 'bordered'
    | 'enableColumnFilters'
    | 'filterDisplay'
    | 'enableColumnReordering'
    | 'enableColumnPinning'
    | 'enableColumnMenu'
    | 'renderColumnMenu'
    | 'customFilterComponents'
  > {
  headerGroup: HeaderGroup<T>
  table: Table<T>
  virtual: boolean
  tableWidthMode?: TableWidthMode
  classNames?: DataGridClassNames
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
  enableColumnMenu = false,
  renderColumnMenu,
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
                <SortableDataGridHeaderCell
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
                  enableColumnMenu={enableColumnMenu}
                  renderColumnMenu={renderColumnMenu}
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
        return (
          <DataGridHeaderCell
            key={header.id}
            header={header}
            table={table}
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
            enableColumnMenu={enableColumnMenu}
            renderColumnMenu={renderColumnMenu}
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
  )
}
