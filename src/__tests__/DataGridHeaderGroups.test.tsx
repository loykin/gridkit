import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataGrid } from '@/DataGrid'
import type { DataGridColumnDef } from '@/types'

interface Employee {
  id: string
  name: string
  department: string
  role: string
  salary: number
}

const data: Employee[] = [
  { id: '1', name: 'Ada', department: 'Engineering', role: 'Lead', salary: 150000 },
  { id: '2', name: 'Grace', department: 'Product', role: 'Manager', salary: 130000 },
]

const columns: DataGridColumnDef<Employee>[] = [
  {
    id: 'identity',
    header: 'Identity',
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'department', header: 'Department' },
    ],
  },
  {
    id: 'work',
    header: 'Work',
    columns: [
      { accessorKey: 'role', header: 'Role' },
      { accessorKey: 'salary', header: 'Salary' },
    ],
  },
]

const columnsWithUngrouped: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID' },
  {
    id: 'work',
    header: 'Work',
    columns: [
      { accessorKey: 'role', header: 'Role' },
      { accessorKey: 'salary', header: 'Salary' },
    ],
  },
]

describe('DataGrid header groups', () => {
  it('renders grouped headers and leaf headers', () => {
    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Identity' })).toHaveAttribute('aria-colspan', '2')
    expect(screen.getByRole('columnheader', { name: 'Work' })).toHaveAttribute('aria-colspan', '2')
    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Salary/ })).toBeInTheDocument()
  })

  it('sizes group headers to the sum of their leaf columns', () => {
    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        columnSizing={{
          name: 120,
          department: 160,
          role: 140,
          salary: 100,
        }}
      />,
    )

    const identityHeader = screen.getByRole('columnheader', { name: 'Identity' })
    const workHeader = screen.getByRole('columnheader', { name: 'Work' })

    expect(identityHeader).toHaveStyle({ width: '280px' })
    expect(workHeader).toHaveStyle({ width: '240px' })
    expect(container.querySelector('[data-col-id="identity"]')).not.toBeInTheDocument()
  })

  it('keeps sorting on leaf headers only', () => {
    const sortingStates: unknown[] = []

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        onSortingChange={(sorting) => sortingStates.push(sorting)}
      />,
    )

    fireEvent.click(screen.getByRole('columnheader', { name: 'Identity' }))
    expect(sortingStates).toEqual([])

    fireEvent.click(screen.getByRole('columnheader', { name: /Salary/ }))
    expect(sortingStates[sortingStates.length - 1]).toEqual([{ id: 'salary', desc: true }])
  })

  it('shows resize handles on leaf headers only', () => {
    const { container } = render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
      />,
    )

    const identityHeader = screen.getByRole('columnheader', { name: 'Identity' })
    const salaryHeader = screen.getByRole('columnheader', { name: /Salary/ })

    expect(identityHeader.querySelector('.dg-resize-handle')).not.toBeInTheDocument()
    expect(salaryHeader.querySelector('.dg-resize-handle')).toBeInTheDocument()
    expect(container.querySelectorAll('.dg-resize-handle').length).toBe(4)
  })

  it('renders padded placeholders by default', () => {
    const { container } = render(
      <DataGrid
        data={data}
        columns={columnsWithUngrouped}
        getRowId={(row) => row.id}
      />,
    )

    const idHeader = screen.getByRole('columnheader', { name: /ID/ })
    const placeholder = container.querySelector('[data-placeholder="true"]')

    expect(placeholder).toBeInTheDocument()
    expect(idHeader).toHaveStyle({ top: '0px', height: '36px' })
    expect(placeholder).toHaveStyle({ top: '36px' })
  })

  it('spans ungrouped leaf headers and hides placeholders in span layout', () => {
    const { container } = render(
      <DataGrid
        data={data}
        columns={columnsWithUngrouped}
        getRowId={(row) => row.id}
        headerGroupLayout="span"
      />,
    )

    const idHeader = screen.getByRole('columnheader', { name: /ID/ })
    const workHeader = screen.getByRole('columnheader', { name: 'Work' })

    expect(container.querySelector('[data-placeholder="true"]')).not.toBeInTheDocument()
    expect(idHeader).toHaveAttribute('aria-rowspan', '2')
    expect(idHeader).toHaveStyle({ top: '0px' })
    expect(idHeader).toHaveStyle({ height: '72px' })
    expect(workHeader).toHaveAttribute('aria-colspan', '2')
  })

  it('keeps sorting active in span layout', () => {
    const sortingStates: unknown[] = []

    render(
      <DataGrid
        data={data}
        columns={columnsWithUngrouped}
        getRowId={(row) => row.id}
        headerGroupLayout="span"
        onSortingChange={(sorting) => sortingStates.push(sorting)}
      />,
    )

    fireEvent.click(screen.getByRole('columnheader', { name: /Salary/ }))
    expect(sortingStates[sortingStates.length - 1]).toEqual([{ id: 'salary', desc: true }])
  })

  it('keeps filter controls and column menus on leaf headers in span layout', () => {
    render(
      <DataGrid
        data={data}
        columns={columnsWithUngrouped}
        getRowId={(row) => row.id}
        headerGroupLayout="span"
        enableColumnFilters
        filterDisplay="icon"
        enableColumnMenu
      />,
    )

    expect(screen.queryByRole('button', { name: 'Column menu for work' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Column menu for salary' })).toBeInTheDocument()
  })

  it('keeps reorder handles on leaf headers in span layout', () => {
    const { container } = render(
      <DataGrid
        data={data}
        columns={columnsWithUngrouped}
        getRowId={(row) => row.id}
        headerGroupLayout="span"
        enableColumnReordering
      />,
    )

    const idHeader = screen.getByRole('columnheader', { name: /ID/ })
    const workHeader = screen.getByRole('columnheader', { name: 'Work' })

    expect(idHeader.querySelector('[data-reorder-handle="true"]')).toBeInTheDocument()
    expect(workHeader.querySelector('[data-reorder-handle="true"]')).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-reorder-handle="true"]').length).toBe(3)
  })

  it('keeps pinned ungrouped leaf headers spanned in span layout', () => {
    render(
      <DataGrid
        data={data}
        columns={columnsWithUngrouped}
        getRowId={(row) => row.id}
        headerGroupLayout="span"
        initialPinning={{ left: ['id'] }}
        enableColumnPinning
      />,
    )

    const idHeader = screen.getByRole('columnheader', { name: /ID/ })

    expect(idHeader).toHaveAttribute('data-pinned', 'left')
    expect(idHeader).toHaveAttribute('aria-rowspan', '2')
    expect(idHeader).toHaveStyle({ top: '0px', height: '72px' })
  })
})
