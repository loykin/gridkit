import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Table } from '@/core/engine/tanstack/gridKitTable'
import { DataGrid } from '@/DataGrid'
import type { DataGridColumnDef } from '@/types'

interface Person {
  id: string
  name: string
}

const data: Person[] = [
  { id: '1', name: 'Ada' },
  { id: '2', name: 'Grace' },
]

const columns: DataGridColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name' },
]

const checkboxConfig = {
  getRowId: (row: Person) => row.id,
  selectedIds: new Set<string>(),
  onSelectAll: vi.fn(),
  onSelectOne: vi.fn(),
}

describe('selection column header controls', () => {
  it('hides selection options without disabling pinning capability', () => {
    const tableRef = createRef<Table<Person> | null>()

    render(
      <DataGrid
        data={data}
        columns={columns}
        tableRef={tableRef}
        enableColumnMenu
        enableColumnPinning
        initialPinning={{ start: ['__select__'], end: [] }}
        checkboxConfig={checkboxConfig}
      />,
    )

    const selectionColumn = tableRef.current?.getColumn('__select__')
    expect(screen.queryByLabelText('Column menu for __select__')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Column menu for name')).toBeInTheDocument()
    expect(selectionColumn?.getCanPin()).toBe(true)
    expect(selectionColumn?.getIsPinned()).toBe('start')
  })

  it('hides only the standalone selection pin control', () => {
    render(
      <DataGrid
        data={data}
        columns={columns}
        enableColumnPinning
        checkboxConfig={checkboxConfig}
      />,
    )

    expect(screen.queryByLabelText('Pin options for __select__')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Pin options for name')).toBeInTheDocument()
  })
})
