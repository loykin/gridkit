import { useEffect, useRef } from 'react'
import type { ColumnDef, Row, Table } from '@tanstack/react-table'
import type { CheckboxConfig } from './types'

// ─── Indeterminate checkbox for the header ───────────────────────────────────

interface IndeterminateCheckboxProps {
  checked: boolean
  indeterminate: boolean
  onChange: (checked: boolean) => void
}

function IndeterminateCheckbox({ checked, indeterminate, onChange }: IndeterminateCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="size-4 cursor-pointer rounded border-input accent-primary"
    />
  )
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createCheckboxColumn<T extends object>(
  checkboxConfig: CheckboxConfig<T>,
): ColumnDef<T, unknown> {
  const { getRowId, selectedIds, onSelectAll, onSelectOne } = checkboxConfig

  return {
    id: '__select__',
    size: 40,
    enableResizing: false,
    enableSorting: false,
    enableColumnFilter: false,
    header: ({ table }: { table: Table<T> }) => {
      const rows = table.getRowModel().rows
      const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(getRowId(r.original)))
      const someSelected = !allSelected && rows.some((r) => selectedIds.has(getRowId(r.original)))

      return (
        <IndeterminateCheckbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={(checked) => onSelectAll(rows as Row<T>[], checked)}
        />
      )
    },
    cell: ({ row }: { row: Row<T> }) => {
      const id = getRowId(row.original)
      return (
        <input
          type="checkbox"
          checked={selectedIds.has(id)}
          onChange={(e) => onSelectOne(id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="size-4 cursor-pointer rounded border-input accent-primary"
        />
      )
    },
  }
}
