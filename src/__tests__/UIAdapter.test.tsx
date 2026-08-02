import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import {
  MuiGridKitProvider,
  createMuiAdapter,
} from '@/adapters/mui'
import {
  ColumnVisibilityDropdown,
  DataGrid,
  DataGridAgentChat,
  DataGridCard,
  DataGridChat,
  DataGridDrag,
  DataGridInfinity,
  DataGridList,
  DataGridPaginationBar,
  GlobalSearch,
  GridKitBadge,
  GridKitProvider,
  defaultUIAdapter,
} from '@/index'
import type { DataGridColumnDef, GridKitUIAdapter } from '@/index'

interface TestRow {
  id: string
  name: string
}

const rows: TestRow[] = [
  { id: '1', name: 'Ada' },
  { id: '2', name: 'Grace' },
]

const columns: DataGridColumnDef<TestRow>[] = [
  { accessorKey: 'name', header: 'Name' },
]

const DefaultButton = defaultUIAdapter.Button
const DefaultBadge = defaultUIAdapter.Badge
const DefaultInput = defaultUIAdapter.Input
const DefaultCheckbox = defaultUIAdapter.Checkbox
const DefaultSelect = defaultUIAdapter.Select
const DefaultPopoverContent = defaultUIAdapter.PopoverContent

const adapter: GridKitUIAdapter = {
  appearance: {
    className: 'adapter-theme',
    style: { '--gridkit-primary': 'rgb(1, 2, 3)' } as React.CSSProperties,
  },
  Badge: (props) => <DefaultBadge data-adapter="badge" {...props} />,
  Button: (props) => <DefaultButton data-adapter="button" {...props} />,
  Input: (props) => <DefaultInput data-adapter="input" {...props} />,
  Checkbox: (props) => (
    <span data-adapter="checkbox">
      <DefaultCheckbox {...props} />
    </span>
  ),
  Select: (props) => (
    <span data-adapter="select">
      <DefaultSelect {...props} />
    </span>
  ),
  PopoverContent: ({ className, ...props }) => (
    <DefaultPopoverContent
      className={['adapter-popover', className].filter(Boolean).join(' ')}
      {...props}
    />
  ),
}

