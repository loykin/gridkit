import { act, render, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import type { Table } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'
import { DataGrid } from '@/DataGrid'
import { createDataStore } from '@/core/engine/DataStore'
import type { DataStoreBackend, QueryParams } from '@/core/engine/DataStoreBackend'
import type { DataGridColumnDef } from '@/types'

interface Person {
  id: string
  name: string
  age: number
}

const columns: DataGridColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name', meta: { backendField: 'person_name' } },
  { accessorKey: 'age', header: 'Age' },
]

describe('DataGrid backend query mode', () => {
  it('queries backend pagination and resets to page 0 when criteria changes', async () => {
    const query = vi.fn(async (_params: QueryParams) => ({
      rows: [{ id: '1', name: 'Ada', age: 36 }],
      total: 100,
    }))
    const backend: DataStoreBackend<Person> = { query }
    const store = createDataStore<Person>({ getRowId: (row) => row.id, backend })
    const tableRef = createRef<Table<Person> | null>()

    render(
      <DataGrid
        dataStore={store}
        queryMode="backend"
        columns={columns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
        pagination={{ pageSize: 10 }}
      />,
    )

    await waitFor(() => expect(query).toHaveBeenCalledWith({
      filters: [],
      globalFilter: undefined,
      sort: [],
      limit: 10,
      offset: 0,
    }))

    await waitFor(() => expect(tableRef.current).not.toBeNull())

    act(() => {
      tableRef.current!.setPageIndex(2)
    })

    await waitFor(() => expect(query).toHaveBeenCalledWith({
      filters: [],
      globalFilter: undefined,
      sort: [],
      limit: 10,
      offset: 20,
    }))

    act(() => {
      tableRef.current!.setGlobalFilter('ada')
    })

    await waitFor(() => expect(query).toHaveBeenCalledWith({
      filters: [],
      globalFilter: 'ada',
      sort: [],
      limit: 10,
      offset: 0,
    }))
  })

  it('maps sorting to backendField in backend query params', async () => {
    const query = vi.fn(async (_params: QueryParams) => ({
      rows: [{ id: '1', name: 'Ada', age: 36 }],
      total: 1,
    }))
    const backend: DataStoreBackend<Person> = { query }
    const store = createDataStore<Person>({ getRowId: (row) => row.id, backend })
    const tableRef = createRef<Table<Person> | null>()

    render(
      <DataGrid
        dataStore={store}
        queryMode="backend"
        columns={columns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
        pagination={{ pageSize: 10 }}
      />,
    )

    await waitFor(() => expect(tableRef.current).not.toBeNull())

    act(() => {
      tableRef.current!.setSorting([{ id: 'name', desc: true }])
    })

    await waitFor(() => expect(query).toHaveBeenCalledWith({
      filters: [],
      globalFilter: undefined,
      sort: [{ field: 'person_name', desc: true }],
      limit: 10,
      offset: 0,
    }))
  })
})
