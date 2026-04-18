import { useEffect, useState } from 'react'
import type { Table } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'

interface Props<T extends object> {
  table: Table<T>
  placeholder?: string
  className?: string
}

export function GlobalSearch<T extends object>({ table, placeholder = 'Search…', className }: Props<T>) {
  const icons = useIcons()
  const [value, setValue] = useState(String(table.getState().globalFilter ?? ''))

  const externalFilter = String(table.getState().globalFilter ?? '')
  useEffect(() => { setValue(externalFilter) }, [externalFilter])

  useEffect(() => {
    const timeout = setTimeout(() => table.setGlobalFilter(value || undefined), 200)
    return () => clearTimeout(timeout)
  }, [value, table])

  return (
    <div className={className} style={{ position: 'relative' }}>
      <span
        style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          width: 14, height: 14, color: 'var(--dg-muted-foreground)', pointerEvents: 'none',
          display: 'flex', alignItems: 'center',
        }}
      >
        {icons.search}
      </span>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: 30, paddingRight: 28, width: 208 }}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => { setValue(''); table.setGlobalFilter(undefined) }}
          style={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)' }}
        >
          {icons.clearFilter}
        </Button>
      )}
    </div>
  )
}
