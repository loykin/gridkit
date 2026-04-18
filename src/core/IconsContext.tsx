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
  sortAsc:          <ArrowUp size={12} />,
  sortDesc:         <ArrowDown size={12} />,
  sortNone:         <ArrowUpDown size={12} />,
  filter:           <Filter size={13} />,
  filterRange:      <SlidersHorizontal size={13} />,
  clearFilter:      <X size={13} />,
  rowActions:       <MoreHorizontal size={14} />,
  columnVisibility: <Columns3 size={14} />,
  loading:          <Loader2 size={16} className="dg-spinner" />,
  pageFirst:        <ChevronsLeft size={14} />,
  pagePrev:         <ChevronLeft size={14} />,
  pageNext:         <ChevronRight size={14} />,
  pageLast:         <ChevronsRight size={14} />,
  search:           <Search size={14} />,
  treeExpand:       <ChevronRight size={14} />,
  treeCollapse:     <ChevronDown size={14} />,
  dragHandle:       <GripVertical size={14} />,
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
