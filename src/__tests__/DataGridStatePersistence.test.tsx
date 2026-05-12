import { act, render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import type { Table } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'
import { DataGrid } from '@/DataGrid'
import type { DataGridColumnDef, GridKitPersistedState } from '@/types'

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

describe('DataGrid statePersistence', () => {
  it('loads persisted column sizing from an adapter', async () => {
    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        tableKey="people"
        statePersistence={{
          load: () => ({ columnSizing: { name: 222 } }),
          save: () => {},
          debounce: 0,
        }}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveStyle({ width: '222px' })
    })
  })

  it('saves changed column sizing through the adapter', async () => {
    const tableRef = createRef<Table<Person> | null>()
    const save = vi.fn(
      (_tableKey: string, _state: Partial<GridKitPersistedState>) => {},
    )

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        tableRef={tableRef}
        tableKey="people"
        statePersistence={{
          save,
          debounce: 0,
          include: ['columnSizing'],
        }}
      />,
    )

    await waitFor(() => expect(tableRef.current).not.toBeNull())

    act(() => {
      tableRef.current!.setColumnSizing({ name: 180 })
    })

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith('people', { columnSizing: { name: 180 } })
    })
  })
})
