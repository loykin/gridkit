import type { Column, Header, HeaderGroup } from '@tanstack/react-table'
import { describe, expect, it } from 'vitest'
import { buildHeaderLayoutPlan } from '../buildHeaderLayoutPlan'

interface Row {
  a: string
  b: string
  c: string
}

function column(id: keyof Row, size: number, pin: false | 'left' | 'right' = false, startOffset = 0) {
  return {
    id,
    getSize: () => size,
    getIsPinned: () => pin,
    getStart: () => startOffset,
    getAfter: () => startOffset + size,
    getIsVisible: () => true,
  } as unknown as Column<Row, unknown>
}

function header({
  id,
  depth,
  col,
  colSpan = 1,
  isPlaceholder = false,
  subHeaders = [],
}: {
  id: string
  depth: number
  col: Column<Row, unknown>
  colSpan?: number
  isPlaceholder?: boolean
  subHeaders?: Header<Row, unknown>[]
}) {
  return {
    id,
    depth,
    column: col,
    colSpan,
    isPlaceholder,
    subHeaders,
  } as unknown as Header<Row, unknown>
}

function fixture() {
  const a = column('a', 80)
  const b = column('b', 120)
  const c = column('c', 140)
  const aTop = header({ id: 'a', depth: 0, col: a })
  const bLeaf = header({ id: 'b', depth: 1, col: b })
  const cLeaf = header({ id: 'c', depth: 1, col: c })
  const group = header({ id: 'group', depth: 0, col: b, colSpan: 2, subHeaders: [bLeaf, cLeaf] })
  const aPlaceholder = header({ id: 'a-placeholder', depth: 1, col: a, isPlaceholder: true })

  const headerGroups = [
    { id: '0', headers: [aTop, group] },
    { id: '1', headers: [aPlaceholder, bLeaf, cLeaf] },
  ] as unknown as HeaderGroup<Row>[]

  return { columns: [a, b, c], headerGroups }
}

function tanStackUngroupedFixture() {
  const a = column('a', 80)
  const b = column('b', 120)
  const c = column('c', 140)
  const aPlaceholder = header({ id: 'a-placeholder', depth: 0, col: a, isPlaceholder: true })
  const aLeaf = header({ id: 'a', depth: 1, col: a })
  const bLeaf = header({ id: 'b', depth: 1, col: b })
  const cLeaf = header({ id: 'c', depth: 1, col: c })
  const group = header({ id: 'group', depth: 0, col: b, colSpan: 2, subHeaders: [bLeaf, cLeaf] })

  const headerGroups = [
    { id: '0', headers: [aPlaceholder, group] },
    { id: '1', headers: [aLeaf, bLeaf, cLeaf] },
  ] as unknown as HeaderGroup<Row>[]

  return { columns: [a, b, c], headerGroups }
}

