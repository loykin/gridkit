import { spawn } from 'node:child_process'
import { once } from 'node:events'
import test from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const PORT = 5177
const BASE_URL = `http://127.0.0.1:${PORT}`

let server
let browser
let serverOutput = ''
const detachedServer = process.platform !== 'win32'

async function waitForServer(url, timeout = 20_000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Retry until Vite starts accepting connections.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

test.before(async () => {
  server = spawn(
    'pnpm',
    ['--dir', 'playground', 'dev', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
    {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none' },
      detached: detachedServer,
    },
  )

  server.stdout.on('data', (chunk) => {
    serverOutput += String(chunk)
  })
  server.stderr.on('data', (chunk) => {
    serverOutput += String(chunk)
  })

  await waitForServer(BASE_URL).catch((error) => {
    throw new Error(`${error.message}\n\nServer output:\n${serverOutput}`)
  })
  browser = await chromium.launch()
})

test.after(async () => {
  await browser?.close()
  if (!server || server.killed) return

  const killServer = (signal) => {
    if (detachedServer && server.pid) {
      try {
        process.kill(-server.pid, signal)
        return
      } catch {
        // Fall back to killing the direct child below.
      }
    }
    server.kill(signal)
  }

  killServer('SIGTERM')
  const exited = await Promise.race([
    once(server, 'exit').then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 1000)),
  ])
  if (!exited) killServer('SIGKILL')
})

async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE_URL)
  await page.evaluate(() => localStorage.clear())
  return page
}

async function closePage(page) {
  await page.close()
}

async function openTab(page, label) {
  await page.getByRole('button', { name: label }).click()
}

async function leafHeaderIds(page) {
  return page
    .locator('.gridkit-header .gridkit-header-row')
    .first()
    .locator('[role="columnheader"][data-col-id]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-col-id')))
}

test('column resize does not trigger column reorder', async () => {
  const page = await newPage()
  await openTab(page, 'State Persistence')
  await page.evaluate(() => localStorage.removeItem('gridkit:playground:persisted-state'))
  await page.reload()
  await openTab(page, 'State Persistence')

  const nameHeader = page.locator('.gridkit-header [role="columnheader"][data-col-id="name"]').first()
  const beforeBox = await nameHeader.boundingBox()
  assert.ok(beforeBox)

  const beforeOrder = await leafHeaderIds(page)
  const handle = nameHeader.locator('.gridkit-resize-handle')
  const handleBox = await handle.boundingBox()
  assert.ok(handleBox)

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x - 80, handleBox.y + handleBox.height / 2, { steps: 8 })
  await page.mouse.up()

  await page.waitForFunction(
    ({ selector, width }) => {
      const node = globalThis.document.querySelector(selector)
      return !!node && node.getBoundingClientRect().width < width - 20
    },
    { selector: '.gridkit-header [role="columnheader"][data-col-id="name"]', width: beforeBox.width },
    { timeout: 1000 },
  )
  const afterBox = await nameHeader.boundingBox()
  assert.ok(afterBox)
  const afterOrder = await leafHeaderIds(page)

  assert.deepEqual(afterOrder, beforeOrder)
  assert.ok(afterBox.width < beforeBox.width - 20, `expected Name width to shrink from ${beforeBox.width}, got ${afterBox.width}`)
  await closePage(page)
})

test('header groups span their leaf header range', async () => {
  const page = await newPage()
  await openTab(page, 'Header Groups')

  const organization = page.getByRole('columnheader', { name: 'Organization' }).first()
  const department = page.getByRole('columnheader', { name: /Department/ }).first()
  const status = page.getByRole('columnheader', { name: /Status/ }).first()

  const orgBox = await organization.boundingBox()
  const deptBox = await department.boundingBox()
  const statusBox = await status.boundingBox()
  assert.ok(orgBox)
  assert.ok(deptBox)
  assert.ok(statusBox)

  assert.ok(orgBox.x <= deptBox.x + 1, `Organization starts after Department: ${orgBox.x} > ${deptBox.x}`)
  assert.ok(
    orgBox.x + orgBox.width >= statusBox.x + statusBox.width - 1,
    `Organization does not cover Status: ${orgBox.x + orgBox.width} < ${statusBox.x + statusBox.width}`,
  )
  await closePage(page)
})

