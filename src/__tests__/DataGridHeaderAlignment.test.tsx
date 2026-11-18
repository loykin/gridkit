import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataGrid } from '@/DataGrid'
import type { DataGridColumnDef } from '@/types'

interface Item {
  id: string
  amount: number
}

const data: Item[] = [{ id: '1', amount: 120 }]
type Alignment = 'left' | 'center' | 'right'

describe('DataGrid header alignment', () => {
  it.each<{
    align?: Alignment
    headerAlign?: Alignment
    expected?: Alignment
  }>([
    {},
    { align: 'left', expected: 'left' },
    { align: 'center', expected: 'center' },
    { align: 'right', expected: 'right' },
    { align: 'right', headerAlign: 'center', expected: 'center' },
    { align: 'right', headerAlign: 'left', expected: 'left' },
    { align: 'left', headerAlign: 'right', expected: 'right' },
    { headerAlign: 'center', expected: 'center' },
  ])('uses $expected for the header with align=$align, headerAlign=$headerAlign', ({ align, headerAlign, expected }) => {
    const columns: DataGridColumnDef<Item>[] = [
      { accessorKey: 'amount', header: 'Amount', meta: { align, headerAlign } },
    ]
    render(<DataGrid data={data} columns={columns} />)

    const header = screen.getByRole('columnheader', { name: /Amount/ })
    const cell = screen.getByRole('gridcell', { name: '120' })
    if (expected) expect(header).toHaveAttribute('data-align', expected)
    else expect(header).not.toHaveAttribute('data-align')
    if (align) expect(cell).toHaveAttribute('data-align', align)
    else expect(cell).not.toHaveAttribute('data-align')
  })

  it.each([
    { headerGroupLayout: 'padded', pinned: false },
    { headerGroupLayout: 'span', pinned: false },
    { headerGroupLayout: 'padded', pinned: true },
    { headerGroupLayout: 'span', pinned: true },
  ] as const)('only aligns leaf headers in $headerGroupLayout groups with pinned=$pinned', ({ headerGroupLayout, pinned }) => {
    const columns: DataGridColumnDef<Item>[] = [
      { accessorKey: 'id', header: 'ID', meta: { headerAlign: 'right' } },
      {
        id: 'totals',
        header: 'Totals',
        meta: { align: 'right', headerAlign: 'left' },
        columns: [
          { accessorKey: 'amount', header: 'Amount', meta: { align: 'right', headerAlign: 'center' } },
        ],
      },
    ]
    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        headerGroupLayout={headerGroupLayout}
        initialPinning={pinned ? { start: ['id'], end: ['amount'] } : undefined}
        enableColumnPinning
        enableColumnReordering
      />,
    )

    const idHeader = screen.getByRole('columnheader', { name: /ID/ })
    const amountHeader = screen.getByRole('columnheader', { name: /Amount/ })
    expect(idHeader).toHaveAttribute('data-align', 'right')
    expect(amountHeader).toHaveAttribute('data-align', 'center')
    if (pinned) {
      expect(idHeader).toHaveAttribute('data-pinned', 'left')
      expect(amountHeader).toHaveAttribute('data-pinned', 'right')
    } else {
      expect(amountHeader.querySelector('[data-reorder-handle="true"]')).toBeInTheDocument()
    }
    expect(screen.getByRole('columnheader', { name: 'Totals' })).not.toHaveAttribute('data-align')
    for (const placeholder of container.querySelectorAll('[data-placeholder="true"]')) {
      expect(placeholder).not.toHaveAttribute('data-align')
    }
    expect(screen.getByRole('gridcell', { name: '120' })).toHaveAttribute('data-align', 'right')
  })

  it('updates the header override and falls back to align when removed', () => {
    const columns = (headerAlign?: Alignment): DataGridColumnDef<Item>[] => [
      { accessorKey: 'amount', header: 'Amount', meta: { align: 'right', headerAlign } },
    ]
    const { rerender } = render(<DataGrid data={data} columns={columns('center')} />)
    expect(screen.getByRole('columnheader', { name: /Amount/ })).toHaveAttribute('data-align', 'center')

    rerender(<DataGrid data={data} columns={columns()} />)
    expect(screen.getByRole('columnheader', { name: /Amount/ })).toHaveAttribute('data-align', 'right')
    expect(screen.getByRole('gridcell', { name: '120' })).toHaveAttribute('data-align', 'right')
  })

  it.each([false, true])('preserves filtering with column menu=%s and header sorting', (enableColumnMenu) => {
    const columns: DataGridColumnDef<Item>[] = [
      {
        accessorKey: 'amount',
        header: 'Amount',
        meta: { align: 'right', headerAlign: 'center', filterType: 'number' },
      },
    ]
    render(
      <DataGrid
        data={data}
        columns={columns}
        enableColumnFilters
        filterDisplay="icon"
        enableColumnMenu={enableColumnMenu}
      />,
    )

    const header = screen.getByRole('columnheader', { name: /Amount/ })
    expect(header).toHaveAttribute('data-align', 'center')
    const button = within(header).getByRole('button', {
      name: enableColumnMenu ? 'Column menu for amount' : 'Filter amount',
    })
    fireEvent.click(button)
    expect(header).not.toHaveAttribute('aria-sort')
    expect(screen.getByRole('gridcell', { name: '120' })).toHaveAttribute('data-align', 'right')

    if (enableColumnMenu) {
      expect(screen.getByText('Sort Ascending')).toBeInTheDocument()
    } else {
      expect(screen.getByPlaceholderText('Min')).toBeInTheDocument()
      fireEvent.click(header)
      expect(header).toHaveAttribute('aria-sort', 'descending')
    }
  })
})
