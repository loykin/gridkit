import { act, render, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DataGrid } from '@/DataGrid'
import { createDataStore } from '@/core/engine/store/DataStore'
import type { Table } from '@/core/engine/tanstack/gridKitTable'
import type { DataGridColumnDef } from '@/types'

interface Person {
  id: string
  name: string
  team: string
  score: number
}

const data: Person[] = [
  { id: 'a', name: 'Ada', team: 'Core', score: 70 },
  { id: 'b', name: 'Grace', team: 'Core', score: 95 },
  { id: 'c', name: 'Linus', team: 'UI', score: 80 },
  { id: 'd', name: 'Margaret', team: 'UI', score: 90 },
]

const columns: DataGridColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'team',
    header: 'Team',
    filterFn: (row, columnId, value: string) => row.getValue(columnId) === value,
  },
  { accessorKey: 'score', header: 'Score' },
]

describe('TanStack Table v9 engine integration', () => {
  it('connects filtering, sorting, pagination, and grouping row models', async () => {
    const tableRef = createRef<Table<Person> | null>()

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
        enableColumnFilters
        enableGrouping
        pagination={{ pageSize: 1 }}
      />,
    )

    await waitFor(() => expect(tableRef.current).not.toBeNull())
    expect(tableRef.current!.getCoreRowModel().rows.map((row) => row.id)).toEqual([
      'a', 'b', 'c', 'd',
    ])

    act(() => {
      tableRef.current!.setColumnFilters([{ id: 'team', value: 'Core' }])
      tableRef.current!.setSorting([{ id: 'score', desc: true }])
    })

    await waitFor(() => {
      expect(tableRef.current!.getFilteredRowModel().rows.map((row) => row.id)).toEqual(['a', 'b'])
      expect(tableRef.current!.getSortedRowModel().rows.map((row) => row.id)).toEqual(['b', 'a'])
      expect(tableRef.current!.getPaginatedRowModel().rows.map((row) => row.id)).toEqual(['b'])
    })

    act(() => {
      tableRef.current!.setColumnFilters([])
      tableRef.current!.setSorting([])
      tableRef.current!.setGrouping(['team'])
    })

    await waitFor(() => {
      const groupedRows = tableRef.current!.getGroupedRowModel().rows
      expect(groupedRows).toHaveLength(2)
      expect(groupedRows.map((row) => row.groupingValue)).toEqual(['Core', 'UI'])
      expect(groupedRows.map((row) => row.subRows.length)).toEqual([2, 2])
    })
  })

  it('registers v9 built-in filter, sort, and aggregation functions', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const tableRef = createRef<Table<Person> | null>()

    render(
      <DataGrid
        data={data}
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'team', header: 'Team' },
          { accessorKey: 'score', header: 'Score', aggregationFn: 'mean' },
        ]}
        getRowId={(row) => row.id}
        tableRef={tableRef}
        enableColumnFilters
        enableGrouping
      />,
    )

    await waitFor(() => expect(tableRef.current).not.toBeNull())

    act(() => {
      tableRef.current!.setColumnFilters([{ id: 'team', value: 'Core' }])
      tableRef.current!.setSorting([{ id: 'name', desc: false }])
    })

    await waitFor(() => {
      expect(tableRef.current!.getFilteredRowModel().rows.map((row) => row.id)).toEqual(['a', 'b'])
      expect(tableRef.current!.getSortedRowModel().rows.map((row) => row.id)).toEqual(['a', 'b'])
    })

    act(() => tableRef.current!.setGrouping(['team']))

    await waitFor(() => {
      expect(tableRef.current!.getGroupedRowModel().rows[0]?.getValue('score')).toBe(82.5)
    })
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('not registered'))
    warn.mockRestore()
  })

  it('keeps DataStore row objects stable while transactions update their values', async () => {
    const store = createDataStore<Person>({ getRowId: (row) => row.id })
    store.applyTransaction({ add: data.slice(0, 2) })
    const tableRef = createRef<Table<Person> | null>()

    render(
      <DataGrid
        dataStore={store}
        columns={columns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
      />,
    )

    await waitFor(() => expect(tableRef.current?.getCoreRowModel().rows).toHaveLength(2))
    const adaRow = tableRef.current!.getCoreRowModel().rowsById.a

    act(() => {
      tableRef.current!.applyTransaction({
        update: [{ id: 'a', data: { score: 99 } }],
        add: [{ id: 'c', name: 'Linus', team: 'UI', score: 80 }],
        remove: ['b'],
      })
    })

    await waitFor(() => {
      const rowModel = tableRef.current!.getCoreRowModel()
      expect(rowModel.rows.map((row) => row.id)).toEqual(['a', 'c'])
      expect(rowModel.rowsById.a).toBe(adaRow)
      expect(rowModel.rowsById.a.getValue('score')).toBe(99)
      expect(tableRef.current!.getRowNodeById('b')).toBeUndefined()
      expect(tableRef.current!.getRowNodeById('c')?.name).toBe('Linus')
    })

    await expect(tableRef.current!.applyTransactionAsync({
      update: [{ id: 'c', data: { score: 81 } }],
    })).resolves.toEqual({ ok: true, affected: 1 })
    expect(tableRef.current!.getRowNodeById('c')?.score).toBe(81)
  })

  it('resets an invalid page after a DataStore transaction shrinks the row model', async () => {
    const store = createDataStore<Person>({ getRowId: (row) => row.id })
    store.applyTransaction({ add: data })
    const tableRef = createRef<Table<Person> | null>()

    render(
      <DataGrid
        dataStore={store}
        columns={columns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
        pagination={{ pageSize: 2 }}
      />,
    )

    await waitFor(() => expect(tableRef.current?.getRowModel().rows).toHaveLength(2))
    act(() => tableRef.current!.setPageIndex(1))
    await waitFor(() => expect(tableRef.current!.state.pagination?.pageIndex).toBe(1))

    act(() => tableRef.current!.applyTransaction({ remove: ['c', 'd'] }))

    await waitFor(() => {
      expect(tableRef.current!.state.pagination?.pageIndex).toBe(0)
      expect(tableRef.current!.getRowModel().rows.map((row) => row.id)).toEqual(['a', 'b'])
    })
  })

  it('bypasses grouping work when grouping is disabled, including initialState escape hatches', async () => {
    const tableRef = createRef<Table<Person> | null>()

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
        tableOptions={{ initialState: { grouping: ['team'] } }}
      />,
    )

    await waitFor(() => expect(tableRef.current).not.toBeNull())
    expect(tableRef.current!.options.enableGrouping).toBe(false)
    expect(tableRef.current!.options.manualGrouping).toBe(true)
    expect(tableRef.current!.getGroupedRowModel().rows.map((row) => row.id)).toEqual([
      'a', 'b', 'c', 'd',
    ])
  })

  it('exposes the custom flex sizing API through the v9 feature registry', async () => {
    const tableRef = createRef<Table<Person> | null>()
    const flexColumns: DataGridColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name', size: 100 },
      { accessorKey: 'team', header: 'Team', meta: { flex: 1 } },
      { accessorKey: 'score', header: 'Score', meta: { flex: 2 } },
    ]

    render(
      <DataGrid
        data={data}
        columns={flexColumns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
      />,
    )

    await waitFor(() => expect(tableRef.current).not.toBeNull())
    expect(tableRef.current!.getFlexColumnSizing(700)).toEqual({
      team: 200,
      score: 400,
    })
  })
})