test('header theme tokens style header cells and filter row', async () => {
  const page = await newPage()
  await openTab(page, 'Fill Container')

  await page.addStyleTag({
    content: `
      .gridkit-token-test {
        --gridkit-header-background: rgb(1 2 3);
        --gridkit-header-foreground: rgb(250 251 252);
        --gridkit-header-border: rgb(70 80 90);
        --gridkit-header-control-background: rgb(10 20 30);
        --gridkit-header-control-foreground: rgb(230 240 250);
        --gridkit-header-control-border: rgb(40 50 60);
        --gridkit-header-popover-background: rgb(4 5 6);
        --gridkit-header-popover-foreground: rgb(240 241 242);
        --gridkit-header-popover-border: rgb(90 91 92);
      }
    `,
  })
  await page.locator('[data-testid="fill-long-case"] .gridkit-shell').evaluate((node) => node.classList.add('gridkit-token-test'))
  await page.evaluate(() => {
    if (globalThis.document.activeElement instanceof globalThis.HTMLElement) {
      globalThis.document.activeElement.blur()
    }
  })

  const styles = await page.evaluate(() => {
    const header = globalThis.document.querySelector('.gridkit-token-test .gridkit-header')
    const leafCell = globalThis.document.querySelector('.gridkit-token-test .gridkit-header-cell[data-col-id="id"]')
    const groupCell = globalThis.document.querySelector('.gridkit-token-test .gridkit-header-cell[data-header-group="true"]')
    const filterRow = globalThis.document.querySelector('.gridkit-token-test .gridkit-filter-row')
    const input = Array.from(globalThis.document.querySelectorAll('.gridkit-token-test .gridkit-filter-row .gridkit-input'))
      .find((node) => node !== globalThis.document.activeElement)
    const select = globalThis.document.querySelector('.gridkit-token-test .gridkit-filter-row .gridkit-select')
    const read = (node) => {
      const style = getComputedStyle(node)
      return {
        background: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
        borderBottomColor: style.borderBottomColor,
        controlBorder: style.getPropertyValue('--gridkit-control-border').trim(),
        headerControlBorder: style.getPropertyValue('--gridkit-header-control-border').trim(),
      }
    }

    return {
      header: read(header),
      leafCell: read(leafCell),
      groupCell: read(groupCell),
      filterRow: read(filterRow),
      input: read(input),
      select: read(select),
    }
  })

  assert.equal(styles.header.background, 'rgb(1, 2, 3)')
  assert.equal(styles.leafCell.background, 'rgb(1, 2, 3)')
  assert.equal(styles.leafCell.color, 'rgb(250, 251, 252)')
  assert.equal(styles.filterRow.background, 'rgb(1, 2, 3)')
  assert.equal(styles.filterRow.borderBottomColor, 'rgb(70, 80, 90)')
  assert.equal(styles.groupCell.background, 'rgb(1, 2, 3)')
  assert.equal(styles.groupCell.color, 'rgb(250, 251, 252)')
  assert.equal(styles.input.background, 'rgb(10, 20, 30)')
  assert.equal(styles.input.color, 'rgb(230, 240, 250)')
  assert.equal(styles.input.headerControlBorder, 'rgb(40 50 60)')
  assert.equal(styles.select.background, 'rgb(10, 20, 30)')
  assert.equal(styles.select.color, 'rgb(230, 240, 250)')
  assert.equal(styles.select.headerControlBorder, 'rgb(40 50 60)')

  await page.locator('[data-testid="fill-long-case"]').getByRole('button', { name: 'Pin options for id' }).click()
  const popover = page.locator('.gridkit-header-popover').last()
  await popover.waitFor({ state: 'visible', timeout: 1000 })
  const popoverStyles = await popover.evaluate((node) => {
    const style = getComputedStyle(node)
    return {
      background: style.backgroundColor,
      color: style.color,
      borderColor: style.borderColor,
    }
  })

  assert.equal(popoverStyles.background, 'rgb(4, 5, 6)')
  assert.equal(popoverStyles.color, 'rgb(240, 241, 242)')
  assert.equal(popoverStyles.borderColor, 'rgb(90, 91, 92)')

  await closePage(page)
})

