import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataGridList } from '@/DataGridList'
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
    label: `Item ${index}`,
  }))
}

function setScrollMetrics(
  element: HTMLElement,
  metrics: { scrollHeight: number; clientHeight: number; scrollTop: number },
) {
  Object.defineProperty(element, 'scrollHeight', {
    get: () => metrics.scrollHeight,
    configurable: true,
  })
  Object.defineProperty(element, 'clientHeight', {
    get: () => metrics.clientHeight,
    configurable: true,
  })
  Object.defineProperty(element, 'scrollTop', {
    get: () => metrics.scrollTop,
    set: (value: number) => {
      metrics.scrollTop = value
    },
    configurable: true,
  })
}

describe('DataGridList virtualization', () => {
  it('renders all rows by default', () => {
    render(
      <DataGridList
        data={makeItems(20)}
        columns={columns}
        getRowId={(item) => item.id}
        renderItem={(row) => <div>{row.original.label}</div>}
      />,
    )

    expect(screen.getByText('Item 0')).toBeInTheDocument()
    expect(screen.getByText('Item 19')).toBeInTheDocument()
  })

  it('renders a bounded window when virtualization is enabled', async () => {
    const { container } = render(
      <DataGridList
        data={makeItems(1000)}
        columns={columns}
        getRowId={(item) => item.id}
        containerHeight={240}
        enableVirtualization
        estimateRowHeight={40}
        overscan={1}
        renderItem={(row) => <div>{row.original.label}</div>}
      />,
    )

    const listContainer = container.querySelector('.dg-list-container') as HTMLElement
    setScrollMetrics(listContainer, { scrollHeight: 40000, clientHeight: 240, scrollTop: 0 })

    expect(container.querySelector('.dg-list-items')?.getAttribute('data-virtualized')).toBe('true')
    await waitFor(() => expect(screen.getByText('Item 0')).toBeInTheDocument())
    expect(screen.queryByText('Item 999')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.dg-list-item').length).toBeLessThan(1000)
  })
})
