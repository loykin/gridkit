import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ColumnSizingState } from '@tanstack/react-table'
import type { ColumnSizingMode, DataGridColumnDef } from '@/types'

interface UseColumnSizingOptions<T extends object> {
  columns: DataGridColumnDef<T>[]
  containerRef: React.RefObject<HTMLDivElement | null>
  mode: ColumnSizingMode
  initialSizing?: ColumnSizingState
}

interface SizingState {
  sizing: ColumnSizingState
  isSized: boolean
}

/**
 * Row count threshold above which the virtualizer is automatically enabled,
 * when the table has a fixed height (tableHeight is set).
 */
export const VIRTUAL_THRESHOLD = 100

export function useColumnSizing<T extends object>({
  columns,
  containerRef,
  mode,
  initialSizing,
}: UseColumnSizingOptions<T>) {
  const userResized = useRef(new Set<string>())
  const lastComputed = useRef<ColumnSizingState>({})
  const lastContainerWidth = useRef<number>(0)
  const lastFlexFixedWidth = useRef<number | null>(null)
  const hasSized = useRef(false)
  const [state, setState] = useState<SizingState>(() => {
    if (initialSizing && Object.keys(initialSizing).length > 0) {
      // Mark externally provided columns as user-resized so measure() won't overwrite them
      for (const colId of Object.keys(initialSizing)) {
        userResized.current.add(colId)
      }
      return { sizing: initialSizing, isSized: false }
    }
    return { sizing: {}, isSized: false }
  })

  // Expose a setSizing that matches Dispatch<SetStateAction<ColumnSizingState>>
  // so TanStack's onColumnSizingChange can call it directly.
  const setSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>> = useCallback(
    (updater) => {
      setState((prev) => ({
        ...prev,
        sizing: typeof updater === 'function' ? updater(prev.sizing) : updater,
      }))
    },
    [],
  )

  // Stable refs so measure() doesn't need to re-subscribe ResizeObserver
  const columnsRef = useRef(columns)
  columnsRef.current = columns
  const modeRef = useRef(mode)
  modeRef.current = mode
  const sizingRef = useRef(state.sizing)
  sizingRef.current = state.sizing

  /**
   * Measure rendered cells via DOM (AG Grid style).
   * Called after each render by DataGridTableView (via onMeasureColumns prop).
   *
   * For 'auto' mode: reads scrollWidth of [data-col-id] cells.
   *   - scrollWidth > offsetWidth  →  content is truncated, column should be wider
   *   - Columns only grow, never shrink (maxSeen tracking)
   *
   * For 'flex' mode: distributes remaining container width proportionally.
   * For 'fixed' mode: marks isSized without changing widths.
   */
  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const containerWidth = container.clientWidth
    if (containerWidth === 0) return
    const prevContainerWidth = lastContainerWidth.current
    lastContainerWidth.current = containerWidth

    const cols = columnsRef.current
    const currentSizing = sizingRef.current
    const m = modeRef.current

    // ── Detect user drag-overrides ─────────────────────────────────────────
    for (const [colId, currentSize] of Object.entries(currentSizing)) {
      const computed = lastComputed.current[colId]
      if (computed !== undefined && computed !== currentSize) {
        userResized.current.add(colId)
      }
    }

    const newSizing: ColumnSizingState = {}

    // ── Auto mode: DOM-based measurement ──────────────────────────────────
    // Reads scrollWidth of rendered [data-col-id] cells.
    // scrollWidth returns actual content width even for overflow:hidden elements,
    // so we can detect truncated content without canvas measurement.
    if (m === 'auto') {
      const cells = container.querySelectorAll<HTMLElement>('[data-col-id]')
      cells.forEach((cell) => {
        const colId = cell.dataset.colId
        if (!colId || userResized.current.has(colId)) return
        const w = cell.scrollWidth
        // Only expand, never shrink — take max of current and measured
        const current = newSizing[colId] ?? currentSizing[colId] ?? 0
        if (w > current) newSizing[colId] = w
      })
    }

    // ── Flex columns: distribute remaining space ───────────────────────────
    const getColId = (col: DataGridColumnDef<T>) =>
      (col.id ?? (col as { accessorKey?: string }).accessorKey) as string

    const flexCols = cols.filter((col) => col.meta?.flex != null)
    if (flexCols.length > 0) {
      const containerWidthChanged = Math.abs(containerWidth - prevContainerWidth) > 1
      const anyUserResized = flexCols.some((col) => userResized.current.has(getColId(col)))

      const freeCols = flexCols.filter((col) => !userResized.current.has(getColId(col)))
      const totalFlex = freeCols.reduce((sum, col) => sum + col.meta!.flex!, 0)
      const fixedWidth = cols
        .filter((col) => col.meta?.flex == null)
        .reduce((sum, col) => {
          const colId = getColId(col)
          const colDefSize = typeof col.size === 'number' ? col.size : 150
          return sum + (newSizing[colId] ?? currentSizing[colId] ?? colDefSize)
        }, 0)
      const userResizedFlexWidth = flexCols
        .filter((col) => userResized.current.has(getColId(col)))
        .reduce((sum, col) => sum + (currentSizing[getColId(col)] ?? 0), 0)
      const fixedWidthChanged =
        lastFlexFixedWidth.current !== null && lastFlexFixedWidth.current !== fixedWidth

      if (anyUserResized && !containerWidthChanged) {
        // User manually resized a flex column and container unchanged: freeze flex sizes.
      } else if (!containerWidthChanged && hasSized.current && !fixedWidthChanged) {
        // Container unchanged and fixed column sizes stable: skip redistribution.
      } else {
        lastFlexFixedWidth.current = fixedWidth
        const availableWidth = Math.max(0, containerWidth - fixedWidth - userResizedFlexWidth)
        let distributed = 0
        for (let i = 0; i < freeCols.length; i++) {
          const col = freeCols[i]!
          const colId = getColId(col)
          if (!colId) continue
          const flex = col.meta!.flex!
          const minW = col.meta?.minWidth ?? 60
          const isLast = i === freeCols.length - 1
          const w = isLast
            ? Math.max(minW, availableWidth - distributed)
            : Math.max(minW, Math.floor((flex / totalFlex) * availableWidth))
          newSizing[colId] = w
          distributed += w
        }
      }
    }

    const sizingChanged =
      Object.keys(newSizing).length > 0 &&
      Object.entries(newSizing).some(([id, w]) => currentSizing[id] !== w)
    const firstTime = !hasSized.current

    if (sizingChanged || firstTime) {
      if (sizingChanged) Object.assign(lastComputed.current, newSizing)
      if (firstTime) hasSized.current = true
      setState((prev) => ({
        sizing: sizingChanged ? { ...prev.sizing, ...newSizing } : prev.sizing,
        isSized: true,
      }))
    }
  }, [containerRef])

  // ── ResizeObserver: container width changes (debounced) ────────────────
  const roTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const width = entry.contentRect.width
      if (width === 0 || Math.abs(width - lastContainerWidth.current) < 1) return
      if (roTimerRef.current) clearTimeout(roTimerRef.current)
      roTimerRef.current = setTimeout(measure, 150)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      if (roTimerRef.current) clearTimeout(roTimerRef.current)
    }
  }, [measure, containerRef])

  const resetSizing = useCallback(() => {
    userResized.current.clear()
    lastComputed.current = {}
    lastContainerWidth.current = 0
    lastFlexFixedWidth.current = null
    hasSized.current = false
    setState({ sizing: {}, isSized: false })
    measure()
  }, [measure])

  return { sizing: state.sizing, isSized: state.isSized, setSizing, resetSizing, measure }
}
