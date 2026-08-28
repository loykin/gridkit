import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GridKitTable } from '@/GridKitTable'
import { GridKitAutoTable } from '@/GridKitAutoTable'
import type { GridKitTableDef, GridKitTablePayload, GridKitQueryExecutor, GridKitQueryPrepare } from '@/types'

describe('GridKitTable', () => {
  it('hydrates once for column inference, then queries again via backend mode', async () => {
    const executor: GridKitQueryExecutor = vi.fn(async (_query, { params }) => {
      if (Object.keys(params).length === 0) {
        return [{ id: 1, name: 'Ada' }]
      }
      return [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }]
    })
    const def: GridKitTableDef = { type: 'gridkit-table', query: { table: 'people' } }

    render(<GridKitTable def={def} executor={executor} />)

    await waitFor(() => expect(screen.getByText('Ada')).toBeInTheDocument())
    // First call is the column-inference hydrate with empty params, second is
    // DataGrid's own backend-mode mount query with real QueryParams.
    await waitFor(() => expect(executor).toHaveBeenCalledTimes(2))
    expect(executor).toHaveBeenNthCalledWith(1, { table: 'people' }, expect.objectContaining({ params: {} }))
    await waitFor(() => expect(screen.getByText('Grace')).toBeInTheDocument())
  })

  it('passes an AbortSignal to the executor', async () => {
    const executor: GridKitQueryExecutor = vi.fn(async (_query, { signal }) => {
      expect(signal).toBeInstanceOf(AbortSignal)
      return [{ id: 1, name: 'Ada' }]
    })
    const def: GridKitTableDef = { type: 'gridkit-table', query: {} }

    render(<GridKitTable def={def} executor={executor} />)

    await waitFor(() => expect(executor).toHaveBeenCalled())
  })

  it('forwards prepare() the real QueryParams on the backend-mode re-query', async () => {
    const prepare: GridKitQueryPrepare<unknown> = vi.fn((query, _params) => query)
    const executor: GridKitQueryExecutor = vi.fn(async () => [{ id: 1, name: 'Ada' }])
    const def: GridKitTableDef = { type: 'gridkit-table', query: { table: 'people' } }

    render(<GridKitTable def={def} executor={executor} prepare={prepare} />)

    await waitFor(() => expect(prepare).toHaveBeenCalledTimes(2))
    expect(prepare).toHaveBeenNthCalledWith(1, { table: 'people' }, {})
    const secondCallParams = vi.mocked(prepare).mock.calls[1][1]
    expect(secondCallParams).toMatchObject({ filters: [], sort: [] })
  })

  it('recreates the query pipeline when queryKey changes', async () => {
    const executor: GridKitQueryExecutor = vi.fn(async () => [{ id: 1, name: 'Ada' }])
    const def: GridKitTableDef = { type: 'gridkit-table', query: { table: 'people' } }

    const { rerender } = render(<GridKitTable def={def} executor={executor} queryKey={['people']} />)
    await waitFor(() => expect(executor).toHaveBeenCalledTimes(2))

    rerender(<GridKitTable def={def} executor={executor} queryKey={['orders']} />)
    await waitFor(() => expect(executor).toHaveBeenCalledTimes(4))
  })

  it('shows renderLoading before the first hydrate resolves and renderError on failure', async () => {
    const executor: GridKitQueryExecutor = vi.fn(async () => {
      throw new Error('boom')
    })
    const def: GridKitTableDef = { type: 'gridkit-table', query: {} }

    render(
      <GridKitTable
        def={def}
        executor={executor}
        renderLoading={() => <div>Loading…</div>}
        renderError={(err) => <div>Error: {(err as Error).message}</div>}
      />,
    )

    expect(screen.getByText('Loading…')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Error: boom')).toBeInTheDocument())
  })
})

describe('GridKitAutoTable semantic column types', () => {
  it('renders currency, percentage, datetime, url, and badge cells', async () => {
    const payload: GridKitTablePayload = {
      type: 'gridkit-table',
      columns: [
        { key: 'price', label: 'Price', type: 'currency', currency: 'EUR' },
        { key: 'rate', label: 'Rate', type: 'percentage' },
        { key: 'at', label: 'At', type: 'datetime' },
        { key: 'site', label: 'Site', type: 'url' },
        { key: 'state', label: 'State', type: 'badge' },
      ],
      rows: [
        { price: 12.5, rate: 0.42, at: '2024-01-01T10:00:00Z', site: 'https://example.com', state: 'active' },
      ],
    }

    render(<GridKitAutoTable payload={payload} />)

    expect(await screen.findByText('42%')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://example.com' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
    expect(screen.getByText((text) => text.includes('12.50') || text.includes('12,50'))).toBeInTheDocument()
  })

  it('does not render a link for an unsafe url scheme', async () => {
    const payload: GridKitTablePayload = {
      type: 'gridkit-table',
      columns: [{ key: 'site', label: 'Site', type: 'url' }],
      rows: [{ site: 'javascript:alert(1)' }],
    }

    render(<GridKitAutoTable payload={payload} />)

    expect(await screen.findByText('javascript:alert(1)')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
