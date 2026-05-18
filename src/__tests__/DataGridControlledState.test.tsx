import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import type { Table, VisibilityState } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'
import { DataGrid } from '@/DataGrid'
import { ColumnVisibilityDropdown } from '@/core/controls/ColumnVisibilityDropdown'
import { DataGridPaginationBar } from '@/core/controls/DataGridPaginationBar'
import { useTableStore } from '@/core/hooks/useTableStore'
import type { DataGridColumnDef } from '@/types'

interface Person {
  id: string
  name: string
  age: number
}

const data: Person[] = [
  { id: '1', name: 'Ada', age: 36 },
  { id: '2', name: 'Grace', age: 40 },
  { id: '3', name: 'Marie', age: 44 },
  { id: '4', name: 'Katherine', age: 42 },
]

const columns: DataGridColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
]

describe('DataGrid controlled state', () => {
  it('calls onGlobalFilterChange when globalFilter is controlled as an empty string', async () => {
    const tableRef = createRef<Table<Person> | null>()
    const onGlobalFilterChange = vi.fn()

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
        globalFilter=""
        onGlobalFilterChange={onGlobalFilterChange}
      />,
    )

    await waitFor(() => expect(tableRef.current).not.toBeNull())

    act(() => {
      tableRef.current!.setGlobalFilter('Ada')
    })

    expect(onGlobalFilterChange).toHaveBeenCalledWith('Ada')
  })

  it('renders controlled column visibility and reports visibility changes', async () => {
    const onColumnVisibilityChange = vi.fn()
    const hiddenAge: VisibilityState = { age: false }

    const { rerender } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        visibilityState={hiddenAge}
        onColumnVisibilityChange={onColumnVisibilityChange}
        headerRight={(table) => <ColumnVisibilityDropdown table={table} />}
      />,
    )

    expect(screen.queryByRole('columnheader', { name: /Age/ })).not.toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Choose visible columns' }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Toggle Age column visibility', hidden: true }))
    })

    expect(onColumnVisibilityChange).toHaveBeenCalledWith({ age: true })
    expect(screen.queryByRole('columnheader', { name: /Age/ })).not.toBeInTheDocument()

    rerender(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        visibilityState={{}}
        onColumnVisibilityChange={onColumnVisibilityChange}
        headerRight={(table) => <ColumnVisibilityDropdown table={table} />}
      />,
    )

    expect(screen.getByRole('columnheader', { name: /Age/ })).toBeInTheDocument()
  })

  it('treats initialPageIndex as an initial uncontrolled value only', async () => {
    const { rerender } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        pagination={{ pageSize: 1, initialPageIndex: 1 }}
      />,
    )

    expect(screen.getByText('Grace')).toBeInTheDocument()
    expect(screen.queryByText('Ada')).not.toBeInTheDocument()

    rerender(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        pagination={{ pageSize: 1, initialPageIndex: 2 }}
      />,
    )

    expect(screen.getByText('Grace')).toBeInTheDocument()
    expect(screen.queryByText('Marie')).not.toBeInTheDocument()
  })

  it('renders controlled pagination.pageIndex and waits for the caller to update it', async () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        pagination={{ pageIndex: 1, pageSize: 1, onPageChange }}
        footer={(table) => <DataGridPaginationBar table={table} pageSizes={[1]} />}
      />,
    )

    expect(screen.getByText('Grace')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }))

    expect(onPageChange).toHaveBeenCalledWith(2, 1)
    expect(screen.getByText('Grace')).toBeInTheDocument()
    expect(screen.queryByText('Marie')).not.toBeInTheDocument()

    rerender(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        pagination={{ pageIndex: 2, pageSize: 1, onPageChange }}
        footer={(table) => <DataGridPaginationBar table={table} pageSizes={[1]} />}
      />,
    )

    expect(screen.getByText('Marie')).toBeInTheDocument()
  })

  it('prefers controlled pagination.pageIndex over persisted table pagination', async () => {
    useTableStore.getState().update('controlled-page-test', {
      pagination: { pageIndex: 3, pageSize: 1 },
    })

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        tableKey="controlled-page-test"
        pagination={{ pageIndex: 1, pageSize: 1 }}
      />,
    )

    expect(screen.getByText('Grace')).toBeInTheDocument()
    expect(screen.queryByText('Katherine')).not.toBeInTheDocument()
  })
})
