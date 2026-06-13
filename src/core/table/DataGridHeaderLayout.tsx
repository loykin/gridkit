import type { Column, HeaderGroup, Table } from '@tanstack/react-table'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import type { DataGridClassNames, HeaderGroupLayout, TableViewConfig, TableWidthMode } from '@/types'
import { buildHeaderLayoutPlan } from './buildHeaderLayoutPlan'
import { isPinnedEdge } from './tableUtils'
import { DataGridHeaderCellFrame, SortableDataGridHeaderCell } from './DataGridHeaderCell'

interface DataGridHeaderLayoutProps<T extends object>
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
  headerGroups: HeaderGroup<T>[]
  table: Table<T>
  visibleLeafColumns?: Column<T>[]
  virtual: boolean
  tableWidthMode?: TableWidthMode
  headerGroupLayout?: HeaderGroupLayout
  classNames?: DataGridClassNames
}

const HEADER_ROW_HEIGHT = 36

export function DataGridHeaderLayout<T extends object>({
  headerGroups,
  table,
  visibleLeafColumns: visibleLeafColumnsProp,
  enableColumnResizing,
  virtual,
  bordered,
  tableWidthMode = 'spacer',
  headerGroupLayout = 'padded',
  enableColumnFilters,
  filterDisplay = 'row',
  enableColumnReordering = false,
  enableColumnPinning = false,
  enableColumnMenu = false,
  renderColumnMenu,
  customFilterComponents,
  classNames,
}: DataGridHeaderLayoutProps<T>) {
  const visibleLeafColumns = visibleLeafColumnsProp ?? table.getVisibleLeafColumns()
  const plan = buildHeaderLayoutPlan({
    headerGroups,
    visibleLeafColumns,
    layout: headerGroupLayout,
    rowHeight: HEADER_ROW_HEIGHT,
  })

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

  const renderedCells = plan.cells.filter((cell) => cell.render)
  const sortableItems = visibleLeafColumns.map((column) => column.id)

  const content = (
    <div
      role="row"
      className={cn('gridkit-header-row', 'gridkit-header-layout')}
      data-header-group-layout={headerGroupLayout}
      style={{
        position: 'relative',
        width: plan.width,
        minWidth: '100%',
        height: plan.height,
      }}
    >
      {renderedCells.map((cell) => {
        const edge = isPinnedEdge(cell.header.column, table)
        const isLast = visibleLeafColumns[visibleLeafColumns.length - 1]?.id === cell.header.column.id
        const isPinned = !!cell.header.column.getIsPinned()
        const commonProps = {
          header: cell.header,
          table,
          layoutCell: cell,
          virtual,
          bordered,
          tableWidthMode,
          isLast,
          edge,
          classNames,
          enableColumnResizing,
          enableColumnFilters,
          filterDisplay,
          enableColumnPinning,
          enableColumnMenu,
          renderColumnMenu,
          customFilterComponents,
        }

        if (enableColumnReordering && cell.isLeafHeader && !cell.isPlaceholder) {
          return (
            <SortableDataGridHeaderCell
              key={cell.id}
              {...commonProps}
              disabled={isPinned}
            />
          )
        }

        return (
          <DataGridHeaderCellFrame
            key={cell.id}
            {...commonProps}
          />
        )
      })}
    </div>
  )

  if (!enableColumnReordering) return content

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortableItems} strategy={horizontalListSortingStrategy}>
        {content}
      </SortableContext>
    </DndContext>
  )
}