test('fillContainer preserves natural height until body overflow', async () => {
  const page = await newPage()
  await openTab(page, 'Fill Container')

  const readCase = async (testId) => page.locator(`[data-testid="${testId}"]`).evaluate((root) => {
    const shell = root.querySelector('.gridkit-shell')
    const tableWrapper = root.querySelector('.gridkit-frame')
    const body = root.querySelector('.gridkit-body-scroll')
    const footer = root.querySelector('.gridkit-footer')
    const rect = (node) => {
      const box = node.getBoundingClientRect()
      return { top: box.top, bottom: box.bottom, height: box.height }
    }

    return {
      shell: rect(shell),
      tableWrapper: rect(tableWrapper),
      body: { clientHeight: body.clientHeight, scrollHeight: body.scrollHeight },
      footer: footer ? rect(footer) : null,
    }
  })

  await page.waitForTimeout(300)
  const shortCase = await readCase('fill-short-case')
  const longCase = await readCase('fill-long-case')

  assert.ok(
    shortCase.body.scrollHeight <= shortCase.body.clientHeight + 1,
    `short data should not scroll: ${shortCase.body.scrollHeight} > ${shortCase.body.clientHeight}`,
  )
  assert.ok(shortCase.footer.top - shortCase.tableWrapper.bottom < 20)

  assert.ok(
    longCase.body.scrollHeight > longCase.body.clientHeight + 100,
    `long data should scroll: ${longCase.body.scrollHeight} <= ${longCase.body.clientHeight}`,
  )
  assert.ok(
    Math.abs(longCase.footer.bottom - longCase.shell.bottom) < 2,
    `footer should stay at shell bottom: ${longCase.footer.bottom} != ${longCase.shell.bottom}`,
  )

  await closePage(page)
})

test('fillContainer row date filters and horizontal scrollbar stay within layout', async () => {
  const page = await newPage()
  await openTab(page, 'Fill Container')

  const layout = await page.evaluate(() => {
    const root = globalThis.document.querySelector('[data-testid="fill-long-case"]')
    const bodyCenter = root?.querySelector('.gridkit-region.gridkit-region--center > .gridkit-body-scroll')
    const headerCenter = root?.querySelector('.gridkit-header .gridkit-region.gridkit-region--center')
    const hTrack = root?.querySelector('.gridkit-scrollbar-track:not([style*="absolute"])')
    const dateButton = root?.querySelector('.gridkit-filter-cell [aria-label="Filter startDate by date"]')
    const dateCell = dateButton?.closest('.gridkit-filter-cell')
    const rect = (node) => {
      const box = node?.getBoundingClientRect()
      return box ? { width: box.width, height: box.height, top: box.top, bottom: box.bottom } : null
    }

    if (bodyCenter) {
      bodyCenter.scrollLeft = 20
      bodyCenter.dispatchEvent(new globalThis.Event('scroll', { bubbles: true }))
    }

    return {
      dateInputsInRow: root?.querySelectorAll('.gridkit-filter-cell input[type="date"]').length ?? 0,
      dateCell: rect(dateCell),
      dateCellScrollWidth: dateCell?.scrollWidth ?? null,
      dateCellClientWidth: dateCell?.clientWidth ?? null,
      bodyScrollWidth: bodyCenter?.scrollWidth ?? 0,
      bodyClientWidth: bodyCenter?.clientWidth ?? 0,
      bodyScrollLeft: bodyCenter?.scrollLeft ?? 0,
      headerScrollLeft: headerCenter?.scrollLeft ?? 0,
      hTrack: rect(hTrack),
    }
  })

  assert.equal(layout.dateInputsInRow, 0)
  assert.ok(layout.dateCell)
  assert.equal(layout.dateCellScrollWidth, layout.dateCellClientWidth)
  assert.ok(layout.bodyScrollWidth > layout.bodyClientWidth)
  assert.ok(layout.hTrack)
  assert.ok(layout.hTrack.height >= 7, `Horizontal scrollbar is collapsed: ${layout.hTrack.height}`)
  assert.equal(layout.headerScrollLeft, layout.bodyScrollLeft)

  await page.locator('[data-testid="fill-long-case"]').getByRole('button', { name: 'Filter startDate by date' }).click()
  const popoverInputs = page.locator('.gridkit-header-popover input[type="date"]')
  assert.equal(await popoverInputs.count(), 2)

  await closePage(page)
})

