import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataGrid } from '@/DataGrid'
import type { DataGridColumnDef } from '@/types'

interface Person {
  id: string
  name: string
  age: number
}

const data: Person[] = [
  { id: 'a', name: 'Ada', age: 36 },
  { id: 'b', name: 'Grace', age: 36 },
  { id: 'c', name: 'Linus', age: 55 },
]

const columns: DataGridColumnDef<Person>[] = [
  { accessorKey: 'age', header: 'Age' },
  { accessorKey: 'name', header: 'Name' },
]

describe('DataGrid sorting', () => {
  it('keeps single-sort behavior by default', () => {
    const sortingStates: unknown[] = []

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        onSortingChange={(sorting) => sortingStates.push(sorting)}
      />,
    )

    fireEvent.click(screen.getByRole('columnheader', { name: /Age/ }))
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }), { shiftKey: true })

    expect(sortingStates[sortingStates.length - 1]).toEqual([{ id: 'name', desc: false }])
  })

  it('supports Shift+click multi-sort when enabled', () => {
    const sortingStates: unknown[] = []

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        enableMultiSort
        onSortingChange={(sorting) => sortingStates.push(sorting)}
      />,
    )

    fireEvent.click(screen.getByRole('columnheader', { name: /Age/ }))
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }), { shiftKey: true })

    expect(sortingStates[sortingStates.length - 1]).toEqual([
      { id: 'age', desc: true },
      { id: 'name', desc: false },
    ])
  })
})
