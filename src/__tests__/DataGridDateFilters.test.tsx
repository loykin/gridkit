import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataGrid } from '@/DataGrid'
import type { DataGridColumnDef } from '@/types'

interface EventRow {
  id: string
  name: string
  day: string
  timestamp: string
}

const data: EventRow[] = [
  { id: '1', name: 'Alpha', day: '2024-01-01', timestamp: '2024-01-01T09:00:00' },
  { id: '2', name: 'Beta', day: '2024-02-15', timestamp: '2024-01-01T12:30:00' },
  { id: '3', name: 'Gamma', day: '2024-03-20', timestamp: '2024-01-01T18:00:00' },
]

describe('DataGrid date filters', () => {
  it('filters by exact date', () => {
    const columns: DataGridColumnDef<EventRow>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'day', header: 'Day', meta: { filterType: 'date' } },
    ]

    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        enableColumnFilters
      />,
    )

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2024-02-15' } })

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument()
  })

  it('filters by date range inside grouped columns', () => {
    const columns: DataGridColumnDef<EventRow>[] = [
      {
        id: 'event',
        header: 'Event',
        columns: [
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'day', header: 'Day', meta: { filterType: 'date-range' } },
        ],
      },
    ]

    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        enableColumnFilters
      />,
    )

    const dateInputs = Array.from(container.querySelectorAll('input[type="date"]')) as HTMLInputElement[]
    fireEvent.change(dateInputs[0]!, { target: { value: '2024-02-01' } })
    fireEvent.change(dateInputs[1]!, { target: { value: '2024-02-28' } })

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument()
  })

  it('filters by exact datetime', () => {
    const columns: DataGridColumnDef<EventRow>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'timestamp', header: 'Timestamp', meta: { filterType: 'datetime' } },
    ]

    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        enableColumnFilters
      />,
    )

    const dateTimeInput = container.querySelector('input[type="datetime-local"]') as HTMLInputElement
    fireEvent.change(dateTimeInput, { target: { value: '2024-01-01T12:30:00' } })

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument()
  })

  it('filters by datetime range', () => {
    const columns: DataGridColumnDef<EventRow>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'timestamp', header: 'Timestamp', meta: { filterType: 'datetime-range' } },
    ]

    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        enableColumnFilters
      />,
    )

    const dateTimeInputs = Array.from(container.querySelectorAll('input[type="datetime-local"]')) as HTMLInputElement[]
    fireEvent.change(dateTimeInputs[0]!, { target: { value: '2024-01-01T10:00:00' } })
    fireEvent.change(dateTimeInputs[1]!, { target: { value: '2024-01-01T13:00:00' } })

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument()
  })
})
