import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'
import type { Row } from '@tanstack/react-table'

export type GridKitRovingFocusOrientation = 'vertical' | 'horizontal' | 'grid'

export interface GridKitRovingFocusOptions<T extends object> {
  rows: Row<T>[]
  enabled?: boolean
  initialIndex?: number
  orientation?: GridKitRovingFocusOrientation
  /** Number of columns for orientation="grid". Defaults to 1. */
  columnCount?: number
  /** Wrap arrow movement at the first/last item. Defaults to false. */
  loop?: boolean
  onFocusedIndexChange?: (index: number, row: Row<T> | undefined) => void
}

export interface GridKitRovingFocusItemOptions {
  ref?: React.Ref<HTMLElement>
  onFocus?: React.FocusEventHandler<HTMLElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}

export interface GridKitRovingFocusItemProps {
  ref?: React.RefCallback<HTMLElement>
  tabIndex?: number
  'data-focused'?: 'true'
  onFocus?: React.FocusEventHandler<HTMLElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return
  if (typeof ref === 'function') {
    ref(value)
    return
  }
  ref.current = value
}

export function useGridKitRovingFocus<T extends object>({
  rows,
  enabled = true,
  initialIndex = 0,
  orientation = 'vertical',
  columnCount = 1,
  loop = false,
  onFocusedIndexChange,
}: GridKitRovingFocusOptions<T>) {
  const maxIndex = Math.max(rows.length - 1, 0)
  const [focusedIndex, setFocusedIndexState] = useState(() => clamp(initialIndex, 0, maxIndex))
  const itemRefs = useRef(new Map<number, HTMLElement>())

  const focusItem = useCallback((index: number) => {
    requestAnimationFrame(() => {
      itemRefs.current.get(index)?.focus({ preventScroll: true })
    })
  }, [])

  const setFocusedIndexInternal = useCallback((nextIndex: number, shouldFocus: boolean) => {
    const next = loop && rows.length > 0
      ? ((nextIndex % rows.length) + rows.length) % rows.length
      : clamp(nextIndex, 0, maxIndex)
    setFocusedIndexState(next)
    onFocusedIndexChange?.(next, rows[next])
    if (shouldFocus) focusItem(next)
  }, [focusItem, loop, maxIndex, onFocusedIndexChange, rows])

  const setFocusedIndex = useCallback((nextIndex: number) => {
    setFocusedIndexInternal(nextIndex, true)
  }, [setFocusedIndexInternal])

  useEffect(() => {
    setFocusedIndexState((current) => {
      const next = clamp(current, 0, maxIndex)
      if (next === current) return current
      onFocusedIndexChange?.(next, rows[next])
      return next
    })
  }, [maxIndex, onFocusedIndexChange, rows])

  const moveByKey = useCallback((event: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (!enabled || rows.length === 0) return false

    const cols = Math.max(1, columnCount)
    let next: number | null = null

    if (event.key === 'Home') next = orientation === 'grid' ? index - (index % cols) : 0
    else if (event.key === 'End') next = orientation === 'grid' ? Math.min(index - (index % cols) + cols - 1, maxIndex) : maxIndex
    else if (event.key === 'PageUp') next = index - cols * 5
    else if (event.key === 'PageDown') next = index + cols * 5
    else if (orientation === 'horizontal') {
      if (event.key === 'ArrowLeft') next = index - 1
      else if (event.key === 'ArrowRight') next = index + 1
    } else if (orientation === 'grid') {
      if (event.key === 'ArrowLeft') next = index - 1
      else if (event.key === 'ArrowRight') next = index + 1
      else if (event.key === 'ArrowUp') next = index - cols
      else if (event.key === 'ArrowDown') next = index + cols
    } else {
      if (event.key === 'ArrowUp') next = index - 1
      else if (event.key === 'ArrowDown') next = index + 1
    }

    if (next == null) return false
    event.preventDefault()
    setFocusedIndexInternal(next, true)
    return true
  }, [columnCount, enabled, maxIndex, orientation, rows.length, setFocusedIndexInternal])

  const getItemProps = useCallback((
    index: number,
    options: GridKitRovingFocusItemOptions = {},
  ): GridKitRovingFocusItemProps => {
    if (!enabled) return {}
    const focused = index === focusedIndex

    return {
      ref: (node) => {
        if (node) itemRefs.current.set(index, node)
        else itemRefs.current.delete(index)
        assignRef(options.ref, node)
      },
      tabIndex: focused ? 0 : -1,
      'data-focused': focused ? 'true' : undefined,
      onFocus: (event) => {
        setFocusedIndexInternal(index, false)
        options.onFocus?.(event)
      },
      onKeyDown: (event) => {
        const handled = moveByKey(event, index)
        if (!handled) options.onKeyDown?.(event)
      },
    }
  }, [enabled, focusedIndex, moveByKey, setFocusedIndexInternal])

  return {
    focusedIndex: enabled ? focusedIndex : undefined,
    focusedRow: enabled ? rows[focusedIndex] : undefined,
    setFocusedIndex,
    getItemProps,
  }
}