test('fillParent fills parent height and virtualizes overflowing rows', async () => {
  const page = await newPage()
  await openTab(page, 'Fill Parent')

  const readCase = async (testId) => page.locator(`[data-testid="${testId}"]`).evaluate((root) => {
    const shell = root.querySelector('.gridkit-shell')
    const body = root.querySelector('.gridkit-body-scroll')
    const footer = root.querySelector('.gridkit-footer')
    const rows = root.querySelectorAll('.gridkit-row')
    const rect = (node) => {
      const box = node.getBoundingClientRect()
      return { top: box.top, bottom: box.bottom, height: box.height }
    }

    return {
      root: rect(root),
      shell: rect(shell),
      body: { clientHeight: body.clientHeight, scrollHeight: body.scrollHeight },
      footer: footer ? rect(footer) : null,
      marker: shell.getAttribute('data-fill-parent'),
      rowCount: rows.length,
    }
  })

  await page.waitForTimeout(300)
  const shortCase = await readCase('fill-parent-short-case')
  const longCase = await readCase('fill-parent-long-case')

  assert.equal(shortCase.marker, 'true')
  assert.ok(
    Math.abs(shortCase.footer.bottom - shortCase.shell.bottom) < 2,
    `short footer should stay at shell bottom: ${shortCase.footer.bottom} != ${shortCase.shell.bottom}`,
  )

  assert.equal(longCase.marker, 'true')
  assert.ok(
    longCase.body.scrollHeight > longCase.body.clientHeight + 100,
    `long data should scroll: ${longCase.body.scrollHeight} <= ${longCase.body.clientHeight}`,
  )
  assert.ok(
    Math.abs(longCase.footer.bottom - longCase.shell.bottom) < 2,
    `long footer should stay at shell bottom: ${longCase.footer.bottom} != ${longCase.shell.bottom}`,
  )
  assert.ok(longCase.rowCount < 500, `expected virtualized rows, got ${longCase.rowCount}`)

  await closePage(page)
})

test('datetime range popover shows seconds inputs without clipping', async () => {
  const page = await newPage()
  await openTab(page, 'Log Stream')

  const timeHeader = page.locator('.gridkit-header [role="columnheader"][data-col-id="timestamp"]').first()
  await timeHeader.locator('button').click()

  const popover = page.locator('.gridkit-popover-content').last()
  const inputs = popover.locator('input[type="datetime-local"]')
  await assert.doesNotReject(async () => {
    await popover.waitFor({ state: 'visible', timeout: 1000 })
    assert.equal(await inputs.count(), 2)
    await inputs.nth(1).waitFor({ state: 'visible', timeout: 1000 })
  })

  const popoverBox = await popover.boundingBox()
  const secondInputBox = await inputs.nth(1).boundingBox()
  assert.ok(popoverBox)
  assert.ok(secondInputBox)
  assert.ok(
    secondInputBox.x + secondInputBox.width <= popoverBox.x + popoverBox.width + 1,
    'datetime input overflows the popover',
  )
  await closePage(page)
})

test('state persistence restores column sizing after reload', async () => {
  const page = await newPage()
  await page.evaluate(() => localStorage.removeItem('gridkit:playground:persisted-state'))
  await openTab(page, 'State Persistence')

  const nameHeader = page.locator('.gridkit-header [role="columnheader"][data-col-id="name"]').first()
  await nameHeader.waitFor({ state: 'visible', timeout: 1000 })
  const beforeBox = await nameHeader.boundingBox()
  assert.ok(beforeBox)

  const handle = nameHeader.locator('.gridkit-resize-handle')
  await handle.waitFor({ state: 'visible', timeout: 1000 })
  const handleBox = await handle.boundingBox()
  assert.ok(handleBox)
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x - 70, handleBox.y + handleBox.height / 2, { steps: 8 })
  await page.mouse.up()

  const resizedBox = await nameHeader.boundingBox()
  assert.ok(resizedBox)
  await page.waitForTimeout(500)
  await page.reload()
  await openTab(page, 'State Persistence')

  const restoredBox = await nameHeader.boundingBox()
  assert.ok(restoredBox)
  assert.ok(Math.abs(restoredBox.width - resizedBox.width) < 5)
  await closePage(page)
})

