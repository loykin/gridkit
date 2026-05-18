import type { Column, Header, HeaderGroup } from '@tanstack/react-table'
import type { HeaderGroupLayout } from '@/types'

export interface HeaderLayoutPlan<T extends object> {
  width: number
  height: number
  rowHeight: number
  cells: HeaderLayoutCell<T>[]
}

export interface HeaderLayoutCell<T extends object> {
  id: string
  header: Header<T, unknown>
  depth: number
  left: number
  top: number
  width: number
  height: number
  colSpan: number
  rowSpan: number
  isLeafHeader: boolean
  isPlaceholder: boolean
  render: boolean
  pin: false | 'left' | 'right'
  right?: number
  zIndex: number
}

interface BuildHeaderLayoutPlanInput<T extends object> {
  headerGroups: HeaderGroup<T>[]
  visibleLeafColumns: Column<T, unknown>[]
  layout: HeaderGroupLayout
  rowHeight: number
}

type PinRegion = false | 'left' | 'right'

interface RawHeaderEntry<T extends object> {
  header: Header<T, unknown>
  leafColumns: Column<T, unknown>[]
  leafColumnKey: string
}

function getHeaderLeafColumns<T extends object>(header: Header<T, unknown>): Column<T, unknown>[] {
  if (header.subHeaders.length > 0) {
    return header.subHeaders.flatMap((subHeader) => getHeaderLeafColumns(subHeader))
  }
  return [header.column]
}

function getRegion<T extends object>(columns: Column<T, unknown>[]): PinRegion {
  const firstPin = columns[0]?.getIsPinned() || false
  return columns.every((column) => (column.getIsPinned() || false) === firstPin)
    ? firstPin
    : false
}

function getLeafLeft<T extends object>(
  leafColumns: Column<T, unknown>[],
  offsets: Map<string, number>,
) {
  const first = leafColumns[0]
  if (!first) return 0
  return offsets.get(first.id) ?? 0
}

function getSameLeafColumnHeaders<T extends object>(
  entry: RawHeaderEntry<T>,
  entries: RawHeaderEntry<T>[],
) {
  return entries
    .filter((candidate) => candidate.leafColumnKey === entry.leafColumnKey)
    .map((candidate) => candidate.header)
}

function getVisualRange<T extends object>(
  entry: RawHeaderEntry<T>,
  entries: RawHeaderEntry<T>[],
  layout: HeaderGroupLayout,
) {
  const { header } = entry
  if (!header.isPlaceholder && header.subHeaders.length > 0) {
    return { topDepth: header.depth, rowSpan: 1 }
  }

  const sameHeaders = getSameLeafColumnHeaders(entry, entries)
  const nonPlaceholderHeaders = sameHeaders.filter((candidate) => !candidate.isPlaceholder)
  const hasPlaceholderChain = nonPlaceholderHeaders.length === 1 && sameHeaders.length > 1
  if (!hasPlaceholderChain) return { topDepth: header.depth, rowSpan: 1 }

  const depths = sameHeaders.map((candidate) => candidate.depth)
  const topDepth = Math.min(...depths)
  const bottomDepth = Math.max(...depths)
  const leafDepth = nonPlaceholderHeaders[0]?.depth ?? header.depth

  if (!header.isPlaceholder) {
    return {
      topDepth,
      rowSpan: layout === 'span' ? bottomDepth - topDepth + 1 : 1,
    }
  }

  return {
    topDepth: header.depth <= leafDepth ? header.depth + 1 : header.depth,
    rowSpan: 1,
  }
}

function getPinnedCoordinates<T extends object>({
  leafColumns,
  pin,
  fallbackLeft,
}: {
  leafColumns: Column<T, unknown>[]
  pin: PinRegion
  fallbackLeft: number
}) {
  if (pin === 'left') {
    return {
      left: leafColumns[0]?.getStart('left') ?? fallbackLeft,
      right: undefined,
      zIndex: 2,
    }
  }

  if (pin === 'right') {
    return {
      left: fallbackLeft,
      right: leafColumns[leafColumns.length - 1]?.getAfter('right') ?? 0,
      zIndex: 2,
    }
  }

  return {
    left: fallbackLeft,
    right: undefined,
    zIndex: 1,
  }
}

function splitByPinRegion<T extends object>(columns: Column<T, unknown>[]) {
  const segments: Array<{ pin: PinRegion, columns: Column<T, unknown>[] }> = []

  for (const column of columns) {
    const pin = column.getIsPinned() || false
    const last = segments[segments.length - 1]
    if (last && last.pin === pin) {
      last.columns.push(column)
    } else {
      segments.push({ pin, columns: [column] })
    }
  }

  return segments
}

export function buildHeaderLayoutPlan<T extends object>({
  headerGroups,
  visibleLeafColumns,
  layout,
  rowHeight,
}: BuildHeaderLayoutPlanInput<T>): HeaderLayoutPlan<T> {
  const offsets = new Map<string, number>()
  let totalWidth = 0

  for (const column of visibleLeafColumns) {
    offsets.set(column.id, totalWidth)
    totalWidth += column.getSize()
  }

  const rawEntries: RawHeaderEntry<T>[] = []

  for (const headerGroup of headerGroups) {
    for (const header of headerGroup.headers) {
      const leafColumns = getHeaderLeafColumns(header).filter((column) => column.getIsVisible())
      if (leafColumns.length === 0) continue
      rawEntries.push({
        header,
        leafColumns,
        leafColumnKey: leafColumns.map((column) => column.id).join('\u0000'),
      })
    }
  }

  const depthOffset = rawEntries.length > 0
    ? Math.min(...rawEntries.map((entry) => entry.header.depth))
    : 0
  const maxDepth = rawEntries.length > 0
    ? Math.max(...rawEntries.map((entry) => entry.header.depth))
    : headerGroups.length - 1
  const planHeight = (maxDepth - depthOffset + 1) * rowHeight
  const cells: HeaderLayoutCell<T>[] = []

  for (const entry of rawEntries) {
    const { header, leafColumns } = entry
    const { topDepth, rowSpan } = getVisualRange(entry, rawEntries, layout)
    const segments = splitByPinRegion(leafColumns)
    const isSplit = segments.length > 1

    for (const segment of segments) {
      const width = segment.columns.reduce((sum, column) => sum + column.getSize(), 0)
      const fallbackLeft = getLeafLeft(segment.columns, offsets)
      const pin = isSplit ? segment.pin : getRegion(segment.columns)
      const pinned = getPinnedCoordinates({ leafColumns: segment.columns, pin, fallbackLeft })
      const isLeafHeader = header.subHeaders.length === 0 && !header.isPlaceholder
      const isPlaceholder = header.isPlaceholder
      const render = !(layout === 'span' && isPlaceholder)

      const cell: HeaderLayoutCell<T> = {
        id: isSplit ? `${header.id}:${pin || 'center'}:${segment.columns[0]?.id ?? 'empty'}` : header.id,
        header,
        depth: header.depth - depthOffset,
        left: pinned.left,
        top: (topDepth - depthOffset) * rowHeight,
        width,
        height: rowSpan * rowHeight,
        colSpan: isSplit ? segment.columns.length : header.colSpan,
        rowSpan,
        isLeafHeader,
        isPlaceholder,
        render,
        pin,
        right: pinned.right,
        zIndex: pinned.zIndex,
      }

      cells.push(cell)
    }
  }

  return {
    width: totalWidth,
    height: planHeight,
    rowHeight,
    cells,
  }
}
