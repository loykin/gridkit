import { useMemo } from 'react'
import type { DataGridProps } from '@/types'
import type { GridKitTablePayload, GridKitTableColumn } from '@/types'
import { DataGrid } from './DataGrid'

type Row = Record<string, unknown>

export interface GridKitAutoTableProps
  extends Omit<DataGridProps<Row>, 'data' | 'columns'> {
  payload: GridKitTablePayload
}

function buildCell(col: GridKitTableColumn) {
  if (col.type === 'number') {
    return ({ getValue }: { getValue: () => unknown }) => {
      const v = getValue()
      return v != null ? Number(v).toLocaleString() : null
    }
  }
  if (col.type === 'date') {
    return ({ getValue }: { getValue: () => unknown }) => {
      const v = getValue()
      if (v == null) return null
      const d = new Date(v as string | number)
      return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()
    }
  }
  if (col.type === 'boolean') {
    return ({ getValue }: { getValue: () => unknown }) =>
      getValue() ? 'Yes' : 'No'
  }
  return undefined
}

export function GridKitAutoTable({ payload, ...props }: GridKitAutoTableProps) {
  const columns = useMemo(
    () =>
      payload.columns.map((col) => {
        const cell = buildCell(col)
        return {
          accessorKey: col.key,
          header: col.label,
          ...(cell ? { cell } : {}),
          meta: { align: col.align },
        }
      }),
    [payload.columns],
  )

  return (
    <DataGrid<Row>
      data={payload.rows}
      columns={columns}
      {...props}
    />
  )
}