test('column visibility dropdown hides and restores a column', async () => {
  const page = await newPage()
  await openTab(page, 'State Persistence')
  await page.evaluate(() => localStorage.removeItem('gridkit:playground:persisted-state'))
  await page.reload()
  await openTab(page, 'State Persistence')

  const departmentHeader = page.locator('.gridkit-header [role="columnheader"][data-col-id="department"]').first()
  await assert.doesNotReject(async () => {
    assert.ok(await departmentHeader.isVisible())
  })

  await page.getByRole('button', { name: 'Choose visible columns' }).click()
  await page.getByRole('checkbox', { name: 'Toggle Department column visibility' }).click()
  await assert.doesNotReject(async () => {
    await departmentHeader.waitFor({ state: 'detached', timeout: 1000 })
  })

  await page.getByRole('checkbox', { name: 'Toggle Department column visibility' }).click()
  await assert.doesNotReject(async () => {
    await departmentHeader.waitFor({ state: 'visible', timeout: 1000 })
  })
  await closePage(page)
})

test('column pinning marks pinned headers as pinned', async () => {
  const page = await newPage()
  await openTab(page, 'Pinning UI')

  const nameHeader = page.locator('.gridkit-header [role="columnheader"][data-col-id="name"]').first()
  await nameHeader.getByRole('button', { name: 'Pin options for name' }).click()
  await page.getByRole('button', { name: 'Pin Left' }).click()

  await assert.doesNotReject(async () => {
    await nameHeader.waitFor({ state: 'visible' })
  })
  assert.equal(await nameHeader.getAttribute('data-pinned'), 'left')
  const position = await nameHeader.evaluate((node) => getComputedStyle(node).position)
  assert.equal(position, 'absolute')
  await closePage(page)
})

test('runtime right-pinned header aligns with body immediately after pinning', async () => {
  const page = await newPage()
  await page.setViewportSize({ width: 900, height: 900 })
  await openTab(page, 'Pinning UI')

  const statusHeader = page.locator('.gridkit-header [role="columnheader"][data-col-id="status"]').first()
  await statusHeader.getByRole('button', { name: 'Pin options for status' }).click()
  await page.getByRole('button', { name: 'Pin Right' }).click()
  await page.waitForTimeout(100)

  const positions = await page.evaluate(() => {
    const header = globalThis.document.querySelector('.gridkit-header [role="columnheader"][data-col-id="status"]')
    const cell = globalThis.document.querySelector('.gridkit-body-scroll [role="gridcell"][data-col-id="status"]')
    const rect = (node) => {
      const box = node?.getBoundingClientRect()
      return box ? { left: box.left, right: box.right, width: box.width } : null
    }

    return {
      header: rect(header),
      cell: rect(cell),
      headerPinned: header?.getAttribute('data-pinned') ?? null,
      cellPinned: cell?.getAttribute('data-pinned') ?? null,
    }
  })

  assert.ok(positions.header)
  assert.ok(positions.cell)
  assert.equal(positions.headerPinned, 'right')
  assert.equal(positions.cellPinned, 'right')
  assert.ok(
    Math.abs(positions.header.right - positions.cell.right) <= 1,
    `Runtime pinned Status header is not aligned with body: header ${positions.header.right}, cell ${positions.cell.right}`,
  )

  await closePage(page)
})

