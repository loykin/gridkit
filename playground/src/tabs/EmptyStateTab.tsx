import { useState } from 'react'
import { DataGrid } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.5 } },
  { accessorKey: 'name', header: 'Name', meta: { flex: 2 } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.5 } },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1.5 } },
  { accessorKey: 'status', header: 'Status', meta: { flex: 1 } },
]

function SearchXIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <path d="m8 8 6 6" />
      <path d="m14 8-6 6" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

export function EmptyStateTab() {
  const [showHeader, setShowHeader] = useState(true)
  const [emptyMode, setEmptyMode] = useState<'string' | 'custom'>('string')
  const [hasData, setHasData] = useState(false)

  const customEmptyContent = (
    <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
      <SearchXIcon />
      <p className="text-sm font-medium">No employees found</p>
      <p className="text-xs">Try adjusting your search or filter criteria.</p>
      <button
        className="mt-1 px-3 py-1.5 text-xs font-medium rounded border border-border hover:bg-muted transition-colors"
        onClick={() => setHasData(true)}
      >
        Load sample data
      </button>
    </div>
  )

  return (
    <section className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex items-center gap-6 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">showHeader</span>
          <button
            onClick={() => setShowHeader((v) => !v)}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              showHeader
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {showHeader ? 'true' : 'false'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">emptyContent</span>
          {(['string', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setEmptyMode(mode)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                emptyMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {mode === 'string' ? 'emptyMessage (string)' : 'emptyContent (ReactNode)'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">data</span>
          <button
            onClick={() => setHasData((v) => !v)}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              hasData
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {hasData ? 'with data' : 'empty []'}
          </button>
        </div>
      </div>

      {/* showHeader demo */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          showHeader={String(showHeader)} —{' '}
          {showHeader ? '헤더 표시' : '헤더 숨김 (header-less 테이블)'}
        </p>
        <DataGrid
          data={hasData ? ALL_DATA.slice(0, 8) : []}
          columns={columns}
          showHeader={showHeader}
          emptyMessage="No employees"
          emptyContent={emptyMode === 'custom' ? customEmptyContent : undefined}
          tableHeight={showHeader ? undefined : 'auto'}
          tableKey="empty-state-demo"
        />
      </div>

      {/* emptyContent side-by-side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">emptyMessage (string)</p>
          <DataGrid
            data={[]}
            columns={columns}
            emptyMessage="No employees found"
            tableKey="empty-string"
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">emptyContent (ReactNode)</p>
          <DataGrid
            data={[]}
            columns={columns}
            emptyContent={
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <InboxIcon />
                <p className="text-sm font-medium">Nothing here yet</p>
                <p className="text-xs">Add your first employee to get started.</p>
              </div>
            }
            tableKey="empty-custom"
          />
        </div>
      </div>
    </section>
  )
}
