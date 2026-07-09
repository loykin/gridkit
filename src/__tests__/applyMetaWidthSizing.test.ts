import { describe, expect, it } from 'vitest'
import { applyMetaWidthSizing } from '@/features/resizing/applyMetaWidthSizing'
import type { DataGridColumnDef } from '@/types'

interface Row {
  id: number
}

describe('applyMetaWidthSizing', () => {
  it('maps meta.width onto size when size is not set', () => {
    const columns: DataGridColumnDef<Row>[] = [
      { accessorKey: 'id', header: 'ID', meta: { width: 250 } },
    ]

    const [result] = applyMetaWidthSizing(columns)
    expect(result?.size).toBe(250)
  })

  it('does not override an explicitly set size', () => {
    const columns: DataGridColumnDef<Row>[] = [
      { accessorKey: 'id', header: 'ID', size: 100, meta: { width: 250 } },
    ]

    const [result] = applyMetaWidthSizing(columns)
    expect(result?.size).toBe(100)
  })

  it('leaves columns without meta.width untouched', () => {
    const columns: DataGridColumnDef<Row>[] = [{ accessorKey: 'id', header: 'ID' }]

    const [result] = applyMetaWidthSizing(columns)
    expect(result?.size).toBeUndefined()
  })

  it('applies the mapping recursively to grouped columns', () => {
    const columns: DataGridColumnDef<Row>[] = [
      {
        id: 'group',
        header: 'Group',
        columns: [{ accessorKey: 'id', header: 'ID', meta: { width: 180 } }],
      },
    ]

    const [group] = applyMetaWidthSizing(columns)
    const child = (group as { columns?: DataGridColumnDef<Row>[] }).columns?.[0]
    expect(child?.size).toBe(180)
  })
})
