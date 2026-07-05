import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataGrid } from '@/DataGrid'
import { ColumnVisibilityDropdown } from '@/core/controls/ColumnVisibilityDropdown'
import { DataGridPaginationBar } from '@/core/controls/DataGridPaginationBar'
import { useGridKitRovingFocus } from '@/core/view-sdk/useGridKitRovingFocus'
import type { DataGridColumnDef } from '@/types'
import type { Row } from '@tanstack/react-table'

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

  it('supports roving cell focus with arrow keys and Space row selection', async () => {
    const onSelectOne = vi.fn()
    const columns: DataGridColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
    ]

    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        checkboxConfig={{
          getRowId: (row) => row.id,
          selectedIds: new Set(),
          onSelectAll: vi.fn(),
          onSelectOne,
        }}
      />,
    )

    const firstCell = container.querySelector<HTMLElement>('[data-gridkit-cell="true"][data-row-index="0"][data-col-index="0"]')
    const secondRowCell = container.querySelector<HTMLElement>('[data-gridkit-cell="true"][data-row-index="1"][data-col-index="0"]')

    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '2')
    expect(firstCell).toHaveAttribute('tabindex', '0')
    expect(firstCell).not.toHaveAttribute('data-focused')

    firstCell?.focus()
    await waitFor(() => expect(firstCell).toHaveAttribute('data-focused', 'true'))

    fireEvent.keyDown(firstCell!, { key: 'ArrowDown' })

    expect(firstCell).not.toHaveAttribute('data-focused')
    expect(secondRowCell).toHaveAttribute('data-focused', 'true')
    expect(secondRowCell).toHaveFocus()

    fireEvent.keyDown(secondRowCell!, { key: ' ' })
    expect(onSelectOne).toHaveBeenCalledWith('2', true)
  })

  it('can disable keyboard cell navigation', () => {
    const columns: DataGridColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
    ]

    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        enableKeyboardNavigation={false}
      />,
    )

    expect(container.querySelector('[data-gridkit-cell="true"]')).not.toBeInTheDocument()
    expect(container.querySelector('.gridkit-cell')).not.toHaveAttribute('tabindex')
  })

  it('enters inline editing with Enter and exits with Escape', () => {
    const columns: DataGridColumnDef<Person>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
        meta: {
          editCell: ({ value }) => (
            <input aria-label="Edit name" value={String(value)} onChange={() => undefined} />
          ),
        },
      },
    ]

    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        onCellValueChange={vi.fn()}
      />,
    )

    const firstCell = container.querySelector<HTMLElement>('[data-gridkit-cell="true"][data-row-index="0"][data-col-index="0"]')
    firstCell?.focus()
    fireEvent.keyDown(firstCell!, { key: 'Enter' })

    const input = screen.getByRole('textbox', { name: 'Edit name' })
    expect(input).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('textbox', { name: 'Edit name' })).not.toBeInTheDocument()
  })

  it('moves DOM focus in the headless roving focus helper', async () => {
    const rows = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ] as Row<{ id: string }>[]

    function RovingDemo() {
      const roving = useGridKitRovingFocus({ rows })
      return (
        <div>
          {rows.map((row, index) => (
            <button key={row.id} type="button" {...roving.getItemProps(index)}>
              {row.id.toUpperCase()}
            </button>
          ))}
        </div>
      )
    }

    render(<RovingDemo />)

    const first = screen.getByRole('button', { name: 'A' })
    const second = screen.getByRole('button', { name: 'B' })
    const third = screen.getByRole('button', { name: 'C' })

    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    await waitFor(() => expect(second).toHaveFocus())

    fireEvent.keyDown(second, { key: 'ArrowDown' })
    await waitFor(() => expect(third).toHaveFocus())
  })

  it('keeps a tab stop when headless roving rows shrink', async () => {
    function ShrinkingRovingDemo() {
      const [items, setItems] = useState([
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
      ])
      const rows = items as Row<{ id: string }>[]
      const roving = useGridKitRovingFocus({ rows, initialIndex: 2 })

      return (
        <div>
          <button type="button" onClick={() => setItems((current) => current.slice(0, 1))}>
            Shrink
          </button>
          <span data-testid="focused-index">{roving.focusedIndex}</span>
          {rows.map((row, index) => (
            <button key={row.id} type="button" {...roving.getItemProps(index)}>
              {row.id.toUpperCase()}
            </button>
          ))}
        </div>
      )
    }

    render(<ShrinkingRovingDemo />)

    expect(screen.getByRole('button', { name: 'C' })).toHaveAttribute('tabindex', '0')

    fireEvent.click(screen.getByRole('button', { name: 'Shrink' }))

    await waitFor(() => {
      expect(screen.getByTestId('focused-index')).toHaveTextContent('0')
      expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('tabindex', '0')
    })
  })
})
