import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataGridCard } from '@/DataGridCard'
import type { DataGridColumnDef } from '@/types'

interface Item {
  id: string
  label: string
}

const columns: DataGridColumnDef<Item>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'label' },
]

function makeItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    label: `Card ${index}`,
  }))
}

describe('DataGridCard virtualization', () => {
  it('renders all cards by default', () => {
    render(
      <DataGridCard
        data={makeItems(20)}
        columns={columns}
        getRowId={(item) => item.id}
        renderCard={(row) => <div>{row.original.label}</div>}
      />,
    )

    expect(screen.getByText('Card 0')).toBeInTheDocument()
    expect(screen.getByText('Card 19')).toBeInTheDocument()
  })

  it('keeps the non-virtual path when virtualization has no fixed height', () => {
    const { container } = render(
      <DataGridCard
        data={makeItems(40)}
        columns={columns}
        getRowId={(item) => item.id}
        enableVirtualization
        estimateCardHeight={80}
        renderCard={(row) => <div>{row.original.label}</div>}
      />,
    )

    expect(container.querySelector('.dg-card-virtual-spacer')).not.toBeInTheDocument()
    expect(screen.getByText('Card 0')).toBeInTheDocument()
    expect(screen.getByText('Card 39')).toBeInTheDocument()
  })

  it('renders a bounded card row window when virtualization has fixed height', async () => {
    const { container } = render(
      <DataGridCard
        data={makeItems(1000)}
        columns={columns}
        getRowId={(item) => item.id}
        containerHeight={240}
        cardColumns={2}
        enableVirtualization
        estimateCardHeight={80}
        overscan={1}
        renderCard={(row) => <div>{row.original.label}</div>}
      />,
    )

    expect(container.querySelector('.dg-card-virtual-spacer')?.getAttribute('data-virtualized')).toBe('true')
    await waitFor(() => expect(screen.getByText('Card 0')).toBeInTheDocument())
    expect(screen.queryByText('Card 999')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.dg-card').length).toBeLessThan(1000)
  })

  it('uses the shared custom scrollbar layer when requested', () => {
    const { container } = render(
      <DataGridCard
        data={makeItems(100)}
        columns={columns}
        getRowId={(item) => item.id}
        containerHeight={240}
        cardColumns={2}
        scrollbar={{ mode: 'custom' }}
        renderCard={(row) => <div>{row.original.label}</div>}
      />,
    )

    expect(container.querySelector('.dg-card-container')?.getAttribute('data-scrollbar')).toBe('custom')
    expect(container.querySelector('.dg-scroll-frame')).toBeInTheDocument()
    expect(container.querySelector('.dg-scrollbar-track')).toBeInTheDocument()
  })

})
