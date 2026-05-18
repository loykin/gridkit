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
  department?: string
  status?: string
}

const columns: DataGridColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name', meta: { filterType: 'select', backendField: 'person_name' } },
  { accessorKey: 'age', header: 'Age' },
]

const facetColumns: DataGridColumnDef<Person>[] = [
  { accessorKey: 'department', header: 'Department', meta: { filterType: 'select', backendField: 'dept' } },
  { accessorKey: 'status', header: 'Status', meta: { filterType: 'select', backendField: 'employee_status' } },
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

  it('uses controlled pagination.pageIndex for backend query params', async () => {
    const query = vi.fn(async (_params: QueryParams) => ({
      rows: [{ id: '1', name: 'Ada', age: 36 }],
      total: 100,
    }))
    const backend: DataStoreBackend<Person> = { query }
    const store = createDataStore<Person>({ getRowId: (row) => row.id, backend })

    render(
      <DataGrid
        dataStore={store}
        queryMode="backend"
        columns={columns}
        getRowId={(row) => row.id}
        pagination={{ pageIndex: 2, pageSize: 10 }}
      />,
    )

    await waitFor(() => expect(query).toHaveBeenCalledWith({
      filters: [],
      globalFilter: undefined,
      sort: [],
      limit: 10,
      offset: 20,
    }))
  })

  it('requests a controlled page reset when backend query criteria changes', async () => {
    const query = vi.fn(async (_params: QueryParams) => ({
      rows: [{ id: '1', name: 'Ada', age: 36 }],
      total: 100,
    }))
    const onPageChange = vi.fn()
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
        pagination={{ pageIndex: 2, pageSize: 10, onPageChange }}
      />,
    )

    await waitFor(() => expect(tableRef.current).not.toBeNull())

    act(() => {
      tableRef.current!.setGlobalFilter('ada')
    })

    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(0, 10))
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

  it('reloads backend facets when column filters change and excludes the current column filter', async () => {
    const query = vi.fn(async (_params: QueryParams) => ({
      rows: [{ id: '1', name: 'Ada', age: 36, department: 'Engineering', status: 'Active' }],
      total: 1,
    }))
    const getFacets = vi.fn(async () => ({ values: ['Active', 'Paused'] }))
    const backend: DataStoreBackend<Person> = { query, getFacets }
    const store = createDataStore<Person>({ getRowId: (row) => row.id, backend })
    const tableRef = createRef<Table<Person> | null>()

    render(
      <DataGrid
        dataStore={store}
        queryMode="backend"
        columns={facetColumns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
        pagination={{ pageSize: 10 }}
        enableColumnFilters
        filterDisplay="icon"
      />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Filter status' }))
    await waitFor(() => expect(getFacets).toHaveBeenCalledTimes(1))

    act(() => {
      tableRef.current!.setColumnFilters([
        { id: 'department', value: 'Engineering' },
        { id: 'status', value: 'Active' },
      ])
    })

    await waitFor(() => expect(getFacets).toHaveBeenLastCalledWith({
      field: 'employee_status',
      filters: [{ field: 'dept', op: 'eq', value: 'Engineering' }],
      globalFilter: undefined,
    }))
  })

  it('reloads backend facets when global filter changes', async () => {
    const query = vi.fn(async (_params: QueryParams) => ({
      rows: [{ id: '1', name: 'Ada', age: 36, department: 'Engineering', status: 'Active' }],
      total: 1,
    }))
    const getFacets = vi.fn(async () => ({ values: ['Active', 'Paused'] }))
    const backend: DataStoreBackend<Person> = { query, getFacets }
    const store = createDataStore<Person>({ getRowId: (row) => row.id, backend })
    const tableRef = createRef<Table<Person> | null>()

    render(
      <DataGrid
        dataStore={store}
        queryMode="backend"
        columns={facetColumns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
        pagination={{ pageSize: 10 }}
        enableColumnFilters
        filterDisplay="icon"
      />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Filter status' }))
    await waitFor(() => expect(getFacets).toHaveBeenCalledTimes(1))

    act(() => {
      tableRef.current!.setGlobalFilter('ada')
    })

    await waitFor(() => expect(getFacets).toHaveBeenLastCalledWith({
      field: 'employee_status',
      filters: [],
      globalFilter: 'ada',
    }))
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
