import { useMemo } from 'react'
import type { DataGridProps } from '@/types'
import type { GridKitTablePayload, GridKitTableColumn } from '@/types'
import { DataGrid } from './DataGrid'
import { Badge } from './components/ui/badge'

type Row = Record<string, unknown>

export interface GridKitAutoTableProps
  extends Omit<DataGridProps<Row>, 'data' | 'columns'> {
  payload: GridKitTablePayload
}

const SAFE_URL_SCHEME = /^(https?:|mailto:|\/)/i

function buildCell(col: GridKitTableColumn) {
  if (col.type === 'number') {
    return ({ getValue }: { getValue: () => unknown }) => {
      const v = getValue()
      return v != null ? Number(v).toLocaleString() : null
    }
  }
  if (col.type === 'currency') {
    return ({ getValue }: { getValue: () => unknown }) => {
      const v = getValue()
      if (v == null) return null
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: col.currency ?? 'USD' }).format(Number(v))
    }
  }
  if (col.type === 'percentage') {
    return ({ getValue }: { getValue: () => unknown }) => {
      const v = getValue()
      return v != null ? new Intl.NumberFormat(undefined, { style: 'percent' }).format(Number(v)) : null
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
  if (col.type === 'datetime') {
    return ({ getValue }: { getValue: () => unknown }) => {
      const v = getValue()
      if (v == null) return null
      const d = new Date(v as string | number)
      return isNaN(d.getTime()) ? String(v) : d.toLocaleString()
    }
  }
  if (col.type === 'boolean') {
    return ({ getValue }: { getValue: () => unknown }) =>
      getValue() ? 'Yes' : 'No'
  }
  if (col.type === 'url') {
    return ({ getValue }: { getValue: () => unknown }) => {
      const v = getValue()
      if (v == null) return null
      const href = String(v)
      if (!SAFE_URL_SCHEME.test(href)) return href
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {href}
        </a>
      )
    }
  }
  if (col.type === 'badge') {
    return ({ getValue }: { getValue: () => unknown }) => {
      const v = getValue()
      return v != null ? <Badge variant="secondary">{String(v)}</Badge> : null
    }
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
          meta: { align: col.align, flex: col.flex ?? 1 },
        }
      }),
    [payload.columns],
  )

  return (
    <DataGrid<Row>
      data={props.dataStore ? undefined : payload.rows}
      columns={columns}
      {...props}
    />
  )
}
