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

    expect(container.querySelector('.gridkit-card-virtual-spacer')).not.toBeInTheDocument()
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

    expect(container.querySelector('.gridkit-card-virtual-spacer')?.getAttribute('data-virtualized')).toBe('true')
    await waitFor(() => expect(screen.getByText('Card 0')).toBeInTheDocument())
    expect(screen.queryByText('Card 999')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.gridkit-card').length).toBeLessThan(1000)
  })

  it('activates virtual mode with fillContainer (no explicit height)', () => {
    const { container } = render(
      <DataGridCard
        data={makeItems(1000)}
        columns={columns}
        getRowId={(item) => item.id}
        fillContainer
        cardColumns={2}
        enableVirtualization
        estimateCardHeight={80}
        renderCard={(row) => <div>{row.original.label}</div>}
      />,
    )
    expect(container.querySelector('.gridkit-card-virtual-spacer')).toBeInTheDocument()
  })

  it('activates virtual mode with fillParent (no explicit height)', () => {
    const { container } = render(
      <DataGridCard
        data={makeItems(1000)}
        columns={columns}
        getRowId={(item) => item.id}
        fillParent
        cardColumns={2}
        enableVirtualization
        estimateCardHeight={80}
        renderCard={(row) => <div>{row.original.label}</div>}
      />,
    )
    expect(container.querySelector('.gridkit-card-virtual-spacer')).toBeInTheDocument()
  })

  it('applies gridkit-frame--fill when fillContainer is set', () => {
    const { container } = render(
      <DataGridCard
        data={makeItems(5)}
        columns={columns}
        getRowId={(item) => item.id}
        fillContainer
        renderCard={(row) => <div>{row.original.label}</div>}
      />,
    )
    expect(container.querySelector('.gridkit-frame')).toHaveClass('gridkit-frame--fill')
  })

  it('sets data-fill-parent when fillParent is set', () => {
    const { container } = render(
      <DataGridCard
        data={makeItems(5)}
        columns={columns}
        getRowId={(item) => item.id}
        fillParent
        renderCard={(row) => <div>{row.original.label}</div>}
      />,
    )
    expect(container.querySelector('.gridkit-shell')).toHaveAttribute('data-fill-parent', 'true')
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

    expect(container.querySelector('.gridkit-frame-inner')?.getAttribute('data-scrollbar')).toBe('custom')
    expect(container.querySelector('.gridkit-scroll-frame')).toBeInTheDocument()
    expect(container.querySelector('.gridkit-scrollbar-track')).toBeInTheDocument()
  })

})
