import { useEffect } from 'react'
import type React from 'react'
import type { Table } from '@tanstack/react-table'
import type { DataGridProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { DataGridShell } from '@/core/DataGridShell'
import { IconsProvider } from '@/core/IconsContext'
import { LabelsProvider } from '@/core/LabelsContext'

interface DataGridPropsWithRef<T extends object> extends DataGridProps<T> {
  /** Ref populated with the TanStack Table instance after first render */
  tableRef?: React.RefObject<Table<T> | null>
}

export function DataGrid<T extends object>(props: DataGridPropsWithRef<T>) {
  const {
    error,
    headerLeft,
    headerRight,
    footer,
    pagination,
    tableRef,
    icons,
  } = props

  const { wrapperRef, containerRef, table, rows, isSized, measure, queryState } = useDataGridBase({
    ...props,
    pagination,
  })
  const effectiveError = error ?? (props.queryMode === 'backend' ? queryState.error : null)
  const effectiveIsLoading = props.isLoading ?? (props.queryMode === 'backend' && (queryState.isHydrating || queryState.isQuerying))

  useEffect(() => {
    if (tableRef) {
      ;(tableRef as React.MutableRefObject<Table<T> | null>).current = table
      return () => {
        ;(tableRef as React.MutableRefObject<Table<T> | null>).current = null
      }
    }
  }, [table, tableRef])

  return (
    <LabelsProvider labels={props.labels}>
      <IconsProvider icons={icons}>
        <DataGridShell
          {...props}
          wrapperRef={wrapperRef}
          containerRef={containerRef}
          table={table}
          rows={rows}
          isSized={isSized}
          measure={measure}
          error={effectiveError}
          isLoading={effectiveIsLoading}
          headerLeft={headerLeft}
          headerRight={headerRight}
          footer={footer}
        />
      </IconsProvider>
    </LabelsProvider>
  )
}
