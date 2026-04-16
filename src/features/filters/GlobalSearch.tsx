import { useEffect, useState } from 'react'
import type { Table } from '@tanstack/react-table'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props<T extends object> {
  table: Table<T>
  placeholder?: string
  className?: string
}

export function GlobalSearch<T extends object>({
  table,
  placeholder = 'Search…',
  className,
}: Props<T>) {
  const [value, setValue] = useState(String(table.getState().globalFilter ?? ''))

  // Sync when external code changes globalFilter (e.g. clear-all button)
  const externalFilter = String(table.getState().globalFilter ?? '')
  useEffect(() => {
    setValue(externalFilter)
  }, [externalFilter])

  useEffect(() => {
    const timeout = setTimeout(() => table.setGlobalFilter(value || undefined), 200)
    return () => clearTimeout(timeout)
  }, [value, table])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 pr-7 text-xs w-52"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            setValue('')
            table.setGlobalFilter(undefined)
          }}
          className="absolute right-0.5 top-1/2 -translate-y-1/2"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