describe('GridKit UI adapter', () => {
  it('replaces controls while GridKit keeps the grid structure', () => {
    render(
      <DataGrid
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        uiAdapter={adapter}
        checkboxConfig={{
          getRowId: (row) => row.id,
          selectedIds: new Set(),
          onSelectAll: () => undefined,
          onSelectOne: () => undefined,
        }}
        searchableColumns={['name']}
        pagination={{ pageSize: 1 }}
        headerLeft={(table) => <GlobalSearch table={table} />}
        headerRight={(table) => (
          <>
            <GridKitBadge>Active</GridKitBadge>
            <ColumnVisibilityDropdown table={table} />
          </>
        )}
        footer={(table) => <DataGridPaginationBar table={table} pageSizes={[1, 2]} />}
      />,
    )

    expect(document.querySelector('[data-adapter="button"]')).toBeInTheDocument()
    expect(document.querySelector('[data-adapter="badge"]')).toBeInTheDocument()
    expect(document.querySelector('[data-adapter="input"]')).toBeInTheDocument()
    expect(document.querySelector('[data-adapter="checkbox"]')).toBeInTheDocument()
    expect(document.querySelector('[data-adapter="select"]')).toBeInTheDocument()
    expect(document.querySelector('.gridkit-shell')).toHaveClass('adapter-theme')
    expect(document.querySelector('.gridkit-shell')).toHaveStyle({
      '--gridkit-primary': 'rgb(1, 2, 3)',
    })
    expect(screen.getByRole('grid', { name: 'Data grid' })).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Choose visible columns'))
    expect(document.querySelector('.adapter-popover')).toBeInTheDocument()
  })

  it('lets per-grid root styles override the appearance recipe', () => {
    render(
      <DataGrid
        data={rows}
        columns={columns}
        uiAdapter={adapter}
        styles={{ root: { '--gridkit-primary': 'rgb(4, 5, 6)' } as React.CSSProperties }}
      />,
    )

    expect(document.querySelector('.gridkit-shell')).toHaveStyle({
      '--gridkit-primary': 'rgb(4, 5, 6)',
    })
  })

  it('uses adapter metrics for grid geometry and lets explicit props override them', () => {
    const metricsAdapter: GridKitUIAdapter = {
      appearance: {
        metrics: {
          headerHeight: 56,
          rowHeight: 52,
          selectionColumnWidth: 64,
          cellPaddingX: 10,
          controlHeight: 40,
          checkboxSize: 24,
          footerHeight: 56,
        },
      },
    }

    const { rerender } = render(
      <DataGrid
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        uiAdapter={metricsAdapter}
        checkboxConfig={{
          getRowId: (row) => row.id,
          selectedIds: new Set(),
          onSelectAll: () => undefined,
          onSelectOne: () => undefined,
        }}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Select all rows' })).toHaveStyle({
      width: '64px',
    })
    expect(screen.getByRole('row', { name: /Select row 1/ })).toHaveStyle({
      minHeight: '52px',
    })
    expect(document.querySelector('.gridkit-header-row')).toHaveStyle({
      height: '56px',
    })
    expect(document.querySelector('.gridkit-shell')).toHaveStyle({
      '--gridkit-cell-padding-x': '10px',
      '--gridkit-checkbox-size': '24px',
    })

    rerender(
      <DataGrid
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        uiAdapter={metricsAdapter}
        headerHeight={42}
        rowHeight={38}
        checkboxConfig={{
          getRowId: (row) => row.id,
          selectedIds: new Set(),
          onSelectAll: () => undefined,
          onSelectOne: () => undefined,
          columnWidth: 50,
        }}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Select all rows' })).toHaveStyle({
      width: '50px',
    })
    expect(screen.getByRole('row', { name: /Select row 1/ })).toHaveStyle({
      minHeight: '38px',
    })
    expect(document.querySelector('.gridkit-header-row')).toHaveStyle({
      height: '42px',
    })
  })

  it('applies adapter geometry from a parent GridKitProvider', () => {
    const providerAdapter: GridKitUIAdapter = {
      appearance: {
        metrics: {
          headerHeight: 48,
          rowHeight: 44,
          selectionColumnWidth: 58,
          cellPaddingX: 12,
          controlHeight: 36,
          checkboxSize: 18,
          footerHeight: 48,
        },
      },
    }

    render(
      <GridKitProvider adapter={providerAdapter}>
        <DataGrid
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          checkboxConfig={{
            getRowId: (row) => row.id,
            selectedIds: new Set(),
            onSelectAll: () => undefined,
            onSelectOne: () => undefined,
          }}
        />
      </GridKitProvider>,
    )

    expect(screen.getByRole('columnheader', { name: 'Select all rows' })).toHaveStyle({
      width: '58px',
    })
    expect(screen.getByRole('row', { name: /Select row 1/ })).toHaveStyle({
      minHeight: '44px',
    })
  })

  it('does not let undefined nested metrics erase parent adapter values', () => {
    const parentAdapter: GridKitUIAdapter = {
      appearance: {
        metrics: {
          headerHeight: 48,
          rowHeight: 44,
          selectionColumnWidth: 58,
          cellPaddingX: 12,
          controlHeight: 36,
          checkboxSize: 18,
          footerHeight: 48,
        },
      },
    }
    const childAdapter: GridKitUIAdapter = {
      appearance: {
        metrics: {
          headerHeight: 50,
          rowHeight: undefined,
        },
      },
    }

    render(
      <GridKitProvider adapter={parentAdapter}>
        <DataGrid
          data={rows}
          columns={columns}
          uiAdapter={childAdapter}
          getRowId={(row) => row.id}
          checkboxConfig={{
            getRowId: (row) => row.id,
            selectedIds: new Set(),
            onSelectAll: () => undefined,
            onSelectOne: () => undefined,
          }}
        />
      </GridKitProvider>,
    )

    expect(document.querySelector('.gridkit-header-row')).toHaveStyle({
      height: '50px',
    })
    expect(screen.getByRole('row', { name: /Select row 1/ })).toHaveStyle({
      minHeight: '44px',
    })
    expect(screen.getByRole('columnheader', { name: 'Select all rows' })).toHaveStyle({
      width: '58px',
    })
  })

  it('maps native MUI DataGrid and Table sizing options to adapter metrics', () => {
    const theme = createTheme()
    const dataGridAdapter = createMuiAdapter(theme, {
      preset: 'data-grid',
      density: 'compact',
      columnHeaderHeight: 50,
      rowHeight: 42,
    })
    const tableAdapter = createMuiAdapter(theme, {
      preset: 'table',
      size: 'small',
    })

    expect(dataGridAdapter.appearance?.className).toContain('gridkit-theme-mui-data-grid')
    expect(dataGridAdapter.appearance?.metrics).toMatchObject({
      headerHeight: 50,
      rowHeight: 42,
      selectionColumnWidth: 56,
    })
    expect(tableAdapter.appearance?.className).toContain('gridkit-theme-mui-table')
    expect(tableAdapter.appearance?.metrics).toMatchObject({
      headerHeight: 40,
      rowHeight: 36,
      cellPaddingX: 16,
    })
  })

  it('reads the active MUI theme through MuiGridKitProvider', () => {
    const theme = createTheme({
      palette: {
        primary: {
          main: '#00695c',
        },
      },
    })

    render(
      <ThemeProvider theme={theme}>
        <MuiGridKitProvider
          preset="data-grid"
          density="compact"
          columnHeaderHeight={46}
        >
          <DataGrid data={rows} columns={columns} />
        </MuiGridKitProvider>
      </ThemeProvider>,
    )

    expect(document.querySelector('.gridkit-shell')).toHaveClass(
      'gridkit-theme-mui-data-grid',
    )
    expect(document.querySelector('.gridkit-shell')).toHaveStyle({
      '--gridkit-primary': '#00695c',
    })
    expect(document.querySelector('.gridkit-header-row')).toHaveStyle({
      height: '46px',
    })
  })

  it('applies the MUI dark theme foreground color to the grid shell', () => {
    const theme = createTheme({ palette: { mode: 'dark' } })

    render(
      <DataGrid
        data={rows}
        columns={columns}
        uiAdapter={createMuiAdapter(theme)}
      />,
    )

    expect(document.querySelector('.gridkit-shell')).toHaveStyle({
      '--gridkit-foreground': theme.palette.text.primary,
      color: theme.palette.text.primary,
    })
  })

  it('keeps MUI density defaults when MuiGridKitProvider receives partial metrics', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <MuiGridKitProvider
          density="comfortable"
          metrics={{ rowHeight: 44 }}
        >
          <DataGrid
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            checkboxConfig={{
              getRowId: (row) => row.id,
              selectedIds: new Set(),
              onSelectAll: () => undefined,
              onSelectOne: () => undefined,
            }}
          />
        </MuiGridKitProvider>
      </ThemeProvider>,
    )

    expect(document.querySelector('.gridkit-header-row')).toHaveStyle({
      height: '64px',
    })
    expect(screen.getByRole('row', { name: /Select row 1/ })).toHaveStyle({
      minHeight: '44px',
    })
    expect(screen.getByRole('columnheader', { name: 'Select all rows' })).toHaveStyle({
      width: '72px',
    })
  })

  it('forwards native input attributes to the MUI html input', () => {
    const MuiInputComponent = createMuiAdapter().Input!

    render(
      <MuiInputComponent
        aria-label="MUI datetime"
        className="native-input-class"
        type="datetime-local"
        step={1}
        min="2026-01-01T00:00"
        max="2026-12-31T23:59"
        maxLength={24}
        data-input-probe="native"
      />,
    )

    const input = screen.getByLabelText('MUI datetime')
    expect(input).toHaveAttribute('step', '1')
    expect(input).toHaveAttribute('min', '2026-01-01T00:00')
    expect(input).toHaveAttribute('max', '2026-12-31T23:59')
    expect(input).toHaveAttribute('maxlength', '24')
    expect(input).toHaveAttribute('data-input-probe', 'native')
    expect(input).toHaveClass('native-input-class')
    expect(input.closest('.MuiFormControl-root')).not.toHaveAttribute('step')
    expect(input.closest('.MuiFormControl-root')).not.toHaveClass('native-input-class')
  })

  it('keeps MUI Select controlled and forwards supported passthrough props', () => {
    const MuiSelectComponent = createMuiAdapter().Select!
    const onBlur = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <>
        <span id="mui-select-description">Status description</span>
        <MuiSelectComponent
          aria-label="MUI select"
          aria-labelledby="mui-select-label"
          aria-describedby="mui-select-description"
          data-select-probe="native"
          value="active"
          defaultValue="inactive"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          onBlur={onBlur}
        />
      </>,
    )

    const select = screen.getByRole('combobox', { name: 'MUI select' })
    fireEvent.blur(select)
    expect(select).toHaveAttribute('aria-labelledby', 'mui-select-label')
    expect(select).toHaveAttribute('aria-describedby', 'mui-select-description')
    expect(document.querySelector('[data-select-probe="native"]')).toBeInTheDocument()
    expect(onBlur).toHaveBeenCalled()
    expect(
      consoleError.mock.calls.some((call) => String(call[0]).includes('controlled')),
    ).toBe(false)
    consoleError.mockRestore()
  })

  it('does not forward unsupported multiple mode to MUI Select', () => {
    const MuiSelectComponent = createMuiAdapter().Select!
    const unsupportedProps = {
      multiple: true,
      value: 'active',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    }

    render(<MuiSelectComponent {...unsupportedProps} />)

    expect(screen.getByRole('combobox')).not.toHaveAttribute(
      'aria-multiselectable',
      'true',
    )
  })

  it('anchors a controlled MUI fallback popover before its first click', async () => {
    const mui = createMuiAdapter()
    const MuiPopover = mui.Popover!
    const MuiTrigger = mui.PopoverTrigger!
    const MuiContent = mui.PopoverContent!

    render(
      <MuiPopover open>
        <MuiTrigger>Open</MuiTrigger>
        <MuiContent>Controlled content</MuiContent>
      </MuiPopover>,
    )

    await waitFor(() => {
      expect(screen.getByText('Controlled content')).toBeInTheDocument()
    })
  })

  it('falls back to default controls for missing adapter slots', () => {
    render(
      <DataGrid
        data={rows}
        columns={columns}
        uiAdapter={{ Button: adapter.Button }}
        pagination={{ pageSize: 1 }}
        footer={(table) => <DataGridPaginationBar table={table} pageSizes={[1, 2]} />}
      />,
    )

    expect(document.querySelector('[data-adapter="button"]')).toBeInTheDocument()
    expect(document.querySelector('select.gridkit-select')).toBeInTheDocument()
  })

  it('preserves the legacy effective selection column width without an adapter', () => {
    render(
      <DataGrid
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        checkboxConfig={{
          getRowId: (row) => row.id,
          selectedIds: new Set(),
          onSelectAll: () => undefined,
          onSelectOne: () => undefined,
        }}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Select all rows' })).toHaveStyle({
      width: '60px',
    })
  })

  it('preserves legacy raw menu items without an adapter', () => {
    render(
      <DataGrid
        data={rows}
        columns={columns}
        enableColumnMenu
      />,
    )

    fireEvent.click(screen.getByLabelText('Column menu for name'))
    expect(screen.getByRole('button', { name: 'Sort Ascending' })).not.toHaveClass(
      'gridkit-btn',
    )
  })

  it('keeps adapter appearance opt-in across the main view families', () => {
    const renderers = [
      (uiAdapter?: GridKitUIAdapter) => render(
        <DataGrid data={rows} columns={columns} uiAdapter={uiAdapter} />,
      ),
      (uiAdapter?: GridKitUIAdapter) => render(
        <DataGridDrag
          data={rows}
          columns={columns}
          uiAdapter={uiAdapter}
          getRowId={(row) => row.id}
          onRowReorder={() => undefined}
        />,
      ),
      (uiAdapter?: GridKitUIAdapter) => render(
        <DataGridInfinity
          data={rows}
          columns={columns}
          uiAdapter={uiAdapter}
        />,
      ),
      (uiAdapter?: GridKitUIAdapter) => render(
        <DataGridCard
          data={rows}
          columns={columns}
          uiAdapter={uiAdapter}
          renderCard={(row) => <div>{row.original.name}</div>}
        />,
      ),
      (uiAdapter?: GridKitUIAdapter) => render(
        <DataGridList
          data={rows}
          columns={columns}
          uiAdapter={uiAdapter}
          renderItem={(row) => <div>{row.original.name}</div>}
        />,
      ),
      (uiAdapter?: GridKitUIAdapter) => render(
        <DataGridChat
          data={rows}
          columns={columns}
          uiAdapter={uiAdapter}
          renderMessage={(row) => <div>{row.original.name}</div>}
        />,
      ),
      (uiAdapter?: GridKitUIAdapter) => render(
        <DataGridAgentChat
          uiAdapter={uiAdapter}
          events={[
            { id: '1', type: 'message', role: 'assistant', content: 'Done' },
          ]}
        />,
      ),
    ]

    for (const renderView of renderers) {
      const defaultView = renderView()
      expect(defaultView.container.querySelector('.gridkit-shell')).toHaveClass(
        'gridkit-shell',
      )
      expect(defaultView.container.querySelector('.adapter-theme')).not.toBeInTheDocument()
      defaultView.unmount()

      const adaptedView = renderView(adapter)
      expect(adaptedView.container.querySelector('.gridkit-shell')).toHaveClass(
        'adapter-theme',
      )
      adaptedView.unmount()
    }
  })
})
