import { createContext, useContext, useMemo } from 'react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { Badge as DefaultBadge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
import { Button as DefaultButton } from '@/components/ui/button'
import type { ButtonProps } from '@/components/ui/button'
import { Checkbox as DefaultCheckbox } from '@/components/ui/checkbox'
import type { CheckboxProps } from '@/components/ui/checkbox'
import { Input as DefaultInput } from '@/components/ui/input'
import type { InputProps } from '@/components/ui/input'
import {
  Popover as DefaultPopover,
  PopoverContent as DefaultPopoverContent,
  PopoverTrigger as DefaultPopoverTrigger,
} from '@/components/ui/popover'
import type {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from '@/components/ui/popover'
import { Select as DefaultSelect } from '@/components/ui/select'
import type { SelectProps } from '@/components/ui/select'

export interface GridKitUIAppearance {
  className?: string
  style?: CSSProperties
  metrics?: Partial<GridKitUIMetrics>
}

export interface GridKitUIMetrics {
  headerHeight: number
  rowHeight: number
  selectionColumnWidth: number
  cellPaddingX: number
  controlHeight: number
  checkboxSize: number
  footerHeight: number
}

interface GridKitUIComponentAdapter {
  Badge?: ComponentType<BadgeProps>
  Button?: ComponentType<ButtonProps>
  Input?: ComponentType<InputProps>
  Checkbox?: ComponentType<CheckboxProps>
  Select?: ComponentType<SelectProps>
  Popover?: ComponentType<PopoverProps>
  PopoverTrigger?: ComponentType<PopoverTriggerProps>
  PopoverContent?: ComponentType<PopoverContentProps>
}

export interface GridKitUIAdapter extends GridKitUIComponentAdapter {
  appearance?: GridKitUIAppearance
}

export interface ResolvedGridKitUIAdapter extends Required<GridKitUIComponentAdapter> {
  appearance?: GridKitUIAppearance
}

export function mergeGridKitMetrics(
  ...sources: Array<Partial<GridKitUIMetrics> | undefined>
): Partial<GridKitUIMetrics> | undefined {
  const merged: Partial<GridKitUIMetrics> = {}
  let hasValue = false

  for (const source of sources) {
    if (!source) continue
    for (const key of Object.keys(source) as Array<keyof GridKitUIMetrics>) {
      const value = source[key]
      if (value !== undefined) {
        merged[key] = value
        hasValue = true
      }
    }
  }

  return hasValue ? merged : undefined
}

export const defaultUIAdapter: ResolvedGridKitUIAdapter = {
  Badge: DefaultBadge,
  Button: DefaultButton,
  Input: DefaultInput,
  Checkbox: DefaultCheckbox,
  Select: DefaultSelect,
  Popover: DefaultPopover,
  PopoverTrigger: DefaultPopoverTrigger,
  PopoverContent: DefaultPopoverContent,
}

const UIAdapterContext = createContext<ResolvedGridKitUIAdapter>(defaultUIAdapter)

function mergeUIAdapter(
  parent: ResolvedGridKitUIAdapter,
  adapter?: GridKitUIAdapter,
): ResolvedGridKitUIAdapter {
  if (!adapter) return parent

  const appearance = adapter.appearance
    ? {
        ...parent.appearance,
        ...adapter.appearance,
        style: {
          ...parent.appearance?.style,
          ...adapter.appearance.style,
        },
        metrics: mergeGridKitMetrics(
          parent.appearance?.metrics,
          adapter.appearance.metrics,
        ),
      }
    : parent.appearance

  return { ...parent, ...adapter, appearance }
}

export function useResolvedGridKitUI(
  adapter?: GridKitUIAdapter,
): ResolvedGridKitUIAdapter {
  const parent = useContext(UIAdapterContext)
  return useMemo(() => mergeUIAdapter(parent, adapter), [adapter, parent])
}

export function GridKitProvider({
  adapter,
  children,
}: {
  adapter?: GridKitUIAdapter
  children: ReactNode
}) {
  const value = useResolvedGridKitUI(adapter)

  return <UIAdapterContext value={value}>{children}</UIAdapterContext>
}

export function useGridKitUI(): ResolvedGridKitUIAdapter {
  return useContext(UIAdapterContext)
}