describe('buildHeaderLayoutPlan', () => {
  it('renders placeholder cells in padded mode', () => {
    const { columns, headerGroups } = fixture()
    const plan = buildHeaderLayoutPlan({
      headerGroups,
      visibleLeafColumns: columns,
      layout: 'padded',
      rowHeight: 36,
    })

    const placeholder = plan.cells.find((cell) => cell.id === 'a-placeholder')
    expect(placeholder).toMatchObject({ render: true, rowSpan: 1, height: 36 })
  })

  it('hides placeholder cells and spans ungrouped leaf headers in span mode', () => {
    const { columns, headerGroups } = fixture()
    const plan = buildHeaderLayoutPlan({
      headerGroups,
      visibleLeafColumns: columns,
      layout: 'span',
      rowHeight: 36,
    })

    expect(plan.cells.find((cell) => cell.id === 'a-placeholder')).toMatchObject({ render: false })
    expect(plan.cells.find((cell) => cell.id === 'a')).toMatchObject({ rowSpan: 2, height: 72 })
  })

  it('moves TanStack top placeholders below their ungrouped leaf header in padded mode', () => {
    const { columns, headerGroups } = tanStackUngroupedFixture()
    const plan = buildHeaderLayoutPlan({
      headerGroups,
      visibleLeafColumns: columns,
      layout: 'padded',
      rowHeight: 36,
    })

    expect(plan.cells.find((cell) => cell.id === 'a')).toMatchObject({ top: 0, rowSpan: 1, height: 36 })
    expect(plan.cells.find((cell) => cell.id === 'a-placeholder')).toMatchObject({ top: 36, render: true })
  })

  it('moves TanStack bottom leaf headers to the top and spans them in span mode', () => {
    const { columns, headerGroups } = tanStackUngroupedFixture()
    const plan = buildHeaderLayoutPlan({
      headerGroups,
      visibleLeafColumns: columns,
      layout: 'span',
      rowHeight: 36,
    })

    expect(plan.cells.find((cell) => cell.id === 'a')).toMatchObject({ top: 0, rowSpan: 2, height: 72 })
    expect(plan.cells.find((cell) => cell.id === 'a-placeholder')).toMatchObject({ render: false })
  })

  it('spans pinned ungrouped leaf to the top in span mode', () => {
    const a = column('a', 80, 'left', 0)
    const b = column('b', 120)
    const c = column('c', 140)
    const aPlaceholder = header({ id: 'a-placeholder', depth: 0, col: a, isPlaceholder: true })
    const aLeaf = header({ id: 'a', depth: 1, col: a })
    const bLeaf = header({ id: 'b', depth: 1, col: b })
    const cLeaf = header({ id: 'c', depth: 1, col: c })
    const group = header({ id: 'group', depth: 0, col: b, colSpan: 2, subHeaders: [bLeaf, cLeaf] })

    const headerGroups = [
      { id: '0', headers: [aPlaceholder, group] },
      { id: '1', headers: [aLeaf, bLeaf, cLeaf] },
    ] as unknown as HeaderGroup<Row>[]

    const plan = buildHeaderLayoutPlan({
      headerGroups,
      visibleLeafColumns: [a, b, c],
      layout: 'span',
      rowHeight: 36,
    })

    expect(plan.cells.find((cell) => cell.id === 'a')).toMatchObject({
      top: 0,
      rowSpan: 2,
      height: 72,
      pin: 'left',
    })
    expect(plan.cells.find((cell) => cell.id === 'a-placeholder')).toMatchObject({ render: false })
  })

  it('places pinned ungrouped leaf at top with placeholder below in padded mode', () => {
    const a = column('a', 80, 'left', 0)
    const b = column('b', 120)
    const c = column('c', 140)
    const aPlaceholder = header({ id: 'a-placeholder', depth: 0, col: a, isPlaceholder: true })
    const aLeaf = header({ id: 'a', depth: 1, col: a })
    const bLeaf = header({ id: 'b', depth: 1, col: b })
    const cLeaf = header({ id: 'c', depth: 1, col: c })
    const group = header({ id: 'group', depth: 0, col: b, colSpan: 2, subHeaders: [bLeaf, cLeaf] })

    const headerGroups = [
      { id: '0', headers: [aPlaceholder, group] },
      { id: '1', headers: [aLeaf, bLeaf, cLeaf] },
    ] as unknown as HeaderGroup<Row>[]

    const plan = buildHeaderLayoutPlan({
      headerGroups,
      visibleLeafColumns: [a, b, c],
      layout: 'padded',
      rowHeight: 36,
    })

    expect(plan.cells.find((cell) => cell.id === 'a')).toMatchObject({ top: 0, rowSpan: 1, pin: 'left' })
    expect(plan.cells.find((cell) => cell.id === 'a-placeholder')).toMatchObject({ top: 36, render: true })
  })

  it('sizes group headers to the sum of their leaf columns', () => {
    const { columns, headerGroups } = fixture()
    const plan = buildHeaderLayoutPlan({
      headerGroups,
      visibleLeafColumns: columns,
      layout: 'padded',
      rowHeight: 36,
    })

    expect(plan.cells.find((cell) => cell.id === 'group')).toMatchObject({
      colSpan: 2,
      left: 80,
      width: 260,
    })
  })
})
