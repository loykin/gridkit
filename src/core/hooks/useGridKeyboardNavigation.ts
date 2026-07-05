import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import type { Row, Table } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'

export interface GridFocusCell {
  rowIndex: number
  colIndex: number
}

interface UseGridKeyboardNavigationOptions<T extends object> {
  enabled?: boolean
  rows: Row<T>[]
  table: Table<T>
  containerRef: React.RefObject<HTMLDivElement | null>
  rowVirtualizer?: Virtualizer<HTMLDivElement, Element>
  editingCellId: string | null
  startEdit: (cellId: string) => void
  stopEdit: () => void
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)
}

export function useGridKeyboardNavigation<T extends object>({
  enabled = true,
  rows,
  table,
  containerRef,
  rowVirtualizer,
  editingCellId,
  startEdit,
  stopEdit,
}: UseGridKeyboardNavigationOptions<T>) {
  const visibleLeafColumns = table.getVisibleLeafColumns()
  const maxRowIndex = Math.max(rows.length - 1, 0)
  const maxColIndex = Math.max(visibleLeafColumns.length - 1, 0)
  const [focusedCell, setFocusedCell] = useState<GridFocusCell>({ rowIndex: 0, colIndex: 0 })
  const pendingFocusRef = useRef<GridFocusCell | null>(null)

  const columnIndexById = useMemo(() => {
    const map = new Map<string, number>()
    visibleLeafColumns.forEach((column, index) => map.set(column.id, index))
    return map
  }, [visibleLeafColumns])

  const clampCell = useCallback((cell: GridFocusCell): GridFocusCell => ({
    rowIndex: Math.min(Math.max(cell.rowIndex, 0), maxRowIndex),
    colIndex: Math.min(Math.max(cell.colIndex, 0), maxColIndex),
  }), [maxColIndex, maxRowIndex])

  const focusCellElement = useCallback((cell: GridFocusCell) => {
    const container = containerRef.current
    if (!container) return false
    const selector = `[data-gridkit-cell="true"][data-row-index="${cell.rowIndex}"][data-col-index="${cell.colIndex}"]`
    const el = container.querySelector<HTMLElement>(selector)
    if (!el) return false
    el.focus({ preventScroll: true })
    return true
  }, [containerRef])

  const moveFocus = useCallback((nextCell: GridFocusCell) => {
    const next = clampCell(nextCell)
    setFocusedCell(next)
    pendingFocusRef.current = next
    rowVirtualizer?.scrollToIndex(next.rowIndex, { align: 'auto' })

    requestAnimationFrame(() => {
      if (pendingFocusRef.current === next && focusCellElement(next)) {
        pendingFocusRef.current = null
      }
    })
  }, [clampCell, focusCellElement, rowVirtualizer])

  useEffect(() => {
    const pending = pendingFocusRef.current
    if (pending && focusCellElement(pending)) {
      pendingFocusRef.current = null
    }
  })

  useEffect(() => {
    setFocusedCell((current) => clampCell(current))
  }, [clampCell])

  const handleCellKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>, cell: GridFocusCell) => {
    if (!enabled) return
    if (isEditableTarget(event.target)) return

    if (editingCellId) {
      if (event.key === 'Escape') {
        event.preventDefault()
        stopEdit()
      }
      return
    }

    let next: GridFocusCell | null = null
    if (event.key === 'ArrowRight') next = { ...cell, colIndex: cell.colIndex + 1 }
    else if (event.key === 'ArrowLeft') next = { ...cell, colIndex: cell.colIndex - 1 }
    else if (event.key === 'ArrowDown') next = { ...cell, rowIndex: cell.rowIndex + 1 }
    else if (event.key === 'ArrowUp') next = { ...cell, rowIndex: cell.rowIndex - 1 }
    else if (event.key === 'Home') next = { ...cell, colIndex: 0 }
    else if (event.key === 'End') next = { ...cell, colIndex: maxColIndex }
    else if (event.key === 'PageDown') next = { ...cell, rowIndex: cell.rowIndex + 10 }
    else if (event.key === 'PageUp') next = { ...cell, rowIndex: cell.rowIndex - 10 }

    if (next) {
      event.preventDefault()
      moveFocus(next)
      return
    }

    if (event.key === 'Enter') {
      const row = rows[cell.rowIndex]
      const column = visibleLeafColumns[cell.colIndex]
      const targetCell = row && column ? row.getAllCells().find((item) => item.column.id === column.id) : undefined
      if (targetCell?.column.columnDef.meta?.editCell) {
        event.preventDefault()
        startEdit(targetCell.id)
      }
      return
    }

    if (event.key === ' ') {
      const container = containerRef.current
      const selector = `[data-gridkit-cell="true"][data-row-index="${cell.rowIndex}"][data-col-id="__select__"] input[type="checkbox"]`
      const checkbox = container?.querySelector<HTMLInputElement>(selector)
      if (checkbox) {
        event.preventDefault()
        checkbox.click()
      }
    }
  }, [containerRef, editingCellId, enabled, maxColIndex, moveFocus, rows, startEdit, stopEdit, visibleLeafColumns])

  return {
    focusedCell: enabled ? focusedCell : undefined,
    columnIndexById: enabled ? columnIndexById : undefined,
    handleCellKeyDown: enabled ? handleCellKeyDown : undefined,
  }
}
