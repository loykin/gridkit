import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useGridKitUI } from '@/core/UIAdapterContext'

export interface ResolvedTableViewMetrics {
  headerHeight: number
  rowHeight?: number
  estimateRowHeight: number
}

const TableViewMetricsContext = createContext<ResolvedTableViewMetrics | null>(null)

interface TableViewMetricsProviderProps {
  headerHeight?: number
  rowHeight?: number
  estimateRowHeight?: number
  children: ReactNode
}

export function TableViewMetricsProvider({
  headerHeight,
  rowHeight,
  estimateRowHeight,
  children,
}: TableViewMetricsProviderProps) {
  const { appearance } = useGridKitUI()
  const adapterMetrics = appearance?.metrics
  const resolvedHeaderHeight = headerHeight ?? adapterMetrics?.headerHeight ?? 36
  const resolvedRowHeight = rowHeight ?? adapterMetrics?.rowHeight
  const resolvedEstimateRowHeight = estimateRowHeight ?? resolvedRowHeight ?? 33
  const value = useMemo<ResolvedTableViewMetrics>(
    () => ({
      headerHeight: resolvedHeaderHeight,
      rowHeight: resolvedRowHeight,
      estimateRowHeight: resolvedEstimateRowHeight,
    }),
    [resolvedEstimateRowHeight, resolvedHeaderHeight, resolvedRowHeight],
  )

  return <TableViewMetricsContext value={value}>{children}</TableViewMetricsContext>
}

export function useTableViewMetrics(): ResolvedTableViewMetrics {
  const metrics = useContext(TableViewMetricsContext)
  if (!metrics) {
    throw new Error('useTableViewMetrics must be used within TableViewMetricsProvider')
  }
  return metrics
}
