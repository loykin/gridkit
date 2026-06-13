import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataGrid } from '@/DataGrid'
import { ColumnVisibilityDropdown } from '@/core/controls/ColumnVisibilityDropdown'
import { DataGridPaginationBar } from '@/core/controls/DataGridPaginationBar'
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

  it('applies classNames.footer to the footer wrapper', () => {
    const columns: DataGridColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
    ]

    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        pagination={{ pageSize: 1 }}
        footer={(table) => <DataGridPaginationBar table={table} />}
        classNames={{ footer: 'custom-footer' }}
      />,
    )

    expect(container.querySelector('.gridkit-footer')).toHaveClass('custom-footer')
  })

  it('exposes row action menus with menu semantics and Escape close behavior', async () => {
    const columns: DataGridColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      {
        id: 'actions',
        header: '',
        meta: {
          actions: () => [
            { label: 'Inspect', onClick: vi.fn() },
            { label: 'Delete', onClick: vi.fn(), variant: 'destructive' },
          ],
        },
      },
    ]

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Open row actions for row 1' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')

    fireEvent.click(trigger)

    const menu = await screen.findByRole('menu')
    expect(screen.getByRole('menuitem', { name: 'Inspect' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Inspect' })).toHaveFocus())

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(menu).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
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
