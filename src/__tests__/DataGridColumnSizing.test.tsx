import { act, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Table } from '@/core/engine/tanstack/gridKitTable'
import { DataGrid } from '@/DataGrid'
import type { DataGridColumnDef } from '@/types'

interface Row {
  a: string
  b: string
  fixed: string
}

const rows: Row[] = [{ a: 'A', b: 'B', fixed: 'fixed' }]

const columns = (aFlex: number | undefined, bFlex?: number): DataGridColumnDef<Row>[] => [
  { accessorKey: 'a', id: 'a', size: 145, meta: aFlex === undefined ? {} : { flex: aFlex } },
  { accessorKey: 'b', id: 'b', size: 100, meta: bFlex === undefined ? {} : { flex: bFlex } },
  { accessorKey: 'fixed', id: 'fixed', size: 100 },
]

describe('useColumnSizing — runtime flex/pin definition changes', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(600)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('restores the configured fixed width when flex is removed without remounting', async () => {
    let table: Table<Row> | undefined
    const onReady = (value: Table<Row>) => {
      table = value
    }
    const view = render(<DataGrid data={rows} columns={columns(1)} onTableReady={onReady} />)
    await waitFor(() => expect(table?.getColumn('a')?.getSize()).toBe(400))

    view.rerender(<DataGrid data={rows} columns={columns(undefined)} onTableReady={onReady} />)
    await waitFor(() => expect(table?.getColumn('a')?.getSize()).toBe(145))
  })

  it('recalculates changed flex ratios within the same container', async () => {
    let table: Table<Row> | undefined
    const onReady = (value: Table<Row>) => {
      table = value
    }
    const view = render(<DataGrid data={rows} columns={columns(1, 1)} onTableReady={onReady} />)
    await waitFor(() => expect(table?.getColumn('a')?.getSize()).toBe(250))

    view.rerender(<DataGrid data={rows} columns={columns(3, 1)} onTableReady={onReady} />)
    await waitFor(() => {
      expect(table?.getColumn('a')?.getSize()).toBe(375)
      expect(table?.getColumn('b')?.getSize()).toBe(125)
    })
  })

  it('preserves an unrelated manual resize when another column definition changes', async () => {
    let table: Table<Row> | undefined
    const onReady = (value: Table<Row>) => {
      table = value
    }
    const view = render(<DataGrid data={rows} columns={columns(1)} onTableReady={onReady} />)
    await waitFor(() => expect(table?.getColumn('a')?.getSize()).toBe(400))

    act(() => table?.setColumnSizing((previous) => ({ ...previous, b: 170 })))
    view.rerender(<DataGrid data={rows} columns={columns(undefined)} onTableReady={onReady} />)
    await waitFor(() => {
      expect(table?.getColumn('a')?.getSize()).toBe(145)
      expect(table?.getColumn('b')?.getSize()).toBe(170)
    })
  })

  it('keeps initial external sizing and manual flex overrides across ordinary row refreshes', async () => {
    let table: Table<Row> | undefined
    const onReady = (value: Table<Row>) => {
      table = value
    }
    const view = render(
      <DataGrid data={rows} columns={columns(1)} columnSizing={{ a: 222 }} onTableReady={onReady} />,
    )
    await waitFor(() => expect(table?.getColumn('a')?.getSize()).toBe(222))

    act(() => table?.setColumnSizing((previous) => ({ ...previous, a: 280 })))
    view.rerender(
      <DataGrid
        data={[{ a: 'new', b: 'row', fixed: 'same' }]}
        columns={columns(1)}
        onTableReady={onReady}
      />,
    )
    await waitFor(() => expect(table?.getColumn('a')?.getSize()).toBe(280))
  })
})