test('pinned body cells stay aligned while horizontally scrolling', async () => {
  const page = await newPage()
  await page.setViewportSize({ width: 900, height: 900 })
  await page.getByRole('button', { name: 'Column Pinning', exact: true }).click()

  const readPinned = async () => page.evaluate(() => {
    const readColumn = (id) => {
      const header = globalThis.document.querySelector(`.gridkit-header [role="columnheader"][data-col-id="${id}"]`)
      const cell = globalThis.document.querySelector(`.gridkit-body-scroll [role="gridcell"][data-col-id="${id}"]`)
      const rect = (node) => {
        const box = node?.getBoundingClientRect()
        return box ? { left: box.left, right: box.right, width: box.width } : null
      }

      return {
        header: rect(header),
        cell: rect(cell),
        headerPosition: header ? getComputedStyle(header).position : null,
        cellPosition: cell ? getComputedStyle(cell).position : null,
        headerPinned: header?.getAttribute('data-pinned') ?? null,
        cellPinned: cell?.getAttribute('data-pinned') ?? null,
      }
    }

    const scroller = globalThis.document.querySelector('.gridkit-region.gridkit-region--center > .gridkit-body-scroll')

    return {
      scrollLeft: scroller?.scrollLeft ?? 0,
      name: readColumn('name'),
      status: readColumn('status'),
    }
  })

  const before = await readPinned()
  assert.ok(before.name.header)
  assert.ok(before.name.cell)
  assert.ok(before.status.header)
  assert.ok(before.status.cell)
  assert.equal(before.name.headerPinned, 'left')
  assert.equal(before.name.cellPinned, 'left')
  assert.equal(before.status.headerPinned, 'right')
  assert.equal(before.status.cellPinned, 'right')
  assert.equal(before.name.cellPosition, 'static')
  assert.equal(before.status.cellPosition, 'static')
  assert.ok(
    Math.abs(before.name.cell.left - before.name.header.left) <= 1,
    `Initial Name body cell is not aligned with header: cell ${before.name.cell.left}, header ${before.name.header.left}`,
  )
  assert.ok(
    Math.abs(before.status.cell.right - before.status.header.right) <= 1,
    `Initial Status body cell is not aligned with header: cell ${before.status.cell.right}, header ${before.status.header.right}`,
  )

  await page.locator('.gridkit-region.gridkit-region--center > .gridkit-body-scroll').evaluate((node) => {
    node.scrollLeft = 100
    node.dispatchEvent(new globalThis.Event('scroll', { bubbles: true }))
  })
  await page.waitForTimeout(100)

  const after = await readPinned()
  assert.ok(after.scrollLeft > before.scrollLeft)
  assert.ok(after.name.header)
  assert.ok(after.name.cell)
  assert.ok(after.status.header)
  assert.ok(after.status.cell)
  assert.ok(
    Math.abs(after.name.cell.left - before.name.cell.left) <= 1,
    `Name body cell moved while pinned: before ${before.name.cell.left}, after ${after.name.cell.left}`,
  )
  assert.ok(
    Math.abs(after.status.cell.right - before.status.cell.right) <= 1,
    `Status body cell moved while pinned: before ${before.status.cell.right}, after ${after.status.cell.right}`,
  )
  assert.ok(
    Math.abs(after.name.cell.left - after.name.header.left) <= 1,
    `Name body cell is not aligned with header: cell ${after.name.cell.left}, header ${after.name.header.left}`,
  )
  assert.ok(
    Math.abs(after.status.cell.right - after.status.header.right) <= 1,
    `Status body cell is not aligned with header: cell ${after.status.cell.right}, header ${after.status.header.right}`,
  )

  await closePage(page)
})

