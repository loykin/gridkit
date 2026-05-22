import { describe, expect, it } from 'vitest'
import type { Column } from '@tanstack/react-table'
import { buildTableLayoutModel } from '../buildTableLayoutModel'

interface Row {
  id: number
}

function column(id: string, size: number, pinned?: 'left' | 'right'): Column<Row> {
  return {
    id,
    getSize: () => size,
    getIsPinned: () => pinned ?? false,
  } as Column<Row>
}

describe('buildTableLayoutModel', () => {
  it('builds a center-only layout when no columns are pinned', () => {
    const model = buildTableLayoutModel({
      visibleLeafColumns: [column('name', 120), column('status', 80)],
      tableWidthMode: 'fill-last',
      enableColumnReordering: true,
      hasVScroll: false,
    })

    expect(model.regions.left.columns).toHaveLength(0)
    expect(model.regions.center.columns.map((col) => col.id)).toEqual(['name', 'status'])
    expect(model.regions.right.columns).toHaveLength(0)
    expect(model.centerWidth).toBe(200)
    expect(model.gridTemplateColumns).toBe('0px minmax(0, 1fr) 0px')
    expect(model.hasLeftRegion).toBe(false)
    expect(model.hasRightRegion).toBe(false)
    expect(model.regions.center.tableWidthMode).toBe('fill-last')
    expect(model.regions.center.reorderEnabled).toBe(true)
    expect(model.regions.center.measureRows).toBe(true)
  })

  it('pins left columns with independent table width and no reorder or measurement', () => {
    const model = buildTableLayoutModel({
      visibleLeafColumns: [column('status', 90, 'left'), column('name', 140)],
      tableWidthMode: 'spacer',
      enableColumnReordering: true,
      hasVScroll: false,
    })

    expect(model.regions.left.columns.map((col) => col.id)).toEqual(['status'])
    expect(model.regions.left.width).toBe(90)
    expect(model.regions.left.tableWidthMode).toBe('independent')
    expect(model.regions.left.reorderEnabled).toBe(false)
    expect(model.regions.left.measureRows).toBe(false)
    expect(model.horizontalScrollbarStyle).toEqual({ height: 8, marginLeft: 90, marginRight: 0 })
  })

  it('pins right columns and reserves vertical scrollbar space when needed', () => {
    const model = buildTableLayoutModel({
      visibleLeafColumns: [column('name', 140), column('department', 160, 'right')],
      tableWidthMode: 'spacer',
      enableColumnReordering: false,
      hasVScroll: true,
    })

    expect(model.regions.right.columns.map((col) => col.id)).toEqual(['department'])
    expect(model.regions.right.width).toBe(160)
    expect(model.hasRightRegion).toBe(true)
    expect(model.horizontalScrollbarStyle).toEqual({ height: 8, marginLeft: 0, marginRight: 168 })
  })

  it('adds vertical scrollbar width to the horizontal scrollbar right margin only when visible', () => {
    const input = {
      visibleLeafColumns: [column('name', 140), column('department', 160, 'right')],
      tableWidthMode: 'spacer' as const,
      enableColumnReordering: false,
    }

    const withoutVScroll = buildTableLayoutModel({ ...input, hasVScroll: false })
    const withVScroll = buildTableLayoutModel({ ...input, hasVScroll: true })

    expect(withoutVScroll.horizontalScrollbarStyle.marginRight).toBe(160)
    expect(withVScroll.horizontalScrollbarStyle.marginRight).toBe(168)
  })

  it('supports left, center, and right regions together', () => {
    const model = buildTableLayoutModel({
      visibleLeafColumns: [
        column('status', 90, 'left'),
        column('score', 80),
        column('name', 140, 'right'),
      ],
      tableWidthMode: 'spacer',
      enableColumnReordering: true,
      hasVScroll: false,
    })

    expect(model.regions.left.width).toBe(90)
    expect(model.regions.center.width).toBe(80)
    expect(model.regions.right.width).toBe(140)
    expect(model.gridTemplateColumns).toBe('90px minmax(0, 1fr) 140px')
    expect(model.horizontalScrollbarStyle).toEqual({ height: 8, marginLeft: 90, marginRight: 140 })
  })

  it('keeps center region valid when every column is pinned', () => {
    const model = buildTableLayoutModel({
      visibleLeafColumns: [column('status', 90, 'left'), column('name', 140, 'right')],
      tableWidthMode: 'fill-last',
      enableColumnReordering: true,
      hasVScroll: false,
    })

    expect(model.regions.center.columns).toHaveLength(0)
    expect(model.regions.center.width).toBe(0)
    expect(model.regions.center.tableWidthMode).toBe('fill-last')
    expect(model.regions.center.reorderEnabled).toBe(true)
  })
})
