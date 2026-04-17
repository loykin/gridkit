import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { DataGridDragProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { DataGridShell } from '@/core/DataGridShell'
import { RowWrapperContext } from '@/features/reordering/RowWrapperContext'
import { SortableRow } from '@/features/reordering/SortableRow'

export function DataGridDrag<T extends object>(props: DataGridDragProps<T>) {
  const { data = [], onRowReorder, getRowId } = props

  const { wrapperRef, containerRef, table, rows, isSized, measure } = useDataGridBase({
    ...props,
    // Sorting changes visual order — incompatible with manual row reordering
    enableSorting: false,
    // Pagination splits data — reorder applies within the loaded set only
    enablePagination: false,
    getRowId,
  })

  const [activeRowId, setActiveRowId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a small move before drag starts — prevents click from triggering drag
      activationConstraint: { distance: 5 },
    }),
  )

  const rowIds = rows.map((r) => r.id)

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveRowId(String(active.id))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveRowId(null)
    if (!over || active.id === over.id) return

    const activeRow = rows.find((r) => r.id === String(active.id))
    const overRow = rows.find((r) => r.id === String(over.id))
    if (!activeRow || !overRow) return

    const fromIdx = data.indexOf(activeRow.original)
    const toIdx = data.indexOf(overRow.original)
    if (fromIdx === -1 || toIdx === -1) return

    onRowReorder(arrayMove(data, fromIdx, toIdx))
  }

  const activeRow = activeRowId ? rows.find((r) => r.id === activeRowId) : null

  return (
    <RowWrapperContext.Provider value={SortableRow}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          <DataGridShell
            {...props}
            wrapperRef={wrapperRef}
            containerRef={containerRef}
            table={table}
            rows={rows}
            isSized={isSized}
            measure={measure}
            footer={null}
          />
        </SortableContext>

        {/* Portal overlay — renders outside scroll container so it's never clipped */}
        <DragOverlay>
          {activeRow && (
            <div
              className="rounded border border-[var(--dg-primary)]/40 bg-[var(--dg-primary)]/5 shadow-xl ring-1 ring-primary/20"
              style={{ height: props.rowHeight ?? 36 }}
            />
          )}
        </DragOverlay>
      </DndContext>
    </RowWrapperContext.Provider>
  )
}
