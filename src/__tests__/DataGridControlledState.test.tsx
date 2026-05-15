import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import type { Table, VisibilityState } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'
import { DataGrid } from '@/DataGrid'
import { ColumnVisibilityDropdown } from '@/core/controls/ColumnVisibilityDropdown'
import type { DataGridColumnDef } from '@/types'

interface Person {
  id: string
  name: string
  age: number
}

const data: Person[] = [
  { id: '1', name: 'Ada', age: 36 },
  { id: '2', name: 'Grace', age: 40 },
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
})
