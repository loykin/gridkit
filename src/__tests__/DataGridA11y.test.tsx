import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataGrid } from '@/DataGrid'
import { ColumnVisibilityDropdown } from '@/core/ColumnVisibilityDropdown'
import { DataGridPaginationBar } from '@/core/DataGridPaginationBar'
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

describe('DataGrid accessibility labels', () => {
  it('names icon-only table controls', () => {
    const columns: DataGridColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name', meta: { filterType: 'text' } },
      { accessorKey: 'age', header: 'Age' },
      {
        id: 'actions',
        header: '',
        meta: {
          actions: () => [{ label: 'Inspect', onClick: vi.fn() }],
        },
      },
    ]

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        enableColumnFilters
        filterDisplay="icon"
        enableColumnPinning
        headerRight={(table) => <ColumnVisibilityDropdown table={table} />}
        pagination={{ pageSize: 1 }}
        footer={(table) => <DataGridPaginationBar table={table} />}
      />,
    )

    expect(screen.getByRole('button', { name: 'Filter name' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pin options for name' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose visible columns' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open row actions for row 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument()
  })

  it('names selection checkboxes', () => {
    const columns: DataGridColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
    ]

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        checkboxConfig={{
          getRowId: (row) => row.id,
          selectedIds: new Set(),
          onSelectAll: vi.fn(),
          onSelectOne: vi.fn(),
        }}
      />,
    )

    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeInTheDocument()
  })
})
