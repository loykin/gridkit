import { useMemo, useState } from 'react'
import {
  ColumnVisibilityDropdown,
  DataGrid,
  DataGridPaginationBar,
  GlobalSearch,
  GridKitBadge,
} from '@loykin/gridkit'
import type { DataGridColumnDef, GridKitUIAdapter } from '@loykin/gridkit'
import { createMuiAdapter } from '@loykin/gridkit/adapters/mui'
import { createShadcnAdapter } from '@loykin/gridkit/adapters/shadcn'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import * as Shadcn from '../components/shadcn-ui'
import { SMALL_DATA, type Employee } from '../data/employees'

const shadcnComponents = {
  Badge: Shadcn.Badge,
  Button: Shadcn.Button,
  Input: Shadcn.Input,
  Checkbox: Shadcn.Checkbox,
  Popover: Shadcn.Popover,
  PopoverTrigger: Shadcn.PopoverTrigger,
  PopoverContent: Shadcn.PopoverContent,
  Select: Shadcn.Select,
  SelectTrigger: Shadcn.SelectTrigger,
  SelectValue: Shadcn.SelectValue,
  SelectContent: Shadcn.SelectContent,
  SelectItem: Shadcn.SelectItem,
}

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'name', header: 'Name', meta: { flex: 1.5, filterType: 'text' } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.2, filterType: 'select' } },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1.4, filterType: 'text' } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1, filterType: 'multi-select' },
    cell: ({ row }) => (
      <GridKitBadge
        variant={
          row.original.status === 'Active'
            ? 'default'
            : row.original.status === 'Terminated'
              ? 'destructive'
              : 'secondary'
        }
      >
        {row.original.status}
      </GridKitBadge>
    ),
  },
]

type AdapterChoice = 'default' | 'shadcn' | 'mui'
type AdapterDensity = 'compact' | 'standard' | 'comfortable'
type MuiPreset = 'data-grid' | 'table'
type MuiTableSize = 'small' | 'medium'
type MuiMode = 'light' | 'dark'

const adapterOptions: Array<{
  id: AdapterChoice
  label: string
  description: string
}> = [
  {
    id: 'default',
    label: 'GridKit default',
    description: 'GridKit structure, tokens, controls, and built-in popover.',
  },
  {
    id: 'shadcn',
    label: 'shadcn/ui',
    description: 'shadcn frame, tokens, typography, and local Radix components.',
  },
  {
    id: 'mui',
    label: 'Material UI',
    description: 'MUI Theme palette, shape, typography, elevation, and components.',
  },
]

export function UIAdaptersTab() {
  const [choice, setChoice] = useState<AdapterChoice>('shadcn')
  const [density, setDensity] = useState<AdapterDensity>('standard')
  const [muiPreset, setMuiPreset] = useState<MuiPreset>('data-grid')
  const [muiTableSize, setMuiTableSize] = useState<MuiTableSize>('small')
  const [muiMode, setMuiMode] = useState<MuiMode>('light')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const active = adapterOptions.find((option) => option.id === choice)!
  const materialTheme = useMemo(() => createTheme({
    palette: {
      mode: muiMode,
      primary: {
        main: muiMode === 'dark' ? '#90caf9' : '#1976d2',
      },
    },
    shape: {
      borderRadius: 6,
    },
  }), [muiMode])
  const adapter = useMemo<GridKitUIAdapter | undefined>(() => {
    if (choice === 'shadcn') {
      return createShadcnAdapter(shadcnComponents, { density })
    }
    if (choice === 'mui') {
      return muiPreset === 'table'
        ? createMuiAdapter(materialTheme, {
            preset: 'table',
            size: muiTableSize,
          })
        : createMuiAdapter(materialTheme, {
            preset: 'data-grid',
            density,
          })
    }
    return undefined
  }, [choice, density, materialTheme, muiPreset, muiTableSize])

  const checkboxConfig = useMemo(() => ({
    getRowId: (row: Employee) => String(row.id),
    selectedIds,
    onSelectAll: (rows: Array<{ original: Employee }>, checked: boolean) => {
      setSelectedIds(checked ? new Set(rows.map((row) => String(row.original.id))) : new Set())
    },
    onSelectOne: (rowId: string, checked: boolean) => {
      setSelectedIds((current) => {
        const next = new Set(current)
        if (checked) next.add(rowId)
        else next.delete(rowId)
        return next
      })
    },
  }), [selectedIds])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold">UI adapter boundary</p>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          GridKit keeps the table DOM, virtualization, and state. Each adapter supplies both
          its design-system components and a scoped appearance recipe for the whole grid.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {adapterOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setChoice(option.id)}
            className={`rounded-md border p-3 text-left transition-colors ${
              choice === option.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            <span className="block text-sm font-medium">{option.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
          </button>
        ))}
      </div>

      <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        Active: <strong className="text-foreground">{active.label}</strong>
        {' · '}
        {choice === 'mui' && muiPreset === 'table' ? (
          <>Size: <strong className="text-foreground">{muiTableSize}</strong></>
        ) : (
          <>Density: <strong className="text-foreground">{density}</strong></>
        )}
        {' · '}
        Selected rows: <strong className="text-foreground">{selectedIds.size}</strong>
      </div>

      {choice === 'mui' && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">MUI preset</span>
            {(['data-grid', 'table'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMuiPreset(value)}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  muiPreset === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                {value === 'data-grid' ? 'MUI X DataGrid' : 'Material UI Table'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">MUI mode</span>
            {(['light', 'dark'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMuiMode(value)}
                className={`rounded-md border px-3 py-1.5 text-xs capitalize ${
                  muiMode === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}

      {choice !== 'default' && !(choice === 'mui' && muiPreset === 'table') && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Adapter density</span>
          {(['compact', 'standard', 'comfortable'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDensity(value)}
              className={`rounded-md border px-3 py-1.5 text-xs capitalize ${
                density === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      {choice === 'mui' && muiPreset === 'table' && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">MUI Table size</span>
          {(['small', 'medium'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMuiTableSize(value)}
              className={`rounded-md border px-3 py-1.5 text-xs capitalize ${
                muiTableSize === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      <ThemeProvider theme={materialTheme}>
        <DataGrid
          key={`${choice}-${density}-${muiPreset}-${muiTableSize}-${muiMode}`}
          data={SMALL_DATA}
          columns={columns}
          getRowId={(row) => String(row.id)}
          uiAdapter={adapter}
          checkboxConfig={checkboxConfig}
          enableColumnFilters
          filterDisplay="icon"
          enableColumnMenu
          enableColumnPinning
          searchableColumns={['name', 'department', 'role', 'status']}
          pagination={{ pageSize: 5 }}
          headerLeft={(table) => <GlobalSearch table={table} placeholder={`Search with ${active.label}…`} />}
          headerRight={(table) => <ColumnVisibilityDropdown table={table} />}
          footer={(table) => (
            <DataGridPaginationBar table={table} pageSizes={[5, 10, 20]} />
          )}
          tableHeight={420}
        />
      </ThemeProvider>
    </div>
  )
}
