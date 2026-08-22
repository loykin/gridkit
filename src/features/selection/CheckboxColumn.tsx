import type { ColumnDef, Row } from '@/core/engine/tanstack/gridKitTable'
import type { CheckboxConfig } from '@/types'
import { Checkbox } from '@/core/UIComponents'

// ─── Indeterminate checkbox for the header ───────────────────────────────────

interface IndeterminateCheckboxProps {
  checked: boolean
  indeterminate: boolean
  onChange: (checked: boolean) => void
  label: string
}

function IndeterminateCheckbox({ checked, indeterminate, onChange, label }: IndeterminateCheckboxProps) {
  return (
    <Checkbox
      aria-label={label}
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={onChange}
    />
  )
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createCheckboxColumn<T extends object>(
  checkboxConfig: CheckboxConfig<T>,
  width = 40,
  lockWidth = false,
): ColumnDef<T, unknown> {
  const { getRowId, selectedIds, onSelectAll, onSelectOne } = checkboxConfig

  return {
    id: '__select__',
    size: width,
    ...(lockWidth ? { minSize: width, maxSize: width } : {}),
    enableResizing: false,
    enableSorting: false,
    enableColumnFilter: false,
    meta: {
      columnMenu: false,
      pinControl: false,
    },
    header: ({ table }) => {
      const rows = table.getRowModel().rows
      const allSelected =
        rows.length > 0 && rows.every((r) => selectedIds.has(getRowId(r.original)))
      const someSelected = !allSelected && rows.some((r) => selectedIds.has(getRowId(r.original)))

      return (
        <IndeterminateCheckbox
          checked={allSelected}
          indeterminate={someSelected}
          label="Select all rows"
          onChange={(checked) => onSelectAll(rows as Row<T>[], checked)}
        />
      )
    },
    cell: ({ row }) => {
      const id = getRowId(row.original)
      return (
        <Checkbox
          aria-label={`Select row ${id}`}
          checked={selectedIds.has(id)}
          onCheckedChange={(checked) => onSelectOne(id, checked)}
          onClick={(event) => event.stopPropagation()}
        />
      )
    },
  }
}
