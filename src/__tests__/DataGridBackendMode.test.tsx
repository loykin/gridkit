import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import type { Table } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'
import { DataGrid } from '@/DataGrid'
import { createDataStore } from '@/core/engine/store/DataStore'
import type { DataStoreBackend, QueryParams } from '@/core/engine/store/DataStoreBackend'
import type { DataGridColumnDef } from '@/types'

interface Person {
  id: string
  name: string
  age: number
}

const columns: DataGridColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name', meta: { filterType: 'select', backendField: 'person_name' } },
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

  it('loads select filter options from backend facets in backend query mode', async () => {
    const query = vi.fn(async (_params: QueryParams) => ({
      rows: [{ id: '1', name: 'Ada', age: 36 }],
      total: 1,
    }))
    const getFacets = vi.fn(async () => ({ values: ['Ada', 'Grace'] }))
    const backend: DataStoreBackend<Person> = { query, getFacets }
    const store = createDataStore<Person>({ getRowId: (row) => row.id, backend })

    render(
      <DataGrid
        dataStore={store}
        queryMode="backend"
        columns={columns}
        getRowId={(row) => row.id}
        pagination={{ pageSize: 10 }}
        enableColumnFilters
        filterDisplay="icon"
      />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Filter name' }))

    await waitFor(() => expect(getFacets).toHaveBeenCalledWith({
      field: 'person_name',
      filters: [],
      globalFilter: undefined,
    }))
    expect(await screen.findByRole('option', { name: 'Grace' })).toBeInTheDocument()
  })

  it('warns when backend capabilities do not match enabled backend mode features', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const backend: DataStoreBackend<Person> = {
      capabilities: { sorting: false },
      query: vi.fn(async () => ({
        rows: [{ id: '1', name: 'Ada', age: 36 }],
        total: 1,
      })),
    }
    const store = createDataStore<Person>({ getRowId: (row) => row.id, backend })

    render(
      <DataGrid
        dataStore={store}
        queryMode="backend"
        columns={columns}
        getRowId={(row) => row.id}
        pagination={{ pageSize: 10 }}
      />,
    )

    await waitFor(() => expect(warn).toHaveBeenCalledWith(
      '[GridKit] queryMode="backend" is using unsupported backend capabilities: sorting.',
    ))
    warn.mockRestore()
  })
})