test('right-pinned column resizes from the inner edge', async () => {
  const page = await newPage()
  await page.setViewportSize({ width: 900, height: 900 })
  await page.getByRole('button', { name: 'Column Pinning', exact: true }).click()

  const statusHeader = page.locator('.gridkit-header [role="columnheader"][data-col-id="status"]').first()
  const handle = statusHeader.locator('.gridkit-resize-handle')
  assert.equal(await handle.getAttribute('data-side'), 'left')

  const beforeBox = await statusHeader.boundingBox()
  const handleBox = await handle.boundingBox()
  assert.ok(beforeBox)
  assert.ok(handleBox)
  assert.ok(
    Math.abs(handleBox.x - beforeBox.x) <= 1,
    `Right-pinned resize handle should sit on the inner left edge: handle ${handleBox.x}, header ${beforeBox.x}`,
  )

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x - 40, handleBox.y + handleBox.height / 2, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(100)

  const afterBox = await statusHeader.boundingBox()
  assert.ok(afterBox)
  const beforeRight = beforeBox.x + beforeBox.width
  const afterRight = afterBox.x + afterBox.width
  assert.ok(afterBox.width > beforeBox.width, `Expected Status to grow, before ${beforeBox.width}, after ${afterBox.width}`)
  assert.ok(Math.abs(afterRight - beforeRight) <= 1, `Right edge should stay anchored: before ${beforeRight}, after ${afterRight}`)

  await closePage(page)
})

test('row actions menu opens and exposes action items', async () => {
  const page = await newPage()
  page.on('dialog', (dialog) => dialog.dismiss())
  await openTab(page, 'DataStore')

  const actionsButton = page.getByRole('button', { name: /Open row actions for row/ }).first()
  await actionsButton.click()

  const menu = page.locator('.gridkit-action-menu')
  await assert.doesNotReject(async () => {
    await menu.waitFor({ state: 'visible', timeout: 1000 })
  })
  await assert.doesNotReject(async () => {
    assert.ok(await page.getByRole('menuitem', { name: 'Logs' }).isVisible())
    assert.ok(await page.getByRole('menuitem', { name: 'Delete' }).isVisible())
  })
  await closePage(page)
})

test('row selection checkboxes update selection state', async () => {
  const page = await newPage()
  await openTab(page, 'Row Selection')

  await page.getByRole('checkbox', { name: 'Select row 1', exact: true }).click()
  await assert.doesNotReject(async () => {
    await page.getByText('checkboxConfig · 1 row(s) selected').waitFor({ state: 'visible', timeout: 1000 })
  })

  await page.getByRole('checkbox', { name: 'Select all rows' }).click()
  await assert.doesNotReject(async () => {
    await page.getByText('checkboxConfig · 20 row(s) selected').waitFor({ state: 'visible', timeout: 1000 })
  })
  await closePage(page)
})

test('inline edit commits a changed cell value', async () => {
  const page = await newPage()
  await openTab(page, 'Inline Edit')

  const nameCell = page.locator('.gridkit-row [role="gridcell"][data-col-id="name"]').first()
  await nameCell.dblclick()
  const editor = nameCell.locator('input')
  await editor.fill('Edited Employee')
  await editor.press('Enter')

  await assert.doesNotReject(async () => {
    await page.getByRole('gridcell', { name: 'Edited Employee' }).waitFor({ state: 'visible', timeout: 1000 })
    await page.getByText('[1] name → "Edited Employee"').waitFor({ state: 'visible', timeout: 1000 })
  })
  await closePage(page)
})

test('tree rows expand nested children', async () => {
  const page = await newPage()
  await openTab(page, 'Tree / Groups')

  await page.getByRole('button', { name: 'Expand row' }).first().click()
  await assert.doesNotReject(async () => {
    await page.getByText('Kubernetes').waitFor({ state: 'visible', timeout: 1000 })
  })

  await page.locator('.gridkit-row').filter({ hasText: 'Kubernetes' }).getByRole('button', { name: 'Expand row' }).click()
  await assert.doesNotReject(async () => {
    await page.getByText('Node Exporter').waitFor({ state: 'visible', timeout: 1000 })
  })
  await closePage(page)
})

test('master-detail rows expand and collapse detail panels', async () => {
  const page = await newPage()
  await openTab(page, 'Master-Detail')

  const expand = page.getByRole('button', { name: 'Expand detail row' }).first()
  await expand.click()
  await assert.doesNotReject(async () => {
    await page.getByText('EMP-0001').waitFor({ state: 'visible', timeout: 1000 })
  })

  await page.getByRole('button', { name: 'Collapse detail row' }).first().click()
  await assert.doesNotReject(async () => {
    await page.getByText('EMP-0001').waitFor({ state: 'hidden', timeout: 1000 })
  })
  await closePage(page)
})
