import React, { createContext, useContext } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Filter,
  GripVertical,
  Loader2,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import type { DataGridIcons } from '@/types'

// ── Defaults (lucide-react) ────────────────────────────────────────────────────

export const defaultIcons: Required<DataGridIcons> = {
  sortAsc:          <ArrowUp />,
  sortDesc:         <ArrowDown />,
  sortNone:         <ArrowUpDown />,
  filter:           <Filter />,
  filterRange:      <SlidersHorizontal />,
  clearFilter:      <X />,
  rowActions:       <MoreHorizontal />,
  columnVisibility: <Columns3 />,
  loading:          <Loader2 className="dg-spinner" />,
  pageFirst:        <ChevronsLeft />,
  pagePrev:         <ChevronLeft />,
  pageNext:         <ChevronRight />,
  pageLast:         <ChevronsRight />,
  search:           <Search />,
  treeExpand:       <ChevronRight />,
  treeCollapse:     <ChevronDown />,
  dragHandle:       <GripVertical />,
}

// ── Context ────────────────────────────────────────────────────────────────────

const IconsCtx = createContext<Required<DataGridIcons>>(defaultIcons)

export function IconsProvider({
  icons,
  children,
}: {
  icons?: DataGridIcons
  children: React.ReactNode
}) {
  const merged = icons ? { ...defaultIcons, ...icons } : defaultIcons
  return <IconsCtx value={merged}>{children}</IconsCtx>
}

export function useIcons(): Required<DataGridIcons> {
  return useContext(IconsCtx)
}
